"use client";

import { useSyncExternalStore } from "react";
import { activeChain } from "./chains";

// ❓ NEXT_PUBLIC_ là gì, sao không dùng process.env.KPI_ENDPOINT?
// → Next.js chỉ nhúng biến có prefix NEXT_PUBLIC_ vào bundle chạy trong browser; biến khác chỉ có trên server. File này
//   chạy client-side nên bắt buộc dùng prefix. hasKpiEndpoint kiểm tra đó là URL http(s) để form biết có nơi gửi chưa.
export const KPI_ENDPOINT = (process.env.NEXT_PUBLIC_KPI_ENDPOINT ?? "").trim();
export const hasKpiEndpoint = /^https?:\/\//.test(KPI_ENDPOINT);

export type KpiPayload = {
  name: string;
  contact: string; // Gmail (registered on Builder Hub)
  x: string; // Account X (Twitter)
  wallet: string;
  contract: string;
  l1: string;
  chain: string;
  chainId: number;
  minted: number;
  at: string;
};

export type KpiRecord = KpiPayload & { confirmed: boolean };

// ❓ Vì sao key localStorage có chainId?
// → Anvil và Fuji là hai môi trường khác nhau; tách key để bản ghi đã gửi trên anvil không làm form Fuji tưởng "đã đăng ký".
const KEY = `avaxcats:kpi:${activeChain.id}`;

// ❓ listeners và snapshot dùng để làm gì?
// → Đây là "external store" tối giản cho useSyncExternalStore: snapshot cache giá trị hiện tại, listeners là các
//   component cần re-render khi giá trị đổi. localStorage không tự báo thay đổi trong cùng tab nên phải tự làm cơ chế này.
const listeners = new Set<() => void>();
let snapshot: string | undefined;

// ❓ Sao đọc localStorage phải try/catch?
// → localStorage có thể ném lỗi: chế độ riêng tư của Safari, iframe bị chặn cookie, hoặc đang chạy trên server (không có
//   window). Trả "" để app vẫn chạy bình thường.
function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ❓ Vì sao getSnapshot phải trả về cùng một giá trị nếu không có gì đổi?
// → useSyncExternalStore so sánh snapshot bằng Object.is mỗi lần render; nếu trả về giá trị khác nhau liên tục, React
//   sẽ render lại vô hạn. Cache vào biến snapshot (string nên so sánh theo giá trị là ổn) và chỉ đọc localStorage lần đầu.
function getSnapshot() {
  if (snapshot === undefined) snapshot = read();
  return snapshot;
}

// ❓ getServerSnapshot để làm gì?
// → Khi Next.js render trên server không có localStorage → luôn trả "". Client lần hydrate đầu cũng dùng giá trị này
//   để HTML khớp; ngay sau đó React đọc getSnapshot thật và render lại nếu khác.
function getServerSnapshot() {
  return "";
}

export function useKpiSubmitted() {
  // ❓ useSyncExternalStore nhận 3 tham số nào?
  // → (subscribe, getSnapshot, getServerSnapshot): đăng ký lắng nghe thay đổi, lấy giá trị hiện tại, lấy giá trị khi SSR.
  //   Đây là cách React 18 khuyến nghị để đọc nguồn dữ liệu ngoài React (localStorage, window…) mà không lệch hydration.
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KpiRecord;
  } catch {
    return null;
  }
}

function remember(payload: KpiPayload, confirmed: boolean) {
  const raw = JSON.stringify({ ...payload, confirmed });
  try {
    localStorage.setItem(KEY, raw);
  } catch {}
  // ❓ Đã setItem rồi, sao còn phải gán snapshot và gọi listeners?
  // → setItem không làm React render lại. Cập nhật cache + gọi listeners để mọi component dùng useKpiSubmitted render
  //   ngay (RegisterPanel chuyển sang màn "Registered").
  snapshot = raw;
  for (const l of listeners) l();
}

export function forgetKpi() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  snapshot = "";
  for (const l of listeners) l();
}

export type SubmitResult = { ok: true; confirmed: boolean } | { ok: false; reason: string };

export async function submitKpi(payload: KpiPayload): Promise<SubmitResult> {
  if (!hasKpiEndpoint) {
    return { ok: false, reason: "NEXT_PUBLIC_KPI_ENDPOINT is not set in .env.local" };
  }

  const body = JSON.stringify(payload);

  try {
    // ❓ redirect: "manual" và Content-Type text/plain để làm gì?
    // → Google Apps Script trả 302 redirect sau khi xử lý POST; với redirect mặc định ("follow") browser đi theo redirect
    //   và bị CORS chặn ở bước đó → fetch ném lỗi dù dữ liệu đã ghi. "manual" dừng lại ở 302. text/plain giữ request là
    //   "simple request" nên không cần preflight OPTIONS (Apps Script không trả lời preflight).
    const res = await fetch(KPI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "manual",
    });
    // ❓ Vì sao "opaqueredirect" được coi là gửi thành công?
    // → Với redirect: "manual", khi server trả 3xx browser trả Response type "opaqueredirect" (status 0, không đọc được
    //   body). Apps Script CHỈ redirect sau khi doPost() chạy xong, nên nhận được redirect = server đã ghi dữ liệu → confirmed.
    if (res.type === "opaqueredirect" || res.ok) {
      remember(payload, true);
      return { ok: true, confirmed: true };
    }
    return { ok: false, reason: `Server returned HTTP ${res.status}` };
  } catch {
    try {
      // ❓ Fallback mode: "no-cors" khác gì?
      // → Nếu lần đầu ném lỗi (mạng/CORS), gửi lại ở chế độ no-cors: browser vẫn POST đi nhưng trả response "opaque" —
      //   không biết server trả 200 hay 500. Vì vậy chỉ ghi confirmed = false và UI bảo người dùng tự kiểm tra sheet.
      await fetch(KPI_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
      });
      remember(payload, false);
      return { ok: true, confirmed: false };
    } catch (e) {
      return { ok: false, reason: (e as Error).message || "could not send" };
    }
  }
}
