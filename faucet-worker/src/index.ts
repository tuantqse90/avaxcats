import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  isAddress,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

// ❓ Vì sao faucet phải là Worker mà không nhét thẳng vào trang web?
// → Muốn gửi AVAX thì phải KÝ giao dịch bằng private key. Bất cứ thứ gì nằm trong bundle JS đều đọc được
//   bằng View Source → bot rút sạch ví trong vài phút. Key chỉ được sống ở phía server (secret của Worker).
//
// ❓ Sao không làm faucet bằng contract cho khỏi cần server?
// → Ví học viên mới tạo có 0 AVAX nên không trả nổi gas để gọi claim(). Đúng lúc cần faucet nhất thì
//   contract-only bó tay. Vì vậy vẫn cần một ví nóng ký hộ.

export interface Env {
  FAUCET_KV: KVNamespace;
  FAUCET_PRIVATE_KEY: string;
  TURNSTILE_SECRET?: string;
  DRIP_AMOUNT?: string;
  COOLDOWN_HOURS?: string;
  ALLOWED_ORIGINS?: string;
  RPC_URL?: string;
}

type ClaimRecord = { at: number; hash: string };

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // ❓ Sao không trả về "*"?
  // → ACAO "*" cho phép mọi trang gọi faucet, kể cả site clone dựng lên để farm. Chỉ echo lại origin
  //   khi nó nằm trong danh sách cho phép; origin lạ thì không có header CORS → browser tự chặn.
  const ok = origin && allowed.includes(origin);
  return {
    "access-control-allow-origin": ok ? origin : allowed[0] ?? "null",
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(body: unknown, status: number, extra: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await r.json()) as { success?: boolean };
  return data.success === true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const rpc = env.RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpc),
    });

    // ─── GET / — trạng thái faucet, để bro tự kiểm tra ví còn bao nhiêu ──────────
    if (request.method === "GET") {
      if (!env.FAUCET_PRIVATE_KEY) {
        return json({ ok: false, error: "not_configured" }, 503, cors);
      }
      const account = privateKeyToAccount(env.FAUCET_PRIVATE_KEY as `0x${string}`);
      const balance = await publicClient.getBalance({ address: account.address });
      const drip = parseEther(env.DRIP_AMOUNT ?? "0.005");
      return json(
        {
          ok: true,
          faucet: account.address,
          balance: formatEther(balance),
          drip: formatEther(drip),
          claimsLeft: drip > 0n ? Number(balance / drip) : 0,
          cooldownHours: Number(env.COOLDOWN_HOURS ?? "24"),
          chain: "avalanche-fuji",
        },
        200,
        cors,
      );
    }

    if (request.method !== "POST" || url.pathname !== "/claim") {
      return json({ ok: false, error: "not_found" }, 404, cors);
    }

    // ─── POST /claim ────────────────────────────────────────────────────────────
    if (!env.FAUCET_PRIVATE_KEY) {
      return json({ ok: false, error: "not_configured" }, 503, cors);
    }

    let body: { address?: string; turnstileToken?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ ok: false, error: "bad_json" }, 400, cors);
    }

    const raw = (body.address ?? "").trim();
    if (!isAddress(raw)) {
      return json(
        { ok: false, error: "bad_address", message: "Địa chỉ ví không hợp lệ." },
        400,
        cors,
      );
    }
    // ❓ Vì sao phải getAddress rồi mới lowercase?
    // → getAddress vừa chuẩn hoá về dạng checksum vừa loại địa chỉ sai. Khoá KV thì dùng bản lowercase
    //   để "0xAbC…" và "0xabc…" không lách được thành 2 lượt nhận khác nhau.
    const address = getAddress(raw);
    const addrKey = `addr:${address.toLowerCase()}`;

    const ip = request.headers.get("CF-Connecting-IP");
    const ipKey = ip ? `ip:${ip}` : null;

    if (env.TURNSTILE_SECRET) {
      const token = (body.turnstileToken ?? "").trim();
      if (!token || !(await verifyTurnstile(token, env.TURNSTILE_SECRET, ip))) {
        return json(
          { ok: false, error: "captcha_failed", message: "Xác minh captcha thất bại." },
          403,
          cors,
        );
      }
    }

    const cooldownHours = Number(env.COOLDOWN_HOURS ?? "24");
    const cooldownSec = Math.max(60, Math.round(cooldownHours * 3600));
    const now = Date.now();

    // ❓ Vì sao check cả địa chỉ lẫn IP?
    // → Chặn địa chỉ thôi thì bot tạo ví mới vô hạn (miễn phí). Chặn IP thôi thì cả phòng workshop
    //   dùng chung wifi sẽ kẹt nhau. Cần cả hai, và IP nới lỏng hơn ở dưới.
    for (const [key, label] of [
      [addrKey, "địa chỉ này"],
      [ipKey, "IP này"],
    ] as const) {
      if (!key) continue;
      const hit = await env.FAUCET_KV.get(key, "json");
      if (hit) {
        const rec = hit as ClaimRecord;
        const waitSec = Math.max(0, cooldownSec - Math.floor((now - rec.at) / 1000));
        return json(
          {
            ok: false,
            error: "cooldown",
            message: `Đã phát cho ${label} rồi. Thử lại sau ${Math.ceil(waitSec / 3600)} giờ.`,
            retryAfterSeconds: waitSec,
            previousHash: rec.hash,
          },
          429,
          { ...cors, "retry-after": String(waitSec) },
        );
      }
    }

    const account = privateKeyToAccount(env.FAUCET_PRIVATE_KEY as `0x${string}`);
    const drip = parseEther(env.DRIP_AMOUNT ?? "0.005");

    // ❓ Vì sao trừ hao 21000 gas khi so số dư?
    // → Chuyển AVAX thuần tốn đúng 21000 gas. Nếu ví chỉ còn đúng bằng drip thì tx sẽ fail vì không đủ
    //   trả gas; báo "hết tiền" trước cho rõ ràng thay vì để giao dịch revert.
    const gasPrice = await publicClient.getGasPrice();
    const reserve = 21_000n * gasPrice;
    const balance = await publicClient.getBalance({ address: account.address });
    if (balance < drip + reserve) {
      return json(
        {
          ok: false,
          error: "faucet_empty",
          message: "Faucet đã hết AVAX test. Báo ban tổ chức nạp thêm giúp.",
          balance: formatEther(balance),
        },
        503,
        cors,
      );
    }

    // ❓ Vì sao ghi KV TRƯỚC khi gửi giao dịch?
    // → Giữ chỗ. Nếu ghi sau, hai request bấm cùng lúc sẽ cùng thấy "chưa nhận" và nhận 2 lần.
    //   Gửi thất bại thì xoá key đi ở dưới để người dùng thử lại được.
    const record: ClaimRecord = { at: now, hash: "" };
    await env.FAUCET_KV.put(addrKey, JSON.stringify(record), {
      expirationTtl: cooldownSec,
    });
    if (ipKey) {
      await env.FAUCET_KV.put(ipKey, JSON.stringify(record), {
        expirationTtl: cooldownSec,
      });
    }

    const wallet = createWalletClient({
      account,
      chain: avalancheFuji,
      transport: http(rpc),
    });

    try {
      // ❓ Sao phải tự lấy nonce "pending" và thử lại?
      // → Nhiều người bấm cùng lúc thì các request cùng đọc một nonce → chỉ 1 tx qua, số còn lại lỗi
      //   "nonce too low". Lấy nonce pending rồi thử lại 2 lần là đủ cho quy mô một buổi workshop.
      let hash: `0x${string}` | undefined;
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const nonce = await publicClient.getTransactionCount({
            address: account.address,
            blockTag: "pending",
          });
          hash = await wallet.sendTransaction({
            to: address,
            value: drip,
            gas: 21_000n,
            nonce,
          });
          break;
        } catch (e) {
          lastErr = e;
          const msg = String(e);
          if (!/nonce|replacement|already known/i.test(msg)) throw e;
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
      if (!hash) throw lastErr ?? new Error("send failed");

      const done: ClaimRecord = { at: now, hash };
      await env.FAUCET_KV.put(addrKey, JSON.stringify(done), {
        expirationTtl: cooldownSec,
      });
      if (ipKey) {
        await env.FAUCET_KV.put(ipKey, JSON.stringify(done), {
          expirationTtl: cooldownSec,
        });
      }

      return json(
        {
          ok: true,
          hash,
          amount: formatEther(drip),
          to: address,
          explorer: `https://testnet.snowtrace.io/tx/${hash}`,
        },
        200,
        cors,
      );
    } catch (e) {
      // Gửi hỏng → nhả chỗ đã giữ để người dùng bấm lại được ngay.
      await env.FAUCET_KV.delete(addrKey);
      if (ipKey) await env.FAUCET_KV.delete(ipKey);
      return json(
        {
          ok: false,
          error: "send_failed",
          message: "Gửi giao dịch thất bại, thử lại sau ít phút.",
          detail: String(e).slice(0, 200),
        },
        502,
        cors,
      );
    }
  },
} satisfies ExportedHandler<Env>;
