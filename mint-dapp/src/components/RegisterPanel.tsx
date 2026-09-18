"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { activeChain, CHAIN_LABEL } from "@/lib/chains";
import { AVAXCATS_ABI, explorerAddress } from "@/lib/contract";
import { useContractAddress } from "@/lib/deployed";
import { type GoogleIdentity } from "@/lib/google";
import { GoogleSignIn } from "./GoogleSignIn";
import {
  Button,
  Card,
  Chapter,
  Hint,
  Icon,
  Input,
  Label,
  Mono,
  Status,
} from "./ui";
import {
  forgetKpi,
  hasKpiEndpoint,
  submitKpi,
  useKpiSubmitted,
  type KpiPayload,
} from "@/lib/kpi";

// ❓ Dòng replace(/[/?].*$/, "") để làm gì?
// → Link X thường có đuôi: x.com/abc?s=20 hoặc x.com/abc/status/123. Cắt từ dấu "/" hoặc "?" đầu tiên để chỉ giữ handle.
function normalizeX(v: string) {
  const t = v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?(x|twitter)\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "")
    .trim();
  return t ? "@" + t : "";
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </label>
  );
}

export function RegisterPanel() {
  const { address: wallet, isConnected } = useAccount();
  const { address: contract, isConfigured } = useContractAddress();
  // ❓ done là gì?
  // → Bản ghi đã gửi trước đó, đọc từ localStorage qua useSyncExternalStore (xem lib/kpi.ts). Có done → hiện màn
  //   "Registered" thay vì form, để F5 không làm người dùng gửi trùng.
  const done = useKpiSubmitted();

  // ❓ balanceOf để làm gì ở form đăng ký?
  // → Đọc số NFT ví này đang giữ trong contract (ERC-721 balanceOf) để gửi kèm KPI "minted" — bằng chứng đã xong bước 2.
  //   args chỉ có khi wallet tồn tại; enabled chặn gọi khi chưa có contract hoặc chưa kết nối.
  const { data: balance } = useReadContract({
    abi: AVAXCATS_ABI,
    address: contract,
    chainId: activeChain.id,
    functionName: "balanceOf",
    args: wallet ? [wallet] : undefined,
    query: { enabled: isConfigured && !!wallet },
  });

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [x, setX] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [google, setGoogle] = useState<GoogleIdentity | null>(null);

  // ❓ Vì sao email đã đăng nhập Google rồi mà vẫn cho sửa tay?
  // → Có người đăng nhập Builder Hub bằng GitHub hoặc email OTP, Google account của họ là địa chỉ khác.
  //   Cho sửa, nhưng sửa lệch đi thì bỏ luôn dấu "đã xác minh" — không được để token của email này
  //   đi kèm một email khác.
  const verified = google !== null && google.email === contact.trim();

  // ❓ Sao lại Number(balance ?? 0n)?
  // → balance là bigint (uint256); JSON.stringify không serialize được bigint nên phải đổi sang number trước khi gửi.
  const minted = Number(balance ?? 0n);
  // ❓ Regex email này kiểm tra gì?
  // → Chỉ kiểm tra tối thiểu: có đúng 1 "@", có dấu "." sau đó, không khoảng trắng. Mục tiêu là bắt lỗi gõ nhầm;
  //   có phải Gmail trên Builder Hub hay không thì ban tổ chức đối chiếu sau.
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  // ❓ Điều kiện để bấm Submit?
  // → Ví đã kết nối (để có wallet address), có tên, email hợp lệ, và không đang gửi (chặn double-submit).
  //   X là tuỳ chọn — không bắt buộc phải điền.
  const canSend = isConnected && name.trim() !== "" && validEmail && !sending;

  async function send() {
    setSending(true);
    setResult(null);
    setFailed(false);
    // ❓ Payload gửi lên gồm gì?
    // → Phần người dùng nhập (đã trim/chuẩn hoá) + phần tự lấy từ bước 1–2: wallet, contract, chain/chainId, số NFT.
    //   at = timestamp ISO để sheet ghi thời điểm; l1 để trống, dành cho bài sau (deploy L1 riêng).
    const payload: KpiPayload = {
      name: name.trim(),
      contact: contact.trim(),
      // ❓ Gửi cả JWT gốc lên làm gì?
      // → Để server verify được chữ ký của Google rồi mới tin email. Chỉ gửi khi email trên form vẫn
      //   đúng email trong token; sửa tay lệch đi thì gửi "" cho khỏi gây hiểu nhầm là đã xác minh.
      idToken: verified && google ? google.credential : "",
      x: normalizeX(x),
      wallet: wallet ?? "",
      contract,
      l1: "",
      chain: CHAIN_LABEL,
      chainId: activeChain.id,
      minted,
      at: new Date().toISOString(),
    };
    // ❓ r.ok nhưng confirmed = false nghĩa là gì?
    // → Đã gửi được nhưng browser không đọc được response (rơi vào nhánh no-cors trong lib/kpi.ts vì Apps Script chặn CORS).
    //   Vì vậy thông báo khuyên người dùng kiểm tra Google Sheet thay vì khẳng định server đã nhận.
    const r = await submitKpi(payload);
    setSending(false);
    if (r.ok) {
      setResult(
        r.confirmed
          ? "Sent — the server confirmed receipt."
          : "Sent. The browser couldn't read the response (Apps Script blocks CORS) — check the Google Sheet for a new row.",
      );
    } else {
      setFailed(true);
      setResult(`Submission failed: ${r.reason}`);
    }
  }

  if (done) {
    return (
      <section className="anim-rise">
        <Chapter n="03" label="Register" title="Registered" />
        <Card className="p-5 md:p-6">
          {done.confirmed ? (
            <Status tone="ok">Sent — the server confirmed receipt.</Status>
          ) : (
            <Status tone="warn">
              Sent, but the browser couldn&apos;t read the response (Apps Script blocks
              CORS), so it&apos;s unconfirmed — check the Google Sheet; if there is no new
              row, send again.
            </Status>
          )}

          <dl className="mt-6 border-t border-line">
            {[
              ["Name", done.name],
              ["Gmail (Builder Hub)", done.contact],
              ["X account", done.x],
              ["Wallet", done.wallet],
              ["Contract", done.contract],
              ...(done.l1 ? [["L1", done.l1]] : []),
              ["NFTs minted", String(done.minted)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="grid gap-x-8 gap-y-1 border-b border-line py-3 sm:grid-cols-[12rem_1fr]"
              >
                <dt className="eyebrow self-center text-muted">{k}</dt>
                <dd className="min-w-0">
                  <Mono className="text-fg">{v}</Mono>
                </dd>
              </div>
            ))}
          </dl>

          <Button className="mt-6" onClick={forgetKpi}>
            Edit / send again
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="anim-rise">
      <Chapter
        n="03"
        label="Register"
        title="Complete your registration"
        desc="Fill this in so the organizers can record that you finished. Contract and wallet are taken from steps 1–2."
      />

      <Card className="p-5 md:p-6">
        <GoogleSignIn
          onIdentity={(id) => {
            setGoogle(id);
            setContact(id.email);
            // Chỉ điền tên khi ô còn trống — đừng đè lên thứ người ta đã tự gõ.
            setName((prev) => (prev.trim() === "" ? id.name : prev));
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Gmail · required"
            hint={
              verified
                ? "✓ Đã xác minh qua Google"
                : "The Gmail you registered on Builder Hub"
            }
          >
            <Input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@gmail.com"
            />
          </Field>

          <Field label="Name · required">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>

          <Field label="X (Twitter) account" hint="Optional. @handle or an x.com link">
            <Input
              value={x}
              onChange={(e) => setX(e.target.value)}
              placeholder="@yourhandle"
            />
          </Field>

          <Field label="Deployed contract" hint="Filled in from step 1">
            <Input value={contract} readOnly />
          </Field>

          <Field label="Your wallet" hint="Filled in from the connected wallet">
            <Input value={wallet ?? "wallet not connected"} readOnly />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" disabled={!canSend} onClick={send}>
            {sending ? "Sending…" : "Submit registration"}
          </Button>
          {failed && <Button onClick={send}>Retry</Button>}
        </div>

        <div className="mt-4 space-y-1.5">
          {result && <Status tone={failed ? "err" : "ok"}>{result}</Status>}
          {!isConnected && <Status tone="warn">Connect a wallet first.</Status>}
          {isConnected && !canSend && !sending && (
            <Status tone="warn">
              {name.trim() === ""
                ? "Name is required."
                : !validEmail
                  ? "Enter a valid Gmail address."
                  : ""}
            </Status>
          )}
          {!hasKpiEndpoint && (
            <Status tone="warn">
              <code className="font-mono text-[12.5px]">NEXT_PUBLIC_KPI_ENDPOINT</code> is
              not configured — the form has nowhere to send to. See README, section
              &quot;Collecting KPIs&quot;.
            </Status>
          )}
          <p className="text-xs leading-5 text-muted">
            Sends: name · Gmail (Builder Hub) · X account · wallet address · contract
            address · network · NFTs minted ({minted}).
          </p>
          {isConfigured && explorerAddress(contract) && (
            <a
              className="eyebrow inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
              href={explorerAddress(contract)!}
              target="_blank"
              rel="noreferrer"
            >
              View contract on Snowtrace
              <Icon name="external" className="size-3" />
            </a>
          )}
        </div>
      </Card>
    </section>
  );
}
