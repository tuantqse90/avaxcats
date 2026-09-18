"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { FAUCET, isLocal } from "@/lib/chains";
import { Icon } from "./ui";

// ❓ Vì sao endpoint lại là biến env chứ không hardcode?
// → Chưa deploy Worker thì biến này rỗng, nút tự quay về link faucet chính thức của Avalanche.
//   Nhờ vậy trang không bao giờ hiện một nút bấm vào không ra gì.
const ENDPOINT = (process.env.NEXT_PUBLIC_FAUCET_ENDPOINT ?? "").trim();
export const hasOwnFaucet = /^https?:\/\//.test(ENDPOINT);

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; hash: string; amount: string }
  | { kind: "err"; message: string };

type ClaimResponse = {
  ok?: boolean;
  hash?: string;
  amount?: string;
  message?: string;
  error?: string;
};

export function FaucetButton({ variant = "nav" }: { variant?: "nav" | "menu" }) {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<State>({ kind: "idle" });

  // Trên anvil thì faucet vô nghĩa — chain local tự có sẵn 10 ví đầy tiền.
  if (isLocal) return null;

  // Chưa cấu hình faucet riêng → chỉ là link sang faucet Builder Hub.
  if (!hasOwnFaucet) {
    return (
      <a
        href={FAUCET}
        target="_blank"
        rel="noreferrer"
        className={
          variant === "nav"
            ? "inline-flex h-8 items-center gap-1.5 border border-line-strong px-3 text-[12px] font-semibold text-fg transition-colors hover:bg-hover max-sm:hidden"
            : "flex items-center justify-between px-2 py-3 text-[15px] font-semibold text-fg transition-colors hover:bg-hover"
        }
      >
        Get test AVAX
        <Icon name="external" className="size-3.5 text-muted" />
      </a>
    );
  }

  async function claim() {
    if (!isConnected || !address) {
      setState({ kind: "err", message: "Kết nối ví trước đã." });
      return;
    }
    setState({ kind: "sending" });
    try {
      const r = await fetch(`${ENDPOINT.replace(/\/$/, "")}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await r.json().catch(() => ({}))) as ClaimResponse;
      if (r.ok && data.ok && data.hash) {
        setState({ kind: "ok", hash: data.hash, amount: data.amount ?? "" });
      } else {
        setState({
          kind: "err",
          message: data.message ?? `Faucet lỗi (${r.status}).`,
        });
      }
    } catch {
      // ❓ Vì sao bắt lỗi mạng riêng?
      // → fetch chỉ throw khi không gọi tới được Worker (mất mạng, CORS chặn). Lỗi nghiệp vụ như
      //   cooldown/hết tiền vẫn là response hợp lệ và đã xử lý ở nhánh trên.
      setState({ kind: "err", message: "Không gọi được faucet. Kiểm tra mạng." });
    }
  }

  const sending = state.kind === "sending";
  const label =
    state.kind === "sending"
      ? "Đang gửi…"
      : state.kind === "ok"
        ? `Đã gửi ${state.amount} AVAX`
        : "Get test AVAX";

  if (variant === "menu") {
    return (
      <div>
        <button
          type="button"
          onClick={claim}
          disabled={sending}
          className="flex w-full cursor-pointer items-center justify-between px-2 py-3 text-left text-[15px] font-semibold text-fg transition-colors hover:bg-hover disabled:opacity-60"
        >
          {label}
          <Icon
            name={state.kind === "ok" ? "check" : "arrowRight"}
            className="size-3.5 text-muted"
          />
        </button>
        <FaucetFeedback state={state} />
      </div>
    );
  }

  return (
    <div className="relative max-sm:hidden">
      <button
        type="button"
        onClick={claim}
        disabled={sending}
        title="Nhận AVAX test vào ví đang kết nối"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 border border-line-strong px-3 text-[12px] font-semibold text-fg transition-colors hover:bg-hover disabled:opacity-60"
      >
        {label}
        <Icon name={state.kind === "ok" ? "check" : "arrowRight"} className="size-3.5" />
      </button>
      {state.kind !== "idle" && state.kind !== "sending" && (
        <div className="absolute top-10 right-0 z-50 w-72 border border-line bg-surface-solid p-3 shadow-lg">
          <FaucetFeedback state={state} />
        </div>
      )}
    </div>
  );
}

function FaucetFeedback({ state }: { state: State }) {
  if (state.kind === "ok") {
    return (
      <p className="px-2 text-[12px] leading-5 text-muted">
        Đã gửi {state.amount} AVAX test.{" "}
        <a
          className="underline hover:text-avax"
          href={`https://testnet.snowtrace.io/tx/${state.hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Xem giao dịch
        </a>
      </p>
    );
  }
  if (state.kind === "err") {
    return (
      <p className="px-2 text-[12px] leading-5 text-amber-500">
        {state.message}{" "}
        <a
          className="underline hover:text-avax"
          href={FAUCET}
          target="_blank"
          rel="noreferrer"
        >
          Dùng faucet chính thức
        </a>
      </p>
    );
  }
  return null;
}
