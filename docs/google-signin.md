# Đăng nhập Google để tự điền Gmail

Nút **Continue with Google** trong form đăng ký (bước 03) lấy email đã xác minh của Google rồi
điền sẵn vào ô Gmail và ô Name. Hết gõ tay, hết sai chính tả.

## Vì sao không lấy thẳng account Builder Hub?

Không làm được, và không phải do thiếu công cụ:

1. **Same-origin policy.** `team1vn.xyz` không đọc được cookie / localStorage / DOM của
   `build.avax.network`. Đây là ranh giới bảo mật cốt lõi của trình duyệt — nếu lách được thì bất
   kỳ trang web nào cũng đọc được danh tính đăng nhập của bạn ở mọi site khác.
2. **Builder Hub không phải OAuth provider.** `build.avax.network/.well-known/openid-configuration`
   và `/.well-known/oauth-authorization-server` đều trả 404, nên cũng không có endpoint để hỏi
   "user này là ai".

Builder Hub cho đăng nhập bằng **email OTP, Google, hoặc GitHub**. Đa số học viên dùng Google, nên
đăng nhập Google ở đây là cách gần nhất.

> ⚠️ **Email xác minh ≠ đúng account Builder Hub.** Google chỉ chứng minh "người này sở hữu email
> này". Ai đăng nhập Builder Hub bằng GitHub hoặc email OTP khác thì địa chỉ vẫn lệch. Ban tổ chức
> vẫn cần đối chiếu — chỉ là sai số ít hơn hẳn so với gõ tay.

## 1. Tạo OAuth Client ID

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create Credentials →
OAuth client ID → **Web application**.

**Authorized JavaScript origins** (bắt buộc, nếu thiếu thì nút không hiện):

```
https://team1vn.xyz
https://www.team1vn.xyz
http://localhost:3000
```

Không cần điền *Authorized redirect URIs* — luồng này chạy hoàn toàn trong trình duyệt.

Copy Client ID (dạng `xxx.apps.googleusercontent.com`) vào `mint-dapp/.env.local`:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

Rồi build lại và deploy site. Để trống biến này thì form gõ tay như cũ, không hiện nút gì.

> Client ID là thông tin **công khai** — nó nằm sẵn trong bundle JS, không phải secret.
> Cái phải giữ kín là Client *Secret*, và luồng này không dùng tới.

## 2. Verify token phía server (quan trọng)

Form gửi kèm `idToken` — JWT gốc của Google — trong payload.

**Không được tin `contact` nếu chưa verify `idToken`.** Frontend chỉ giải mã JWT để hiển thị; ai
cũng có thể POST thẳng vào Apps Script với email bịa. Chữ ký của Google mới là bằng chứng, và chỉ
kiểm được ở server.

Dán vào Apps Script của sheet:

```js
const GOOGLE_CLIENT_ID = "xxx.apps.googleusercontent.com"; // đúng Client ID ở trên

/**
 * Trả về email nếu token thật và do CHÍNH app này cấp, ngược lại trả null.
 */
function verifyGoogleIdToken(idToken) {
  if (!idToken) return null;
  const res = UrlFetchApp.fetch(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (res.getResponseCode() !== 200) return null;

  const c = JSON.parse(res.getContentText());
  // aud: token cấp cho app nào. Thiếu bước này thì token lấy từ app khác cũng lọt.
  if (c.aud !== GOOGLE_CLIENT_ID) return null;
  if (c.iss !== "accounts.google.com" && c.iss !== "https://accounts.google.com") return null;
  if (Number(c.exp) * 1000 < Date.now()) return null;
  if (String(c.email_verified) !== "true") return null;

  return c.email;
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const verified = verifyGoogleIdToken(d.idToken);

  SpreadsheetApp.getActiveSheet().appendRow([
    d.at,
    d.name,
    d.contact,                       // email người dùng thấy trên form
    verified || "",                  // email Google đã xác minh, rỗng nếu gõ tay
    verified ? "VERIFIED" : "typed", // cột để lọc nhanh
    d.x,
    d.wallet,
    d.contract,
    d.chain,
    d.minted,
  ]);

  // Apps Script phải redirect thì frontend mới biết là đã ghi xong — xem lib/kpi.ts.
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy lại web app (**Deploy → Manage deployments → Edit → New version**), nếu không thì Apps
Script vẫn chạy code cũ.

### Đọc cột kết quả

| `verified` | `contact` | Nghĩa là |
|---|---|---|
| có email | trùng `contact` | Đăng nhập Google, tin được |
| rỗng | có email | Gõ tay — cần đối chiếu Builder Hub |
| có email | **khác** `contact` | Không xảy ra: form xoá token khi người dùng sửa email lệch đi |

### Lưu ý

- Endpoint `tokeninfo` là cách verify đơn giản nhất và đủ cho quy mô workshop, nhưng nó có giới
  hạn số lần gọi. Nếu chạy quy mô lớn thì nên verify chữ ký cục bộ bằng JWKS của Google
  (`https://www.googleapis.com/oauth2/v3/certs`) thay vì gọi qua mạng mỗi lần.
- Token Google sống **1 tiếng**. Người dùng để form mở quá lâu rồi mới bấm gửi thì token hết hạn →
  `verified` rỗng, dòng vẫn ghi bình thường, chỉ là không có dấu xác minh.
