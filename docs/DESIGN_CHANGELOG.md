# Design Changelog

Nhật ký theo dõi các thay đổi kiến trúc và quyết định thiết kế hệ thống của dự án Quick Text.

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
