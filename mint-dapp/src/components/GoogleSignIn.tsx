"use client";

import { useEffect, useRef, useState } from "react";
import {
  decodeIdToken,
  GOOGLE_CLIENT_ID,
  hasGoogleSignIn,
  loadGsi,
  type GoogleIdentity,
} from "@/lib/google";

export function GoogleSignIn({
  onIdentity,
}: {
  onIdentity: (id: GoogleIdentity) => void;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // ❓ Vì sao nhét callback vào ref?
  // → google.accounts.id.initialize() chỉ nên gọi MỘT lần. Nếu để onIdentity trong deps của useEffect thì
  //   mỗi lần RegisterPanel render lại (gõ từng chữ vào ô Name) sẽ init lại và vẽ lại nút. Ref giữ callback
  //   luôn mới mà không cần chạy lại effect.
  const cb = useRef(onIdentity);
  cb.current = onIdentity;

  useEffect(() => {
    if (!hasGoogleSignIn) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        const gsi = window.google?.accounts?.id;
        if (cancelled || !gsi || !slot.current) return;
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            const identity = res.credential ? decodeIdToken(res.credential) : null;
            if (identity) cb.current(identity);
            else setFailed(true);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gsi.renderButton(slot.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 280,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Chưa cấu hình Client ID → không hiện gì, form vẫn gõ tay bình thường.
  if (!hasGoogleSignIn) return null;

  return (
    <div className="mb-5 border-b border-line pb-5">
      <p className="eyebrow mb-3 text-muted">Điền nhanh</p>
      <div ref={slot} className="min-h-[44px]" />
      {failed && (
        <p className="mt-2 text-xs leading-5 text-amber-500">
          Không tải được đăng nhập Google — cứ gõ tay email bên dưới cũng được.
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-muted">
        Dùng đúng Google account bạn đã đăng nhập Builder Hub. Đăng nhập GitHub hoặc email
        OTP thì bỏ qua, gõ tay ở ô Gmail.
      </p>
    </div>
  );
}
