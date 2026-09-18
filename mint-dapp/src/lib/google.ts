"use client";

// ❓ Vì sao không lấy thẳng account Builder Hub mà phải qua Google?
// → Same-origin policy: team1vn.xyz không đọc được cookie/session của build.avax.network, và Builder Hub
//   không phải OAuth provider (404 ở /.well-known/openid-configuration) nên cũng không có cửa hỏi tử tế.
//   Đa số học viên đăng nhập Builder Hub bằng Google, nên đăng nhập Google ở đây là cách gần nhất:
//   lấy được email ĐÃ XÁC MINH thay vì để người ta gõ tay.
//
// ⚠️ Email xác minh ≠ đúng account Builder Hub. Ai đăng nhập Builder Hub bằng GitHub hoặc email OTP khác
//    thì vẫn lệch — ban tổ chức vẫn phải đối chiếu, chỉ là sai số ít hơn hẳn.

export const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();
export const hasGoogleSignIn = GOOGLE_CLIENT_ID.length > 0;

export type GoogleIdentity = {
  email: string;
  emailVerified: boolean;
  name: string;
  /** JWT gốc của Google — gửi nguyên lên server để verify chữ ký. */
  credential: string;
};

type IdTokenClaims = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  aud?: string;
  exp?: number;
};

// ❓ Sao phải tự viết hàm giải base64url?
// → atob() chỉ hiểu base64 chuẩn. JWT dùng base64url: "-" thay "+", "_" thay "/", và bỏ dấu "=" đệm.
//   Thêm nữa tên người dùng có dấu tiếng Việt nên phải giải qua TextDecoder mới ra UTF-8 đúng.
function b64urlDecode(part: string): string {
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ❓ Giải mã ở client thì có tin được không?
// → KHÔNG. Ai cũng tự tạo được một JWT trông y hệt. Hàm này chỉ dùng để HIỂN THỊ email lên form cho tiện.
//   Muốn tin thì phải verify chữ ký ở server — xem docs/google-signin.md.
export function decodeIdToken(credential: string): GoogleIdentity | null {
  try {
    const parts = credential.split(".");
    if (parts.length !== 3) return null;
    const claims = JSON.parse(b64urlDecode(parts[1])) as IdTokenClaims;
    if (!claims.email) return null;
    // Token hết hạn (Google cấp 1 tiếng) thì coi như không có.
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    // aud phải đúng Client ID của mình, nếu không là token của app khác.
    if (claims.aud && claims.aud !== GOOGLE_CLIENT_ID) return null;
    return {
      email: claims.email,
      emailVerified: claims.email_verified === true,
      name: (claims.name ?? "").trim(),
      credential,
    };
  } catch {
    return null;
  }
}

type GsiButtonOptions = {
  theme?: string;
  size?: string;
  text?: string;
  shape?: string;
  width?: number;
  logo_alignment?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(config: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }): void;
          renderButton(parent: HTMLElement, options: GsiButtonOptions): void;
          disableAutoSelect(): void;
        };
      };
    };
  }
}

let loading: Promise<void> | null = null;

// ❓ Vì sao nạp script bằng tay thay vì để sẵn thẻ <script> trong layout?
// → Chưa cấu hình Client ID thì không nạp gì cả, khỏi bắt mọi khách truy cập tải thêm script của Google
//   và khỏi để Google thấy lượt truy cập của những người không hề dùng tới đăng nhập.
export function loadGsi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("could not load Google Identity Services"));
    };
    document.head.appendChild(s);
  });
  return loading;
}
