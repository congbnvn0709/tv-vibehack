# Custom TV Model & Safe Manual Debloat Design

## Intent & Why
Ứng dụng hiện chỉ có 6 profile mẫu có sẵn. Đối với các dòng TV chưa có trong danh sách (Sony, Casper, Hisense, Sharp, Realme...), người dùng cần có khả năng:
1. Nhập model của họ hoặc tự động nhận diện từ TV qua ADB.
2. Lựa chọn: **Bỏ qua Debloat** (chỉ cài Launcher tvOS + Kids Mode an toàn) HOẶC **Debloat thủ công** (quét app trên TV để người dùng chọn gỡ).
3. **Tuyệt đối an toàn:** Bảo vệ và khóa cứng (không cho phép tắt) các tính năng cốt lõi của TV: Tìm kiếm giọng nói (Voice Search), Google Assistant, Chromecast, Bluetooth Remote và các cổng HDMI / TV Inputs.

## Approaches Considered
- **Phương án A (Được chọn): Quét trực tiếp qua ADB kèm 2 tầng lọc thông minh và Whitelist bảo vệ.**
  - Quét danh sách package trực tiếp từ thiết bị đang kết nối.
  - Phân loại: 
    - *Nhóm bảo vệ hệ thống*: Khóa checkbox, có icon khiên bảo vệ.
    - *Nhóm app rác gợi ý*: Tự động lọc các app bloatware phổ biến.
    - *Nhóm app thông thường*: Có thanh tìm kiếm để người dùng tự tick.
  - Người dùng có thể chọn "Bỏ qua Debloat" hoàn toàn nếu chỉ muốn đổi launcher.
- **Phương án B (Bị loại): Danh sách app tĩnh cứng.**
  - Không thể dọn app rác riêng của các hãng TV lạ và không biết được app nào đang thực sự cài trên TV.

## Whitelist Bảo vệ Hệ thống (Strict System Safeguards)
Các package sau sẽ được đánh dấu `isProtected: true` và bị vô hiệu hóa thao tác tắt trong giao diện:
1. **Tìm kiếm giọng nói & Google Assistant:**
   - `com.google.android.katniss`
   - `com.google.android.speech.pumpkin`
   - `com.google.android.googlequicksearchbox`
2. **Chromecast & Screen Cast:**
   - `com.google.android.apps.mediashell`
3. **Bluetooth Remote & Điều khiển:**
   - `com.google.android.tv.remote.service`
   - `com.android.bluetooth`
   - Các package chứa từ khóa: `remote`, `bluetooth`, `rcu`
4. **HDMI, TV Tuner & Inputs:**
   - `com.android.tv`
   - Các package chứa từ khóa: `tvcenter`, `tvsetting`, `input`, `hdmi`

## Architecture & Implementation
1. **Main Process (`desktop/src/main/services/package-scanner.ts`):**
   - Lệnh ADB: `pm list packages -s` (hệ thống) và `pm list packages -3` (bên thứ ba).
   - Hàm `scanAndClassifyPackages(host, port)` trả về danh sách có gắn cờ `isProtected` và `isRecommended`.
2. **IPC Channel (`desktop/src/shared/types.ts`):**
   - `tv:scan-packages` trả về `ScannedPackage[]`.
3. **Renderer (`desktop/src/renderer/`):**
   - Thêm thẻ `➕ Tivi khác (Tùy chỉnh / Tự động)` trong tab "Chọn loại TV".
   - Khi chọn thẻ này, hiển thị 2 nút lựa chọn:
     - *Chế độ 1:* Bỏ qua Debloat (được chọn mặc định - an toàn 100%).
     - *Chế độ 2:* Debloat thủ công (mở bảng danh sách app có ô tìm kiếm, icon khiên bảo vệ cho Assistant, Chromecast, HDMI, Remote).
   - Khi thực thi pipeline, truyền danh sách `customPackages` được chọn vào `runPipeline`.
