# Design Changelog

Nhật ký theo dõi các thay đổi kiến trúc và quyết định thiết kế hệ thống của dự án Quick Text.

---

### [2026-09-07] - Tối Ưu Hóa Giao Diện Hộp Cuộn Stream & Tinh Gọn Thẻ Tin Nhắn (Ultra-Compact Cards)
- **Chủ đề**: Scrollable Stream Container & Ultra-Compact Text Cards for Mobile/Desktop
- **Nội dung thống nhất**:
  1. **Hộp Cuộn Nội Bộ (Internal Scroll Box)**:
     - Biến khu vực Received Stream thành một box cuộn độc lập (`overflow-y: auto`, desktop max-height `420px`, mobile `270px`).
     - Thanh cuộn thiết kế siêu mỏng (5px), bán trong suốt, bo tròn chuẩn dark modern UI.
     - Thêm nút "Clear list" tiện ích để người dùng có thể xóa nhanh lịch sử trên màn hình khi cần.
  2. **Thẻ Tin Nhắn Siêu Tinh Gọn (Ultra-Compact)**:
     - Di chuyển nút `COPY` và nút `Open link` lên cùng dòng Topbar (ngang hàng với tên thiết bị và timestamp).
     - Loại bỏ hoàn toàn hàng `card-actionbar` thừa thãi bên dưới, giảm hơn 60% chiều cao của mỗi thẻ đối với văn bản ngắn/số lẻ (như "4", "5", "6", "7").
     - Tối ưu padding và font size giúp hiển thị được nhiều nội dung hơn mà không đẩy Session Bridge / QR code ra khỏi khung nhìn.

---

### [2026-09-07] - Đồng bộ Lịch sử Từ RAM (Peer-to-Peer Backfill) Cho Thiết Bị Mới Vào
- **Chủ đề**: In-Memory History Synchronization Without Disk Persistence
- **Nội dung thống nhất**:
  1. **Bảo mật Quán Net (Zero-Disk)**: Không sử dụng `localStorage` hay database để tránh nguy cơ rò rỉ OTP cho người ngồi sau. Dữ liệu tin nhắn chỉ tồn tại trong RAM của các trình duyệt đang mở tab trong phiên.
  2. **Cơ chế Backfill Tức thì**:
     - Thiết bị mới vừa kết nối sẽ tự động phát tín hiệu `sync-req` qua kênh Realtime.
     - Thiết bị cũ đang trực tuyến trong phòng sẽ đóng gói danh sách tin nhắn hiện tại từ RAM và bắn trả qua `sync-res`.
     - Thiết bị mới nhận được dữ liệu, tự động lọc trùng lặp (`de-duplicate`) theo `id` và nạp vào màn hình ngay lập tức (< 0.1s).
  3. **Tự hủy Tuyệt đối**: Khi thiết bị cuối cùng tắt tab, toàn bộ RAM được giải phóng, phòng biến mất không để lại dấu vết.
- **Tài liệu đã cập nhật**:
  - [QUICK_TEXT_SYSTEM.md](file:///e:/GO/quick-text/docs/architecture/core/QUICK_TEXT_SYSTEM.md)

---

### [2026-09-07] - Cập nhật Tính năng Connect Code & Tinh gọn Giao diện Mobile
- **Chủ đề**: Thay thế Reset bằng Connect Modal và Chuyển toàn bộ UI sang tiếng Anh
- **Nội dung thống nhất**:
  1. **Nút Connect & Modal Nhập Code**:
     - Bỏ nút Reset gây trùng lặp tính năng với nút New.
     - Thay bằng nút `Connect` màu Cyan: Mở popup hiện đại (Backdrop blur) cho phép người dùng nhập trực tiếp mã phòng bất kỳ (ví dụ: `Q3N4S5`) để tham gia nhanh mà không cần quét QR.
     - Ô nhập tự động viết hoa, phông chữ Monospace lớn, hỗ trợ nhấn `Enter` để kết nối tức thì.
  2. **Tối ưu hóa Mobile & Tiếng Anh**:
     - Chuyển toàn bộ ngôn ngữ sang tiếng Anh (`QuickText`, `CLIPBOARD`, `Quick Send`, `Received Stream`, `Session Bridge`).
     - Tinh gọn chiều cao các khối, đưa phần chat lên trên QR, chống tràn chữ với `overflow-wrap: anywhere;`.
- **Tài liệu đã cập nhật**:
  - [QUICK_TEXT_SYSTEM.md](file:///e:/GO/quick-text/docs/architecture/core/QUICK_TEXT_SYSTEM.md)

---

### [2026-09-07] - Khởi tạo Thiết kế Hệ thống Quick Text (Giai đoạn 1)
- **Chủ đề**: Quick Text - Remote Clipboard & Instant Text Transfer (Mesh Realtime Không Lưu Vết)
- **Nội dung thống nhất**:
  1. **Định vị & Vỏ bọc (Facade)**: Thiết kế giao diện như một tiện ích "Quick Copy / Remote Clipboard" phục vụ chuyển văn bản/OTP tức thì giữa điện thoại và máy tính (máy net/máy lạ). Không gán nhãn phòng chat để người dùng tự khám phá.
  2. **Kiến trúc Serverless 0đ**: Deploy giao diện lên Vercel, xử lý truyền tải thời gian thực đa thiết bị bằng WebSocket Presence/Broadcast (Pusher / Supabase). Không dùng database, không lưu trữ đĩa.
  3. **Quy tắc Bất biến (Core Invariants)**:
     - Zero Persistence: Không lưu lịch sử vào DB hoặc LocalStorage.
     - Zero History on Join: Thiết bị vào sau chỉ nhận text phát sinh từ thời điểm kết nối, bảo đảm quyền riêng tư tuyệt đối.
     - Multi-device Presence: Đa thiết bị kết nối vào cùng 1 session, tự động hiển thị số lượng máy đang ghép đôi.
     - Auto-Destroy: Phiên chia sẻ tự giải phóng hoàn toàn khi không còn kết nối nào.
     - Giới hạn tải: Giai đoạn 1 giới hạn tối đa 5,000 ký tự/lần gửi.
- **Tài liệu đã cập nhật**:
  - [QUICK_TEXT_SYSTEM.md](file:///e:/GO/quick-text/docs/architecture/core/QUICK_TEXT_SYSTEM.md)
