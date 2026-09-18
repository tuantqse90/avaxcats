# team1vn faucet — Cloudflare Worker

Faucet AVAX test chạy ngay trên team1vn.xyz: học viên bấm **Get test AVAX** cạnh nút
**Create L1**, ví đang kết nối nhận AVAX Fuji trong vài giây, không cần tài khoản Builder Hub.

## Vì sao phải có Worker, không làm bằng contract?

Muốn gửi AVAX thì phải **ký giao dịch bằng private key**.

- **Nhét key vào frontend**: không được. Bundle JS ai cũng đọc được → bot rút sạch ví.
- **Faucet bằng contract, user tự gọi `claim()`**: không giải quyết được vấn đề. Ví học viên mới
  tạo có **0 AVAX** nên không trả nổi gas để gọi hàm. Đúng lúc cần faucet nhất thì lại bó tay.
- **Worker giữ key, ký hộ**: user không cần có gì trong ví. Đây là cách đang dùng.

Key nằm trong secret store của Cloudflare, không bao giờ vào git và không lộ ra frontend.

## Phát bao nhiêu là đủ?

Đo thực tế trên Fuji, gas price 1 nAVAX (giá các giao dịch thật đang trả):

| Việc | Gas | Chi phí |
|---|---|---|
| Deploy AvaxCats | 1,236,119 | **0.001236 AVAX** |
| Mỗi lần mint | ~250,000 | ~0.00025 AVAX |

`DRIP_AMOUNT` mặc định **0.005** = đủ deploy + hơn 10 lần mint. Ví nạp 5 AVAX phục vụ ~1000 lượt.

> ⚠️ Đừng hạ xuống dưới **0.0015** — học viên sẽ không deploy nổi contract ở bước 1 của workshop.

## Deploy

```bash
cd faucet-worker
npm install

# 1. Đăng nhập Cloudflare (mở browser)
npx wrangler login

# 2. Tạo KV namespace để lưu cooldown, rồi dán id vào wrangler.toml
npx wrangler kv namespace create FAUCET_KV

# 3. Nạp private key của ví faucet (ví testnet riêng, ĐÃ có AVAX Fuji).
#    Lệnh này hỏi key qua stdin — không hiện trên màn hình, không vào git, không vào lịch sử shell.
npx wrangler secret put FAUCET_PRIVATE_KEY

# 4. (tuỳ chọn) Bật captcha chống bot farm
npx wrangler secret put TURNSTILE_SECRET

# 5. Deploy
npx wrangler deploy
```

Xong sẽ ra URL dạng `https://team1vn-faucet.<account>.workers.dev`.

Muốn domain đẹp `faucet.team1vn.xyz`: Cloudflare dashboard → Workers → `team1vn-faucet` →
Settings → Domains & Routes → Add custom domain. (DNS record Cloudflare tự tạo.)

## Nối vào trang web

Trong `mint-dapp/.env.local`:

```
NEXT_PUBLIC_FAUCET_ENDPOINT=https://faucet.team1vn.xyz
```

Rồi build lại và deploy site như bình thường. Để trống biến này thì nút **Get test AVAX** tự
quay về link faucet Builder Hub — trang không bao giờ hiện nút bấm vào không ra gì.

## Kiểm tra

```bash
curl https://faucet.team1vn.xyz | jq .
```

```json
{
  "ok": true,
  "faucet": "0x…",        // địa chỉ ví faucet — nạp thêm AVAX vào đây
  "balance": "4.97",
  "drip": "0.005",
  "claimsLeft": 994,       // còn phát được bao nhiêu lượt
  "cooldownHours": 24
}
```

Xem log realtime: `npx wrangler tail`

## API

**`POST /claim`** — body `{"address":"0x…"}`, tuỳ chọn `{"turnstileToken":"…"}`

| Mã | Ý nghĩa |
|---|---|
| 200 | `{ok, hash, amount, explorer}` — đã gửi |
| 400 | địa chỉ sai |
| 403 | captcha fail |
| 429 | đang cooldown — kèm `retryAfterSeconds`, `previousHash` |
| 503 | faucet hết tiền / chưa cấu hình key |

**`GET /`** — trạng thái faucet (ở trên).

## Chống lạm dụng

- **Cooldown theo địa chỉ + theo IP**, mặc định 24h, lưu bằng KV có TTL nên tự hết hạn.
  Chặn mỗi địa chỉ thì bot tạo ví mới vô hạn; chặn mỗi IP thì cả phòng workshop chung wifi kẹt
  nhau — nên phải có cả hai.
- **Giữ chỗ trước khi gửi**: ghi KV xong mới gửi giao dịch, gửi lỗi thì nhả ra. Tránh hai request
  bấm cùng lúc nhận hai lần.
- **CORS allowlist**: chỉ team1vn.xyz gọi được, site clone dựng lên để farm sẽ bị browser chặn.
- **Turnstile** (tuỳ chọn): bật bằng cách đặt secret `TURNSTILE_SECRET`.

### Giới hạn cần biết

- KV **eventually consistent**: hai request bắn cùng một mili giây ở hai datacenter khác nhau
  về lý thuyết có thể lọt cả hai. Quy mô workshop thì không đáng lo; cần chặt tuyệt đối thì phải
  đổi sang Durable Object.
- CORS chỉ chặn được **browser**. `curl` thì gọi thẳng được — đây là lý do nên bật Turnstile nếu
  faucet để công khai lâu dài.
- Ví faucet là **ví nóng**. Chỉ để AVAX **testnet** trong đó, đúng số cần dùng. Không bao giờ
  dùng ví có tài sản thật.
