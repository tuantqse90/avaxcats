# Speaking script — Building on Avalanche (Team1 VN workshop)

Deck: Canva "Avalanche Team1 Workshop Template", 18 slide. Giọng trình bày: ngắn, nêu sự thật, không hô hào. [DEMO] = thao tác trên màn hình.
Dòng `>` dưới mỗi ý là câu nói mẫu, đọc nguyên văn được; ý in trên là ghi chú để nhớ.

## Việc cần chốt trước buổi

- Kịch bản mint. Site đang để mỗi người tự deploy contract riêng. Nếu muốn cả lớp mint chung 48 con như slide 15 ghi, deploy một contract trước, chạy `npm run set-contract 0x…`, build và deploy lại site.
- Repo `github.com/tuantqse90/avaxcats` đã public, khớp với slide 13 và 18.
- Slide 18 ghi faucet cũ `faucet.avax.network`. Faucet hiện tại: `build.avax.network/console/primary-network/faucet`.
- Link Builder Hub trên slide và QR dùng link có ref của Team1: `https://go.team1.network/vietnam-builder`.
- Dự phòng: `team1vn.xyz/demo.html` có 4 clip (đăng nhập Builder Hub, faucet, deploy & mint, tạo L1). Chiếu khi mạng hoặc ví trục trặc.
- Tạo L1 (slide 16) chạy 8 bước và mất vài phút. Bấm deploy ở đầu phần thực hành slide 15, quay lại xem ở slide 16.
- Agenda ghi 60 phút, presenter notes ghi 90. Thống nhất một con số.
- Ví Core của người trình bày có sẵn AVAX Fuji, cộng một ví dự phòng để chuyển cho người bị faucet từ chối.
- Mở sẵn năm tab: team1vn.xyz, team1vn.xyz/demo.html, faucet Builder Console, testnet.snowtrace.io, repo.
- Người dùng điện thoại: mở team1vn.xyz trong app Core, tab Browser. Safari và Chrome trên điện thoại không kết nối được với Core.

---

## 1. Building on Avalanche — 1 phút

- Xác định phòng bằng hai câu hỏi: ai đã viết Solidity, ai chưa từng deploy contract.
  > Trước khi bắt đầu cho mình hỏi nhanh: bạn nào đã từng viết Solidity giơ tay giúp mình… và bạn nào chưa deploy contract nào bao giờ?
- Nêu mục tiêu buổi học: mỗi người kết thúc với một contract ERC-721 chạy trên Fuji testnet và một NFT do chính ví của mình mint.
  > Mục tiêu hôm nay rất cụ thể: hết buổi, mỗi bạn có một contract ERC-721 chạy trên Fuji testnet và một NFT do chính ví của bạn mint ra.
- Nêu cấu trúc: nền tảng mạng, ví và testnet, contract và mint, bước tiếp theo. Phần ba chiếm gần nửa thời lượng và là phần thực hành.
  > Buổi học có bốn phần: nền tảng mạng, ví và testnet, contract và mint, rồi bước tiếp theo sau hôm nay; phần ba là thực hành và chiếm gần nửa thời gian.

## 2. About the speaker — 1 phút

- Tên, vai trò: Developer Relations, Team1 Vietnam.
  > Mình là [tên], đang làm Developer Relations ở Team1 Vietnam.
- Hai điểm liên quan đến buổi học: kinh nghiệm build sản phẩm production, và giải top 3 Avalanche Hackathon 2022 — cùng hệ sinh thái với nội dung hôm nay.
  > Hai thứ liên quan tới hôm nay: mình đã build sản phẩm chạy thật ngoài production, và team mình từng vào top 3 Avalanche Hackathon 2022, đúng hệ sinh thái mình nói hôm nay.
- Các giải còn lại chỉ đọc lướt, không dừng.
  > Mấy giải khác trên slide các bạn xem qua thôi, mình không kể dài, để dành thời gian cho phần thực hành.

## 3. Agenda — 1 phút

- Bốn khối theo thứ tự trên slide, nêu thời lượng từng khối.
  > Bốn khối theo thứ tự trên slide: hai khối đầu ngắn thôi, khối thực hành là dài nhất, khối cuối là hướng đi sau buổi này.
- Khối 3 là thực hành. Yêu cầu người chưa có Node.js cài ngay trong lúc trình bày khối 1, phiên bản 20 trở lên.
  > Bạn nào chưa có Node.js thì cài luôn từ bây giờ nhé, bản 20 trở lên, để tới phần thực hành là dùng được ngay.

## 4. Reference — 1 phút

- Bốn nguồn chính thức: Academy (khoá học có lộ trình), Docs (tham chiếu Primary Network, RPC, chain ID), Console (faucet, tạo L1, validator), Builder Hub (trang tổng hợp).
  > Avalanche có bốn nguồn chính thức: Academy là khoá học có lộ trình, Docs là tài liệu tham chiếu, Console là chỗ lấy faucet và tạo L1, còn Builder Hub là trang gom tất cả.
- Đề nghị lưu hai link: Academy để học tiếp sau buổi này, Builder Hub để theo dõi sự kiện và grant. Dùng link có ref của Team1.
  > Các bạn lưu giúp mình hai link trên slide: Academy để học tiếp sau hôm nay, Builder Hub để theo dõi sự kiện và grant; vào bằng link của Team1 để tụi mình biết bạn nào đến từ buổi này mà hỗ trợ.
- [DEMO] Mở build.avax.network, chỉ vị trí bốn mục trên thanh điều hướng.
  > Để mình mở build.avax.network cho các bạn thấy: Documentation và Console nằm ngay trên thanh menu, Academy nằm trong Documentation, còn trang này chính là Builder Hub.

## 5. Academy badges — 1 phút

- Mỗi khoá kết thúc bằng bài đánh giá. Đạt thì nhận badge trên profile công khai; hoàn thành cả track nhận Graduate badge.
  > Mỗi khoá trên Academy kết thúc bằng một bài đánh giá; làm đạt thì badge hiện trên profile công khai của bạn, xong cả track thì có thêm badge Graduate.
- Giá trị thực tế: bằng chứng năng lực dùng được trong CV và hồ sơ xin grant.
  > Cái này không phải để cho vui: badge là bằng chứng bạn hiểu Avalanche, gắn vào CV hay hồ sơ xin grant đều dùng được.
- Lộ trình đề xuất: Blockchain Fundamentals, sau đó Avalanche L1 Academy.
  > Chưa biết bắt đầu từ đâu thì đi Blockchain Fundamentals trước, rồi sang Avalanche L1 Academy.

## 6. Network foundations — 15 giây

- Chuyển đoạn: trước khi viết code cần một mô hình đúng về mạng. Ba chain, một bộ validator, finality dưới một giây.
  > Trước khi đụng vào code, mình cần các bạn có một hình dung đúng về mạng: ba chain, một bộ validator, và finality dưới một giây.

## 7. Built to be many chains — 3 phút

- Ý chính: phần lớn mạng scale bằng cách đưa mọi ứng dụng lên một chain. Avalanche dùng chung validator và consensus, còn số chain thì không giới hạn.
  > Phần lớn các mạng scale bằng cách nhét mọi ứng dụng lên cùng một chain; Avalanche đi hướng khác: dùng chung validator và consensus, còn số chain thì không giới hạn.
- Bốn điểm, mỗi điểm một câu, không đọc nhãn trên slide:
  > Bốn ý trên slide, mình nói mỗi ý một câu thôi.
  - Finality dưới một giây: giao dịch là cuối cùng ngay khi xác nhận, ứng dụng không cần trạng thái chờ nhiều block.
    > Finality dưới một giây nghĩa là giao dịch xác nhận xong là xong luôn, app của bạn không cần cái màn hình "đang chờ thêm vài block".
  - Solidity chạy không sửa: contract của buổi hôm nay là OpenZeppelin ERC-721 tiêu chuẩn.
    > Solidity chạy y nguyên, không phải sửa gì; contract hôm nay là ERC-721 chuẩn của OpenZeppelin.
  - Hàng nghìn node trên phần cứng phổ thông.
    > Mạng có hàng nghìn node và chạy được trên phần cứng phổ thông, không cần máy chuyên dụng.
  - Chain riêng khi cần: cuối buổi tạo một L1 trên Console trong bốn bước.
    > Và khi sản phẩm cần chain riêng thì tạo được luôn; cuối buổi mình sẽ tạo một L1 ngay trên Console.

## 8. Architecture — 2 phút

- Mô tả cấu trúc: một bộ validator ở dưới, ba chain chuyên biệt ở trên.
  > Nhìn hình này: bên dưới là một bộ validator chung, bên trên là ba chain, mỗi chain một việc.
- P-Chain: staking, đăng ký validator, danh bạ L1. X-Chain: tạo và chuyển tài sản, sổ cái DAG. C-Chain: EVM, nơi Solidity chạy.
  > P-Chain lo staking, đăng ký validator và danh sách L1; X-Chain để tạo và chuyển tài sản; còn C-Chain là EVM, nơi Solidity của bạn chạy.
- Toàn bộ buổi hôm nay làm việc trên C-Chain. Chain ID Fuji: 43113.
  > Cả buổi hôm nay mình chỉ làm trên C-Chain của Fuji, chain ID là 43113, nhớ số này vì lát nữa ví sẽ hỏi.

## 9. Wallet — 4 phút, làm cùng phòng

- [DEMO] core.app/download. Extension cho laptop, App Store và Google Play cho điện thoại.
  > Ví mình dùng là Core, vào core.app/download: laptop thì cài extension, điện thoại thì lên App Store hoặc Google Play.
- Tạo ví mới, ghi 24 từ khôi phục ra giấy. Nêu rõ: cụm từ này là ví; ai có nó là chủ ví; không có cơ chế khôi phục nếu mất.
  > Tạo ví mới rồi ghi 24 từ ra giấy ngay lúc này; 24 từ đó chính là cái ví, ai cầm được là chủ ví, mất là mất luôn, không ai khôi phục cho bạn được.
- Người cần nhanh có thể đăng nhập bằng Gmail, tạo ví 24 từ sau.
  > Bạn nào muốn nhanh thì đăng nhập bằng Gmail cũng được, hôm nay dùng testnet thôi, ví 24 từ tạo sau.
- Bật Testnet mode trong Settings để hiển thị Fuji.
  > Vào Settings bật Testnet mode lên, lúc đó mới thấy mạng Fuji.

## 10. Testnet AVAX — 3 phút

- Bốn bước trên slide: mở faucet trong Console, đăng nhập Builder Hub, chọn Fuji C-Chain và dán địa chỉ, kiểm tra số dư trong Core.
  > Bốn bước: mở faucet trong Console, đăng nhập Builder Hub, chọn Fuji C-Chain rồi dán địa chỉ ví, xong quay lại Core xem số dư.
- Lưu ý: faucet cần tài khoản Builder Hub (Gmail + mã gửi về mail, hoặc Google / GitHub) và giới hạn theo tài khoản; đăng nhập trước khi thao tác.
  > Faucet chỉ phát khi bạn đã đăng nhập Builder Hub, bằng Gmail và mã gửi về mail hoặc Google, GitHub; nên đăng nhập trước rồi mới bấm xin.
- AVAX Fuji không có giá trị và không mua được. Nếu faucet hết, người trình bày chuyển trực tiếp.
  > AVAX trên Fuji không có giá trị và cũng không mua được; faucet mà hết thì nói mình, mình chuyển thẳng cho bạn.
- [DEMO] Thực hiện một lượt với ví của người trình bày.
  > Để mình làm một lượt bằng ví của mình cho các bạn xem, rồi các bạn làm theo.

## 11. Confirmation — 1 phút

- Kết quả mong đợi: 0.5 AVAX trên C-Chain, đủ cho hàng trăm lần deploy.
  > Nhận đúng thì bạn thấy 0.5 AVAX trên C-Chain; nghe ít nhưng đủ deploy vài trăm lần.
- Badge Funded xác nhận yêu cầu đã được xử lý.
  > Trên Builder Hub có badge Funded, thấy nó là yêu cầu của bạn đã được xử lý.
- Cùng trang có faucet cho các L1 khác (Echo, Dispatch, Dexalot), không dùng hôm nay.
  > Cùng trang đó có faucet cho mấy L1 khác như Echo, Dispatch, Dexalot; hôm nay mình không dùng, đừng bấm nhầm.

## 12. Contracts, and your first AvaxCat — 2 phút

- Từ đây làm việc trên một repo: AvaxCats của Team1 VN.
  > Từ đây trở đi mình làm trên một repo duy nhất: AvaxCats của Team1 VN.
- Pipeline theo mũi tên trên slide:
  > Nhìn theo mũi tên trên slide, có bốn khâu.
  - Generator `nullcat`: Python thuần, không phụ thuộc, sinh 48 ảnh 32×32 và metadata.
    > Đầu tiên là generator nullcat, Python thuần không phụ thuộc gì, sinh ra 48 con mèo 32×32 kèm metadata.
  - `AvaxCats.sol`: ERC-721 OpenZeppelin, tokenURI là data URI base64 lưu trên chain, không dùng IPFS.
    > Contract AvaxCats.sol là ERC-721 của OpenZeppelin; tokenURI là data URI base64 nằm luôn trên chain, không cần IPFS.
  - Deploy: một lệnh CLI, hoặc một nút trên web ký bằng ví.
    > Deploy có hai đường: một lệnh CLI, hoặc một nút trên web rồi ký bằng ví.
  - dApp Next.js để mint và đọc lại NFT từ chain.
    > Cuối cùng là dApp Next.js để mint và đọc lại NFT thẳng từ chain.

## 13. Before we start — 3 phút

- Kiểm tra ba lệnh: `node -v` (20 trở lên), `npm -v`, `git --version`. Báo ngay nếu thiếu.
  > Mở terminal gõ ba lệnh: node -v phải từ 20 trở lên, npm -v, và git --version; thiếu cái nào báo mình ngay.
- Python chỉ cần khi sinh lại ảnh; 48 con đã có trong repo.
  > Python không bắt buộc, chỉ cần khi bạn muốn sinh lại ảnh; 48 con đã có sẵn trong repo.
- Clone-and-run dành cho người muốn chạy local: clone, `cd mint-dapp`, `npm install`, copy `.env.example` thành `.env.local`, `npm run dev`.
  > Bạn nào muốn chạy local thì clone repo, vào mint-dapp, npm install, copy .env.example thành .env.local rồi npm run dev.
- Đường ngắn nhất, và là đường sẽ demo: mở team1vn.xyz, deploy và mint trực tiếp bằng ví, không cần cài đặt.
  > Còn đường ngắn nhất, cũng là đường mình demo, là mở team1vn.xyz, deploy và mint bằng ví luôn, không cài gì hết.

## 14. The project — 3 phút

- [DEMO] Mở team1vn.xyz, nêu ngắn: 48 con trên thanh chạy ngang, bốn con 1/1 vẽ tay nằm ngoài phân phối ngẫu nhiên.
  > Đây là team1vn.xyz: 48 con chạy trên thanh ngang, trong đó bốn con 1/1 vẽ tay, không nằm trong phân phối ngẫu nhiên.
- Bốn bước, mỗi bước một câu:
  > Bốn bước, mỗi bước một câu.
  - Generate: roll trait theo trọng số độ hiếm, 18 lớp, 139 trait, mỗi tổ hợp là duy nhất.
    > Generate là roll trait theo trọng số độ hiếm, 18 lớp, 139 trait, mỗi tổ hợp là duy nhất.
  - Contract: `mint(catId, uri)`, mỗi catId mint được một lần, ràng buộc nằm trong contract.
    > Contract có hàm mint(catId, uri), mỗi catId chỉ mint được một lần, và ràng buộc đó nằm trong contract chứ không phải trên web.
  - Deploy: bytecode compile sẵn lúc build, ví ký giao dịch tạo contract, không cần Remix hay private key trong file.
    > Bytecode được compile sẵn lúc build, ví của bạn ký giao dịch tạo contract; không cần Remix, không có private key nào nằm trong file.
  - Mint: gửi giao dịch bằng wagmi và viem, đọc event Minted để lấy tokenId, đọc `ownerOf` và `tokenURI` để hiển thị lại từ chain.
    > Mint thì gửi giao dịch bằng wagmi và viem, đọc event Minted để lấy tokenId, rồi gọi ownerOf và tokenURI để hiển thị lại đúng cái đang nằm trên chain.
- [DEMO] Mở repo, chỉ ba file: `contracts/AvaxCats.sol`, `scripts/deploy.mjs`, `src/components/MintPanel.tsx`. Không đi vào chi tiết.
  > Để mình mở repo, chỉ ba file thôi: AvaxCats.sol, deploy.mjs và MintPanel.tsx; chi tiết các bạn đọc sau.

## 15. Your turn — 10 phút, hỗ trợ tại chỗ

Demo một lượt trên màn hình lớn, khoảng 2 phút, rồi để phòng tự làm. Nếu đã chốt tạo L1 live ở slide 16, bấm deploy L1 trên Console ngay lúc này.
> Mình làm một lượt trên màn hình lớn khoảng 2 phút, rồi tới lượt các bạn.

- [DEMO] Connect wallet. Nếu ví ở mạng khác, trang hiển thị Switch network; bấm để chuyển sang Fuji. Thanh trạng thái hiển thị mạng, địa chỉ, số dư, số đã mint.
  > Bấm Connect wallet; ví đang ở mạng khác thì trang hiện Switch network, bấm là sang Fuji; thanh trạng thái trên cùng cho bạn thấy mạng, địa chỉ, số dư và số đã mint.
- [DEMO] Bước 01: mã nguồn contract hiển thị đầy đủ. Bấm Deploy contract, xác nhận trong Core. Khi xác nhận xong, trang hiển thị "Contract is live on Fuji" và địa chỉ. Địa chỉ được lưu trong trình duyệt.
  > Bước 01, mã nguồn contract hiện đầy đủ ở đây; bấm Deploy contract, xác nhận trong Core, đợi vài giây là thấy "Contract is live on Fuji" kèm địa chỉ, và trang tự nhớ địa chỉ này trong trình duyệt.
- [DEMO] Go to mint. Chọn một con trong lưới hoặc dùng Random. Panel hiển thị 18 trait.
  > Bấm Go to mint, chọn một con trong lưới hoặc bấm Random; panel bên cạnh liệt kê 18 trait của con đó.
- [DEMO] Mint NFT, xác nhận trong Core. Trạng thái hiển thị tokenId cùng link giao dịch và NFT trên Snowtrace. Bảng "On chain" phía dưới đọc trực tiếp từ contract.
  > Bấm Mint NFT, xác nhận trong Core; xong bạn thấy tokenId cùng link giao dịch và link NFT trên Snowtrace, còn bảng "On chain" bên dưới là đọc trực tiếp từ contract.
- [DEMO] Core → Collectibles để thấy NFT trong ví.
  > Mở Core, vào Collectibles, con mèo của bạn đã nằm trong ví.
- [DEMO] Register: Gmail đăng ký Builder Hub, Telegram, X. Contract và ví tự điền. Đây là bước ban tổ chức dùng để ghi nhận hoàn thành.
  > Bước cuối là Register: nhập Gmail bạn dùng đăng ký Builder Hub, Telegram, X; contract và ví tự điền; tụi mình dùng form này để ghi nhận ai đã hoàn thành.
- Chuyển sang thực hành. Đi từng bàn thay vì đứng ở bục.
  > Giờ tới lượt các bạn, mình đi từng bàn, kẹt chỗ nào giơ tay.
- Xử lý sự cố thường gặp:
  > Mấy lỗi hay gặp nhất:
  - Số dư 0: quay lại faucet, hoặc chuyển 0.2 AVAX từ ví dự phòng.
    > Số dư 0 thì quay lại faucet, hoặc đưa địa chỉ đây mình chuyển 0.2 AVAX.
  - Laptop hiển thị "Install Core Wallet": extension chưa bật hoặc chưa tải lại trang.
    > Laptop hiện "Install Core Wallet" là extension chưa bật hoặc chưa tải lại trang, F5 là được.
  - Điện thoại: mở link trong app Core, tab Browser. Trang có hướng dẫn "Mint on your phone".
    > Trên điện thoại phải mở link trong app Core, tab Browser; Safari với Chrome không nối được ví, trên trang có mục "Mint on your phone" hướng dẫn.
  - "Already minted": chỉ xảy ra với contract chung; chọn con khác.
    > "Already minted" chỉ xảy ra khi dùng contract chung, chọn con khác là xong.
  - Lỗi gas: trang hiển thị nguyên nhân, đưa về faucet.
    > Lỗi gas thì trang ghi rõ nguyên nhân, thường là hết AVAX, quay lại faucet.
- Tiêu chí hoàn thành: mỗi người có một NFT hiển thị trên Snowtrace.
  > Xong khi nào bạn thấy NFT của mình trên Snowtrace, lúc đó là chuẩn.

## 16. Builder Console — 5 phút

- [DEMO] build.avax.network/console/create-l1, điền trực tiếp:
  > Phần cuối, mình tạo một L1 ngay trên Console: vào build.avax.network/console/create-l1, điền trực tiếp.
  - Q1: Basic setup. Subnet, genesis và Validator Manager được điền sẵn.
    > Câu một chọn Basic setup, Subnet, genesis và Validator Manager được điền sẵn hết.
  - Q2: tên chain và ticker của gas token.
    > Câu hai đặt tên chain và ticker cho gas token, đặt gì cũng được.
  - Q3: địa chỉ Core nhận genesis supply.
    > Câu ba dán địa chỉ Core sẽ nhận genesis supply.
  - Q4: review, chọn Testnet, deploy. Console vận hành validator node.
    > Câu bốn xem lại, chọn Testnet, bấm deploy; validator node do Console vận hành, mình không phải dựng gì.
- Deploy chạy 8 bước (tạo Subnet, deploy Validator Manager, tạo chain, chuyển Subnet thành L1, khởi tạo validator set, verify) và mất vài phút. Đã bấm từ slide 15 thì mở lại xem tiến độ; chưa bấm thì chiếu clip 04 trên team1vn.xyz/demo.html.
  > Quá trình này chạy tám bước và mất vài phút, nên mình đã bấm từ lúc các bạn thực hành; giờ mở lại xem nó chạy tới đâu, còn toàn bộ quá trình mình có quay sẵn ở team1vn.xyz/demo.html.
- Nêu đánh đổi: chain riêng cho quyền kiểm soát phí, token gas và tập validator; đổi lại không có sẵn người dùng và thanh khoản của C-Chain. Chọn theo yêu cầu của sản phẩm.
  > Chain riêng cho bạn quyền kiểm soát phí, token gas và tập validator; đổi lại bạn không có sẵn người dùng và thanh khoản của C-Chain, nên chọn theo nhu cầu sản phẩm.

## 17. After today — 3 phút

- Builder Grant 10.000 USD cho prototype hoạt động. Contract vừa deploy cộng một ý tưởng và thời gian hoàn thiện là đủ để nộp.
  > Builder Grant 10.000 đô dành cho prototype chạy được; contract các bạn vừa deploy cộng một ý tưởng và vài tuần hoàn thiện là đủ để nộp.
- Builder Grant 30.000 USD cho team đã có sản phẩm và người dùng.
  > Mức 30.000 đô dành cho team đã có sản phẩm và người dùng thật.
- Hackathon dành cho sinh viên sắp diễn ra. Theo dõi Builder Hub và kênh Telegram Team1. Nếu đã có ngày, nêu ngày.
  > Sắp tới có hackathon cho sinh viên, các bạn theo dõi Builder Hub và Telegram Team1; có ngày cụ thể mình sẽ báo trong nhóm.

## 18. Resources — giữ slide đến khi kết thúc

- Ba thứ mang về: repo có contract hoàn chỉnh và slide, Docs, faucet. Thêm trang demo team1vn.xyz/demo.html để xem lại ở nhà.
  > Mang về ba thứ: repo có contract hoàn chỉnh và slide, Docs, và faucet; ngoài ra team1vn.xyz/demo.html có bốn clip quay lại toàn bộ quy trình để xem lại ở nhà.
- Kênh liên lạc: Telegram Avalanche VN (chat chung), Telegram Team1 VN builders, X @Team1VN. Tất cả có ở footer team1vn.xyz.
  > Kênh liên lạc: Telegram Avalanche VN để chat chung, Telegram Team1 VN builders cho anh em build, X thì @Team1VN; tất cả có ở footer team1vn.xyz.
- Người trình bày ở lại 15 phút hỗ trợ người chưa mint xong.
  > Mình ở lại thêm 15 phút, bạn nào chưa mint xong cứ ở lại làm cùng mình.
