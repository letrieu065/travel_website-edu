# Tài Liệu Chi Tiết Thay Đổi: Chức Năng Admin Reset Mật Khẩu User & Gửi Qua Email

Tài liệu này mô tả chi tiết toàn bộ các thay đổi đã thực hiện ở **Backend (`Server`)** và **Frontend (`Client`)** cho chức năng cho phép quản trị viên (`admin`) đặt lại mật khẩu của người dùng (`user`) và gửi mật khẩu mới trực tiếp qua email của người dùng đó.

---

## 1. Tổng Quan Luồng Hoạt Động

1. Trên trang quản trị `/admin` (tab **Người dùng** hoặc trong **Drawer chi tiết hồ sơ người dùng**), Admin nhấn nút **Reset mật khẩu & gửi email** tại dòng của user cần đặt lại mật khẩu.
2. Modal `ResetUserPasswordModal` mở ra, hiển thị thông tin user (họ tên, email, vai trò, nguồn đăng nhập `local`/`google`/`facebook`) và cho phép chọn 1 trong 2 phương thức:
   - **Tự động tạo mật khẩu ngẫu nhiên (Mặc định):** Hệ thống backend tự sinh mật khẩu mạnh 12 ký tự bằng CSPRNG (`crypto.randomInt`).
   - **Nhập mật khẩu thủ công:** Admin tự nhập mật khẩu (hoặc bấm **Tạo gợi ý mạnh** trên UI), phải đáp ứng quy tắc bảo mật tối thiểu 8 ký tự, không khoảng trắng, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
3. Frontend gửi request `POST /api/v1/admin/users/:id/reset-password` kèm `Bearer <token>` của Admin.
4. Backend kiểm tra xác thực (`authenticate`) và phân quyền (`requireAdmin`), xác thực UUID, kiểm tra user tồn tại và có email, kiểm tra cấu hình SMTP (`MY_GMAIL`, `GMAIL_APP_PASSWORD`), băm mật khẩu mới bằng `bcrypt`, cập nhật `users.password_hash` trong PostgreSQL và gửi email thông báo chứa mật khẩu mới qua `nodemailer`.
5. Nếu gửi email thất bại, Backend **tự động rollback** `users.password_hash` về giá trị trước đó và trả mã lỗi `502` để tài khoản người dùng không bị khóa ngoài ý muốn.
6. Nếu gửi email thành công, Backend ghi thêm thông báo hệ thống (không chứa mật khẩu plaintext) vào bảng `notifications` và trả về kết quả thành công (không trả mật khẩu plaintext trong JSON response).

---

## 2. Chi Tiết Các File Đã Chỉnh Sửa

### 2.1. Backend (`Server`)

#### A. [Server/src/features/admin/admin.route.ts](file:///e:/travel_website-edu/Server/src/features/admin/admin.route.ts)
- **Thay đổi (dòng 21):**
  - Thêm route mới trong nhóm `USERS`:
    ```ts
    router.post('/users/:id/reset-password', adminController.resetUserPassword);
    ```
- **Bảo mật đường dẫn:**
  - `adminRoute` đã được gắn tại [Server/src/index.ts](file:///e:/travel_website-edu/Server/src/index.ts#L79) qua:
    ```ts
    app.use('/api/v1/admin', authenticate, requireAdmin, adminRoute);
    ```
  - Do đó mọi request tới `POST /api/v1/admin/users/:id/reset-password` đều bắt buộc phải có JWT hợp lệ (`401` nếu thiếu/sai token) và `role === 'admin'` (`403` nếu là user thường).
- **File biên dịch cập nhật đi kèm:** `admin.route.js`, `admin.route.js.map`, `admin.route.d.ts`.

---

#### B. [Server/src/features/admin/admin.controller.ts](file:///e:/travel_website-edu/Server/src/features/admin/admin.controller.ts)
- **Import mới (dòng 3):**
  - Thêm `import { AuthRequest } from '../../middleware/auth.middleware';` để lấy thông tin tên admin đang thực hiện thao tác (`req.user?.full_name`).
- **Controller mới `resetUserPassword` (dòng 115–154, đánh dấu `// (Đã thêm)`):**
  - Lấy `id` từ `getParam(req.params.id)`.
  - Đọc `newPassword` từ `req.body` (hỗ trợ fallback field `password` nếu gọi API trực tiếp bằng `password`).
  - Lấy `adminName` từ `(req as AuthRequest).user?.full_name`.
  - Gọi `adminService.resetUserPassword(id, { newPassword: customPassword, adminName })`.
  - **Chuẩn hóa HTTP Status & Response:**
    - `200 OK`: `{ status: 'success', message: 'Đã đặt lại mật khẩu và gửi email đến <email>', data: result }`
    - `502 Bad Gateway`: Khi `error.message` chứa `'Không thể gửi email'` (gửi SMTP thất bại, mật khẩu cũ đã được rollback).
    - `500 Internal Server Error`: Khi thiếu cấu hình `'chưa cấu hình email'` hoặc lỗi nội bộ khác qua `handleControllerError`.
    - `400 Bad Request`: Khi `error.message` chứa `'ID người dùng không hợp lệ'`, `'Mật khẩu phải có'`, hoặc `'chưa có địa chỉ email'`.
    - `404 Not Found`: Khi `error.message` chứa `'Không tìm thấy người dùng'`.
  - *Lỗi đã phát hiện và sửa khi test:* Ban đầu điều kiện kiểm tra `400` dùng `msg.includes('Mật khẩu')` đứng trước kiểm tra `502`, khiến thông báo lỗi SMTP `"Không thể gửi email chứa mật khẩu mới đến người dùng. Mật khẩu cũ vẫn được giữ nguyên."` (có chứa chữ `"Mật khẩu"`) bị bắt nhầm thành `400` thay vì `502`. Đã sửa lại thứ tự kiểm tra (`502` và `500` trước `400`) và đổi điều kiện `400` thành `msg.includes('Mật khẩu phải có')`.
- **Export (dòng 804):**
  - Thêm `resetUserPassword` vào `export default`.
- **File biên dịch cập nhật đi kèm:** `admin.controller.js`, `admin.controller.js.map`, `admin.controller.d.ts`.

---

#### C. [Server/src/features/admin/admin.service.ts](file:///e:/travel_website-edu/Server/src/features/admin/admin.service.ts)
- **Import mới (dòng 1–5):**
  - `import crypto from 'crypto';`
  - `import nodemailer from 'nodemailer';`
  - `import env from '../../config/env';`
- **Hằng số kiểm tra (dòng 264–265):**
  - `STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;`
  - `UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;`
- **Các hàm mới thêm (đều có comment `// (Đã thêm)`):**
  1. `escapeHtml(value: string)` (dòng 268–275):
     - Escape `&`, `<`, `>`, `"`, `'` trước khi chèn `fullName`, `email`, `newPassword`, `adminName`, `resetTime` vào nội dung HTML email để tránh lỗi render hoặc HTML injection.
  2. `maskEmailAddress(email: string)` (dòng 278–280):
     - Che phần tên email khi ghi log (`console.log` / `console.error`) và trả thêm trường `maskedEmail`.
  3. `generateRandomPassword(length = 12)` (dòng 283–309):
     - Sinh mật khẩu ngẫu nhiên an toàn mật mã học bằng `crypto.randomInt`.
     - Bảo đảm có ít nhất 1 chữ hoa (`ABCDEFGHJKLMNPQRSTUVWXYZ`), 1 chữ thường (`abcdefghijkmnpqrstuvwxyz`), 1 chữ số (`23456789`), và 1 ký tự đặc biệt (`@#$%&*!?`). Loại bỏ các ký tự dễ nhìn nhầm khi đọc email (`I`, `O`, `l`, `o`, `0`, `1`).
     - Xáo trộn thứ tự ký tự bằng thuật toán Fisher-Yates dùng `crypto.randomInt`.
  4. `sendAdminResetPasswordEmail(params)` (dòng 312–381):
     - Lấy thông tin SMTP từ `process.env.MY_GMAIL || env.MY_GMAIL` và `process.env.GMAIL_APP_PASSWORD || env.GMAIL_APP_PASSWORD`.
     - Khởi tạo `nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })`.
     - Gửi email với tiêu đề `[Natura Travel] Mật khẩu tài khoản của bạn đã được đặt lại`, kèm cả phiên bản `text` (plain text) và `html` (giao diện thương hiệu Natura Travel, hiển thị thời gian đặt lại theo múi giờ `Asia/Ho_Chi_Minh`, tên quản trị viên, khối hiển thị mật khẩu mới bằng font monospace và khuyến nghị đổi lại mật khẩu sau khi đăng nhập).
  5. `resetUserPassword(id, options)` (dòng 384–489):
     - Kiểm tra `id` khớp `UUID_REGEX`.
     - Nếu truyền `options.newPassword` khác rỗng: kiểm tra kiểu `string`, không có khoảng trắng (`!/\s/.test(...)`), và đạt `STRONG_PASSWORD_REGEX`. Nếu bỏ trống: gọi `generateRandomPassword(12)`.
     - Truy vấn user qua `prisma.users.findUnique` (`id`, `email`, `full_name`, `password_hash`, `auth_provider`, `role`). Báo lỗi nếu không tìm thấy user hoặc user không có email.
     - Kiểm tra cấu hình `MY_GMAIL` & `GMAIL_APP_PASSWORD` trước khi ghi database để tránh đổi mật khẩu khi chưa cấu hình mail.
     - Lưu `previousPasswordHash = user.password_hash`, băm mật khẩu mới bằng `bcrypt.hash(plainPassword, 10)`, cập nhật `users.password_hash`.
     - Gọi `sendAdminResetPasswordEmail(...)`. Nếu gửi mail ném lỗi: thực hiện **rollback** `users.password_hash` về `previousPasswordHash` trong khối `catch`, ghi log lỗi (che email) và ném lỗi `"Không thể gửi email chứa mật khẩu mới đến người dùng. Mật khẩu cũ vẫn được giữ nguyên."`.
     - Tạo thông báo trong bảng `notifications` (`type: 'system'`, không lưu mật khẩu vào nội dung notification) trong `try/catch` không làm gián đoạn luồng chính.
     - Trả về `{ userId, email, maskedEmail, fullName, mode: 'custom' | 'auto_generated', emailSent: true }` — **không trả về và không log mật khẩu plaintext**.
- **Export (dòng 1326):**
  - Thêm `resetUserPassword` và `generateRandomPassword` vào `export default`.
- **File biên dịch cập nhật đi kèm:** `admin.service.js`, `admin.service.js.map`, `admin.service.d.ts`.

---

### 2.2. Frontend (`Client`)

#### A. [Client/app/admin/_components/DetailAndCrudModals.tsx](file:///e:/travel_website-edu/Client/app/admin/_components/DetailAndCrudModals.tsx)
- **Import mới (dòng 13, 16, 18, 26):**
  - Thêm `Eye`, `EyeOff`, `KeyRound`, `Sparkles` từ `lucide-react`.
- **Cập nhật `UserDetailDrawer` (dòng 1363–1379 & 1506–1534):**
  - Thêm prop tùy chọn `onResetPassword?: (user: UserItem) => void;` vào `UserDetailDrawerProps`.
  - Thêm nút **Reset mật khẩu & gửi mail** (icon `KeyRound`) ở thanh thao tác đáy drawer: khi bấm sẽ đóng drawer và mở `ResetUserPasswordModal` cho user đó.
- **Thêm `ResetUserPasswordModal` (dòng 2493–2863):**
  - Hằng số `STRONG_PASSWORD_REGEX` và hàm `generateStrongPasswordSuggestion(length = 12)` (`// (Đã thêm)`) sử dụng `window.crypto.getRandomValues` (kèm rejection sampling tránh sai lệch phân phối modulo) để tạo gợi ý mật khẩu mạnh khi Admin chọn nhập thủ công.
  - Component `ResetUserPasswordModal` (`// (Đã thêm)`) gồm:
    - Hiển thị thông tin user mục tiêu (`AvatarBadge`, `full_name`, `email`, `role`).
    - Hiển thị hộp thông tin bổ sung nếu `user.auth_provider` khác `'local'` (`google`/`facebook`), giải thích việc đặt lại mật khẩu sẽ thiết lập thêm mật khẩu cục bộ để user có thể đăng nhập bằng email & mật khẩu mới.
    - 2 radio chọn chế độ:
      1. `auto`: **Tự động tạo mật khẩu ngẫu nhiên (Khuyên dùng)** — gửi `{}` lên server để server tự sinh và gửi email.
      2. `custom`: **Nhập mật khẩu mới thủ công** — hiển thị input mật khẩu, nút ẩn/hiện (`Eye`/`EyeOff`), nút **Tạo gợi ý mạnh** (`Sparkles`) và kiểm tra định dạng phía client trước khi gọi API.
    - Hộp cảnh báo xác nhận trước khi gửi, hiển thị lỗi chi tiết (`modalError`), trạng thái loading (`Đang gửi email...`), khóa đóng modal trong lúc đang gửi request, hỗ trợ phím `Escape` và click ra ngoài nền để đóng modal khi không đang gửi.
    - Gọi `POST ${API_URL}/api/v1/admin/users/${user.id}/reset-password` và truyền kết quả qua `onSuccess` / `onError`.

---

#### B. [Client/app/admin/page.tsx](file:///e:/travel_website-edu/Client/app/admin/page.tsx)
- **Import mới (dòng 27 & 81):**
  - Import `KeyRound` từ `lucide-react`.
  - Import `ResetUserPasswordModal` từ `./_components/DetailAndCrudModals`.
- **State mới (dòng 236):**
  - `const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);`
- **Nút thao tác trong bảng Quản lý Thành viên (`activeTab === 'users'`, dòng 2819–2826):**
  - Thêm nút icon `KeyRound` với `title="Reset mật khẩu & gửi email"` đặt cạnh nút chỉnh sửa thông tin và nút đổi vai trò.
- **Kết nối `UserDetailDrawer` & `ResetUserPasswordModal` (dòng 3190 & 3255–3261):**
  - Truyền `onResetPassword={(u) => setResetPasswordUser(u)}` cho `<UserDetailDrawer />`.
  - Render `<ResetUserPasswordModal key={resetPasswordUser?.id || 'reset-password-modal'} user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} onSuccess={(msg) => pushToast('success', msg)} onError={(msg) => pushToast('error', msg)} />` để reset toàn bộ state nội bộ của modal sạch sẽ theo từng user được chọn và hiển thị toast thông báo thành công/thất bại.

---

## 3. Cấu Hình Môi Trường Liên Quan

- **Backend (`Server/.env`):**
  - `MY_GMAIL`: Tài khoản Gmail dùng để gửi email.
  - `GMAIL_APP_PASSWORD`: Mật khẩu ứng dụng (App Password) của Gmail.
  - `JWT_SECRET`: Khóa bí mật ký/xác thực JWT (tối thiểu 32 ký tự).
  - *(Đã kiểm tra `Server/.env`: các khóa `MY_GMAIL`, `GMAIL_APP_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL` đều đã có giá trị cấu hình).*
- **Frontend (`Client/.env.local`):**
  - `NEXT_PUBLIC_API_URL`: URL của backend (mặc định `http://localhost:3600`).

---

## 4. Kết Quả Kiểm Tra & Xác Minh

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả | Ghi chú / Phạm vi |
| :--- | :--- | :--- | :--- |
| Biên dịch TypeScript Server | `npm --prefix Server run build` | **Pass** (exit code 0) | Cập nhật `admin.service.js`, `admin.controller.js`, `admin.route.js` và `.d.ts`/`.js.map`. |
| Typecheck cấu hình production Server | `npx --prefix Server tsc -p Server/tsconfig.build.json --noEmit` | **Pass** (exit code 0) | Không có lỗi TypeScript. |
| ESLint các file Frontend đã sửa | `npx eslint app/admin/_components/DetailAndCrudModals.tsx app/admin/page.tsx` (trong `Client`) | **Pass** (exit code 0) | 0 lỗi, 0 cảnh báo. |
| Typecheck Frontend | `npx tsc --noEmit` (trong `Client`) | **Pass** (exit code 0) | Không có lỗi TypeScript. |
| Test logic & HTTP E2E Backend | [test_admin_reset_password.ts](file:///C:/Users/ADMIN/.gemini/antigravity/brain/f44350a6-b226-44a3-acc6-8689fafb8955/scratch/test_admin_reset_password.ts) | **Pass 8/8** | Chạy với mock in-memory cho `prisma.users`, `prisma.notifications`, `nodemailer.createTransport` và gọi trực tiếp Express `app` in-process (do sandbox không có kết nối mạng tới SMTP/TCP socket). |
| Next.js production build | `npm --prefix Client run build` | **Không hoàn tất trong sandbox** | Lỗi ở bước tải `Geist Mono` và `Roboto` từ `fonts.googleapis.com` do môi trường sandbox không có internet. |

### Chi tiết 8 kịch bản đã kiểm thử trong `test_admin_reset_password.ts`
1. `generateRandomPassword(12)` qua 50 lần sinh liên tiếp: luôn đủ 12 ký tự, không khoảng trắng, đạt chuẩn mật khẩu mạnh và không trùng lặp.
2. Từ chối UUID không hợp lệ (`400`).
3. Báo lỗi khi không tìm thấy user (`404`).
4. Báo lỗi khi user không có địa chỉ email (`400`).
5. Từ chối mật khẩu tùy chọn yếu hoặc có chứa khoảng trắng (`400`).
6. Chế độ tự động sinh mật khẩu: cập nhật `password_hash` trong DB, gửi email đúng địa chỉ, mật khẩu trong email khớp `bcrypt.compare` với hash mới, escape HTML trong tên user (`<`, `&`), tạo notification hệ thống, không rò rỉ mật khẩu trong object trả về.
7. Rollback khi gửi mail thất bại: giả lập `sendMail` ném lỗi SMTP timeout -> `users.password_hash` được khôi phục về hash cũ.
8. Kiểm thử HTTP E2E qua Express `app` (`POST /api/v1/admin/users/:id/reset-password` và `POST /api/v1/auth/login`):
   - Không có token -> `401`.
   - Token user thường (`role: 'user'`) -> `403`.
   - Token admin với UUID sai -> `400`.
   - Token admin khi SMTP lỗi -> `502` và hash cũ được giữ nguyên.
   - Token admin đặt mật khẩu tùy chọn -> `200`, gửi email thành công, user đăng nhập được qua `/api/v1/auth/login` bằng mật khẩu mới và mật khẩu cũ bị từ chối (`401`).
