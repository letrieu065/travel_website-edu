# Báo Cáo Chi Tiết Cập Nhật Trang Quản Trị Admin (`Client/app/admin`)

Tài liệu này tổng hợp cụ thể và đầy đủ các thay đổi về giao diện, tính năng, logic tìm kiếm/sắp xếp, sửa lỗi dữ liệu và kết quả kiểm tra cho trang **Admin Command Center** (`Client/app/admin`).

---

## 1. Tổng Quan Thay Đổi

### Mục tiêu đã hoàn thành
1. **Nâng cấp giao diện & trải nghiệm (UI/UX):** Chuyển từ bố cục bảng đơn giản 1 file sang giao diện Admin hiện đại, phân tách component sạch sẽ, có Sidebar responsive (hỗ trợ Drawer trên mobile), Header dính (`sticky`) kèm đồng hồ đồng bộ dữ liệu, hệ thống Toast thông báo nổi, và Modal xác nhận thao tác thay cho `window.confirm`.
2. **Hiển thị chi tiết & đầy đủ thông tin (9 phân hệ):** Mở rộng từ 7 tab cơ bản lên **9 phân hệ** (`overview`, `bookings`, `payments`, `tours`, `hotels`, `flights` gồm cả `planes`, `users`, `reviews`, `revenue`), bổ sung Slide-over Detail Drawers và Modal Thêm/Sửa/Xóa trực tiếp trên trang Admin.
3. **Sắp xếp trên tất cả các cột (Sort ↑ / ↓ / Mặc định):** Áp dụng component `SortableTh` và bộ sắp xếp đa kiểu dữ liệu `sortItems` cho mọi cột dữ liệu của từng bảng.
4. **Tìm kiếm & lọc tối ưu thao tác (Search & Filter):** Hỗ trợ tìm kiếm **tiếng Việt không dấu & đa trường**, phím tắt `/` (focus ô tìm kiếm), `Esc` (xóa từ khóa), `Ctrl+K` (mở tìm kiếm toàn hệ thống), Quick Filter Chips có đếm số lượng thực tế, bộ lọc dropdown bổ sung, phân trang linh hoạt và xuất file CSV chuẩn UTF-8.

### Danh sách file thuộc phạm vi Admin
| File | Trạng thái | Vai trò | Số dòng |
| :--- | :--- | :--- | :---: |
| [Client/app/admin/page.tsx](file:///E:/travel_website-edu/Client/app/admin/page.tsx) | Đã viết lại / Nâng cấp | Trang điều phối chính (9 tab, state, filter/sort, CRUD, toast, shortcuts) | 3.275 |
| [Client/app/admin/_components/types.ts](file:///E:/travel_website-edu/Client/app/admin/_components/types.ts) | Tạo mới | Định nghĩa toàn bộ TypeScript interfaces & types khớp API backend | 242 |
| [Client/app/admin/_components/utils.ts](file:///E:/travel_website-edu/Client/app/admin/_components/utils.ts) | Tạo mới | Các hàm chuẩn hóa tìm kiếm không dấu, sort đa kiểu, định dạng, tra cứu, CSV | 354 |
| [Client/app/admin/_components/TableControls.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/TableControls.tsx) | Tạo mới | `SortableTh`, `SearchFilterToolbar`, `PaginationBar`, Badges & Empty state | 657 |
| [Client/app/admin/_components/OverviewSection.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/OverviewSection.tsx) | Tạo mới | Tab Tổng quan: 6 KPI cards, cảnh báo vận hành & 2 bảng hoạt động gần đây | 667 |
| [Client/app/admin/_components/RevenueSection.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/RevenueSection.tsx) | Tạo mới | Tab Doanh thu: biểu đồ cột, top dịch vụ, tỷ trọng thực tế từ DB | 821 |
| [Client/app/admin/_components/DetailAndCrudModals.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/DetailAndCrudModals.tsx) | Tạo mới | Global Search `Ctrl+K`, 4 Detail Drawers, 6 CRUD/Action Modals | 2.863 |

> **Lưu ý về tính năng đồng bộ sẵn trong working tree:** Trong quá trình kiểm tra, phần chức năng **Đặt lại mật khẩu & gửi email** (`ResetUserPasswordModal` kết nối `POST /api/v1/admin/users/:id/reset-password` cùng nút `KeyRound` trong bảng Thành viên và `UserDetailDrawer`) đã được giữ nguyên và tích hợp đầy đủ chữ ký kiểu dữ liệu vào `DetailAndCrudModals.tsx` và `page.tsx`. Ngoài ra các thay đổi khác có sẵn trong git (`Server/src/features/admin/*`, `Client/app/detail/page.tsx`, `Client/components/layout/UserLayout.tsx`) không bị ghi đè.

---

## 2. Các Lỗi & Hạn Chế Ở Bản Cũ Đã Được Khắc Phục

| Vấn đề ở bản cũ | Nguyên nhân | Cách đã sửa |
| :--- | :--- | :--- |
| **Chuyến bay hiển thị sai hãng & mẫu tàu bay** | `page.tsx` cũ đọc `f.plane?.airline_name` và `f.plane?.model` nên luôn rơi về fallback `'Vietnam Airlines'` / `'Airbus A321'`, trong khi API trả về `planes: { airline, plane_number, total_seats }` | Đổi sang `f.planes?.airline`, `f.planes?.plane_number`, `f.planes?.total_seats`; hiển thị kèm `AirlineLogoBadge` và thanh tỷ lệ ghế trống. |
| **Bộ lọc trạng thái đơn không khớp thực tế** | Bản cũ lọc giá trị `'cancelled'`, nhưng hệ thống thực tế dùng `'pending'`, `'paid'`, `'failed'`, `'refund_requested'`, `'refunded'` | Bổ sung đầy đủ các trạng thái qua `getPaymentStatusMeta`, gộp `'failed'`/`'cancelled'` hợp lý và hiển thị chip từng trạng thái. |
| **Giới hạn tải tối đa 50 bản ghi** | Các lệnh gọi API cũ cố định `?limit=50`, dễ bị thiếu dữ liệu khi hệ thống có >50 dòng | Tạo `fetchAdminCollection` tải `page=1&limit=500` và tự động tải nối tiếp tối đa 4 trang (2.000 bản ghi) nếu `total > 500`. |
| **Tab Doanh thu dùng số liệu giả lập** | Bản cũ hardcode `~65%`, `~25%`, `~10%` và không gọi API doanh thu | Kết nối trực tiếp `/api/v1/admin/dashboard/revenue` và `/api/v1/admin/dashboard/top-items`, đồng thời tính tỷ trọng thực tế từ `bookings` và `payments`. |
| **Thiếu dữ liệu chi tiết & thao tác sửa/xóa** | Bản cũ chỉ xem bảng tóm tắt, không có lịch khởi hành, tiện ích, ảnh, đánh giá, giao dịch, tàu bay hay modal CRUD | Bổ sung đầy đủ Drawer xem chi tiết, CRUD Modal và quản lý lịch khởi hành/ảnh trực tiếp. |
| **Chưa có sort cột & search hạn chế** | Không có sort theo cột; ô tìm kiếm cũ có phân biệt dấu tiếng Việt và chỉ tìm 1-2 trường | Bổ sung `SortableTh` cho mọi cột và `matchesSearch` tìm không dấu đa trường + phím tắt `/`, `Esc`, `Ctrl+K`. |

---

## 3. Chi Tiết Thay Đổi Theo Từng File

### 3.1. [Client/app/admin/_components/types.ts](file:///E:/travel_website-edu/Client/app/admin/_components/types.ts)
Định nghĩa toàn bộ kiểu dữ liệu chặt chẽ (không dùng `any`) khớp với cấu trúc trả về của `Server/src/features/admin/admin.service.ts`:
- `AdminTab`, `SortDirection`, `SortConfig<K>`, `PaymentStatusType`, `ToastNotice`.
- `DashboardStats`, `TourImageItem`, `TourDepartureItem`, `TourItem`, `HotelImageItem`, `HotelItem`, `PlaneItem`, `FlightItem`.
- `BookingServiceItem`, `PaymentRecordItem`, `BookingItem`, `UserItem`, `UserDetail`, `ReviewItem`.
- `RevenuePoint`, `TopBookedItemRecord`, `TopBookedItem`, `ResolvedItemMeta`.

### 3.2. [Client/app/admin/_components/utils.ts](file:///E:/travel_website-edu/Client/app/admin/_components/utils.ts)
Bao gồm 20 hàm tiện ích (đều có comment `// (Đã thêm)` theo quy tắc `.cursorrules`):
- **Tìm kiếm thông minh:**
  - `normalizeSearchText(value)`: Chuẩn hóa Unicode `NFD`, loại bỏ dấu thanh/dấu mũ tiếng Việt (`[\u0300-\u036f]`), chuyển `đ`/`Đ` thành `d`, lowercase và trim. Nhờ đó gõ `"da nang"` khớp `"Đà Nẵng"`, gõ `"nguyen"` khớp `"Nguyễn"`.
  - `matchesSearch(query, fields)`: Gộp nhiều trường dữ liệu (kể cả mảng như `amenities` hoặc danh sách dịch vụ) thành chuỗi tìm kiếm; hỗ trợ khớp nguyên cụm từ hoặc khớp tất cả các từ khóa rời (token-based).
- **Sắp xếp tổng quát:**
  - `sortItems(items, sortConfig, accessors)`: Nhận hàm trích xuất giá trị theo `sortKey`. Tự động đẩy giá trị rỗng (`null`, `undefined`, `''`) xuống cuối bất kể tăng hay giảm; so sánh số học cho `number`, chuyển đổi `0/1` cho `boolean`, và dùng `localeCompare('vi', { numeric: true, sensitivity: 'base' })` cho chuỗi tiếng Việt.
  - `toTimestamp(isoString)`: Chuyển ngày ISO thành timestamp để sort thời gian chính xác.
- **Định dạng & Nghiệp vụ:**
  - `formatCurrency`, `formatCompactCurrency` (`Tỷ`, `Tr`, `K`), `formatDate`, `formatShortDate`, `formatDurationBetween`, `getDurationMinutes`.
  - `getPaymentStatusMeta`, `getItemTypeLabel`, `getBookingPrimaryStatus`.
  - `getTourMinPrice`, `getTourTotalSeats`, `getNextDepartureDate`, `parseDestinationList`.
  - `buildItemLookupMap(tours, hotels, flights)`: Lập bảng ánh xạ `tour:<id>`, `tour:<departure_id>`, `hotel:<id>`, `flight:<id>` sang `{ title, subtitle, href }` để hiển thị tên dịch vụ thật trong bảng Đơn đặt chỗ, Đánh giá và Drawer chi tiết thay cho chuỗi UUID thô.
  - `exportToCsv(filename, headers, rows)`: Xuất file CSV có tiền tố BOM `\uFEFF` giúp Microsoft Excel mở đúng font tiếng Việt.
  - `getErrorMessage(err, fallback)`: Trích xuất thông báo lỗi an toàn cho `catch (err: unknown)`.

### 3.3. [Client/app/admin/_components/TableControls.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/TableControls.tsx)
Xây dựng bộ điều khiển bảng tái sử dụng đồng bộ cho toàn bộ trang Admin:
- `cycleSortConfig(current, key)`: Chuyển vòng trạng thái sort theo chu kỳ `null -> asc -> desc -> null`.
- `SortableTh`: Tiêu đề cột có nút bấm toàn chiều rộng, hiển thị icon 3 trạng thái (`ArrowUpDown` khi chưa sort, `ArrowUp` / `ArrowDown` nền vàng nổi bật khi đang sort), kèm tooltip mô tả thao tác tiếp theo.
- `SearchFilterToolbar`:
  - Thanh tìm kiếm lớn có icon kính lúp, nút `X` xóa nhanh, gợi ý phím tắt `/` và tự động lắng nghe phím `/` (khi không đang focus input khác) để nhảy vào ô tìm kiếm, phím `Esc` để xóa từ khóa.
  - Hàng **Quick Filter Chips** hiển thị số lượng bản ghi theo từng nhóm ngay dưới thanh tìm kiếm.
  - Bộ chọn nhanh **Sắp xếp mặc định / Tăng / Giảm** (`SlidersHorizontal`) đồng bộ với `SortableTh`, nút **Xuất CSV**, nút **Đặt lại** bộ lọc, bộ đếm `"Hiển thị X / Y mục"` và tag hiển thị cột đang sort (bấm `X` để bỏ sort nhanh).
- `PaginationBar`: Chọn số dòng hiển thị (`10 / 20 / 50 / 100 / Tất cả`), hiển thị dải dòng đang xem và điều hướng trang đầu/trước/số trang/sau/cuối.
- `PaymentStatusBadge`, `TrendingToggleButton`, `AvatarBadge`, `CopyIdButton` (bấm copy ID kèm phản hồi tick xanh), `EmptyTableRow`.

### 3.4. [Client/app/admin/_components/OverviewSection.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/OverviewSection.tsx)
- **Dải Cảnh báo vận hành hôm nay:** Tự động phát hiện và cho phép bấm để nhảy thẳng tới bộ lọc tương ứng cho: yêu cầu hoàn tiền (`refund_requested`), đơn chờ thanh toán (`pending`), tour sắp hết chỗ (`<= 5` chỗ), khách sạn ít phòng (`<= 3` phòng), chuyến bay ít ghế (`<= 10` ghế).
- **6 thẻ KPI mở rộng:** Hiển thị đồng thời tổng doanh thu thực thu + doanh thu chờ thu; tổng đơn + tỷ lệ đã thanh toán (thanh tiến trình); tổng tour + tour thịnh hành + số lịch khởi hành; tổng khách sạn + phòng trống + số resort hot; tổng chuyến bay + số máy bay + tổng ghế; tổng thành viên + số admin + số đánh giá & điểm sao trung bình.
- **2 thẻ điều hướng nhanh:** Chuyển thẳng sang tab **Đối soát thanh toán** và **Kiểm duyệt đánh giá**.
- **2 bảng hoạt động gần đây có Sort từng cột:**
  - *Đơn đặt chỗ mới nhất* (8 đơn gần nhất): sort theo `customer`, `items`, `amount`, `status`, `created_at`; bấm vào dòng để mở `BookingDetailDrawer`.
  - *Thành viên mới tham gia* (8 tài khoản gần nhất): sort theo `full_name`, `email`, `auth_provider`, `role`, `created_at`; bấm vào dòng để mở `UserDetailDrawer`.

### 3.5. [Client/app/admin/_components/RevenueSection.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/RevenueSection.tsx)
- **Bộ lọc thời gian & nhóm dữ liệu:** Preset `7 ngày`, `30 ngày`, `90 ngày`, `Năm nay` hoặc chọn tùy chỉnh `Từ ngày` – `Đến ngày` + `Nhóm dữ liệu theo` (`day` / `month` / `year`), gọi API `/api/v1/admin/dashboard/revenue` và `/api/v1/admin/dashboard/top-items`.
- **Biểu đồ cột tương tác:** Hiển thị doanh thu theo từng mốc thời gian với tooltip khi hover (hiển thị ngày, doanh thu và số giao dịch).
- **Phân tích dữ liệu thật:**
  - Tỷ trọng doanh thu theo 3 mảng dịch vụ (**Tour Du Lịch**, **Khách Sạn & Resort**, **Vé Máy Bay**) tính trực tiếp từ `booking_items` (ưu tiên các đơn đã thanh toán `paid`).
  - Thống kê theo **Cổng thanh toán** (`vietqr`, `momo`, `vnpay`, `bank_transfer`,...) và tổng số tiền Đã thu / Chờ thanh toán / Hoàn tiền.
- **2 bảng chi tiết có Sort từng cột:**
  - *Bảng số liệu theo kỳ*: sort theo `date`, `revenue`, `count`, `avg` + nút Xuất CSV.
  - *Top dịch vụ được đặt nhiều nhất*: lọc theo `Tất cả / Tour / KS / Bay`, sort theo `rank`, `title`, `type`, `totalBooked`.

### 3.6. [Client/app/admin/_components/DetailAndCrudModals.tsx](file:///E:/travel_website-edu/Client/app/admin/_components/DetailAndCrudModals.tsx)
Áp dụng kiến trúc tách component con theo `key` khi mở để khởi tạo state trực tiếp từ props, tránh gọi `setState` đồng bộ trong `useEffect`:
- `GlobalSearchModal` (`Ctrl+K`): Tìm kiếm tức thì (không dấu) xuyên suốt 5 nhóm (Đơn đặt chỗ, Tour, Khách sạn, Chuyến bay, Thành viên) và nhảy thẳng tới tab + mở Drawer chi tiết tương ứng.
- `BookingDetailDrawer`: Tải chi tiết từ `GET /api/v1/admin/bookings/:id`, hiển thị thông tin khách, danh sách dịch vụ đã giải mã tên thật qua `itemLookup`, thông tin `check_in`/`check_out`, các bản ghi thanh toán kèm nút đổi trạng thái nhanh (`paid`, `pending`, `refunded`, `failed`), link mở E-Voucher `/bookings/:id` và nút xóa đơn.
- `TourDetailDrawer`: Tải `GET /api/v1/admin/tours/:id`, hiển thị đầy đủ thông số tour (điểm đi/đến, phương tiện, thời điểm lý tưởng, ẩm thực, các điểm tham quan), form thêm/xóa **Lịch khởi hành** (`POST /tours/:id/departures`, `DELETE /tour-departures/:id`) và thêm/xóa **Thư viện ảnh** (`POST /tours/:id/images`, `DELETE /tour-images/:id`).
- `HotelDetailDrawer`: Tải `GET /api/v1/admin/hotels/:id`, hiển thị hạng sao, giá niêm yết/ưu đãi, địa chỉ, danh sách tiện ích và quản lý thêm/xóa **Thư viện ảnh** khách sạn.
- `UserDetailDrawer`: Tải `GET /api/v1/admin/users/:id`, hiển thị thông tin cá nhân, 10 đơn đặt chỗ gần nhất, 10 đánh giá gần nhất, nút phân quyền, chỉnh sửa hồ sơ và nút `onResetPassword`.
- **Các Modal CRUD & Hành động:** `TourFormModal`, `HotelFormModal`, `FlightFormModal`, `PlaneFormModal`, `UserFormModal`, `ResetUserPasswordModal`, `ConfirmActionModal`.

### 3.7. [Client/app/admin/page.tsx](file:///E:/travel_website-edu/Client/app/admin/page.tsx)
Quản lý trạng thái toàn trang và render đầy đủ các bảng dữ liệu với **mọi cột dữ liệu đều có Sort (`SortableTh`)**:

| Tab | Các cột hỗ trợ Sort (`SortableTh`) | Bộ lọc & Tiện ích tìm kiếm |
| :--- | :--- | :--- |
| **Đơn Đặt Chỗ (`bookings`)** | `id`, `customer`, `items`, `total_price`, `method`, `status`, `created_at` (7 cột) | Tìm không dấu theo ID, khách, email, SĐT, tên dịch vụ, mã GD, phương thức; chip trạng thái; dropdown phương thức TT; Xuất CSV |
| **Thanh Toán (`payments`)** | `transaction_id`, `booking_id`, `customer`, `method`, `amount`, `status`, `payment_date` (7 cột) | Tìm không dấu mã GD, mã đơn, khách, phương thức; chip trạng thái; đổi trạng thái trực tiếp trên dòng; Xuất CSV |
| **Tour Du Lịch (`tours`)** | `title`, `tour_type`, `route`, `duration`, `min_price`, `departures`, `seats`, `is_trending`, `created_at` (9 cột) | Tìm theo tên, điểm đi/đến, loại tour, phương tiện, thời lượng, ẩm thực; chip (`Thịnh hành`, `Sắp hết chỗ <=5`, `Chưa có lịch đi`); dropdown loại tour; Xuất CSV; Thêm/Sửa/Xóa/Lịch & Ảnh |
| **Khách Sạn (`hotels`)** | `name`, `city`, `star_rating`, `price`, `available_rooms`, `amenities`, `is_trending`, `created_at` (8 cột) | Tìm tên, thành phố, địa chỉ, tiện ích, mô tả; chip (`Thịnh hành`, `5 Sao`, `Có giảm giá`, `Ít phòng <=3`); dropdown thành phố; Xuất CSV; Thêm/Sửa/Xóa/Chi tiết & Ảnh |
| **Chuyến Bay (`flights`)** | `airline`, `route`, `departure_time`, `arrival_time`, `duration`, `ticket_price`, `available_seats` (7 cột) | Tìm sân bay đi/đến, hãng, số hiệu tàu bay; chip (`Sắp hết ghế <=10`, `Còn nhiều ghế >30`); dropdown hãng bay; Xuất CSV; Thêm/Sửa/Xóa |
| **Đội Tàu Bay (`flights` -> `planes`)** | `airline`, `plane_number`, `total_seats`, `flights_count` (4 cột) | Tìm hãng bay, số hiệu, tổng ghế; Thêm/Sửa/Xóa tàu bay |
| **Thành Viên (`users`)** | `full_name`, `email`, `auth_provider`, `bookings_count`, `reviews_count`, `role`, `created_at` (7 cột) | Tìm tên, email, SĐT, vai trò, nguồn ĐN; chip (`Quản trị viên`, `Khách hàng`, `Google OAuth`, `Đã từng đặt`); Xuất CSV; Hồ sơ/Sửa/Reset mật khẩu/Đổi role/Xóa |
| **Đánh Giá (`reviews`)** | `user`, `item_type`, `item_name`, `rating`, `comment`, `created_at` (6 cột) | Tìm người đánh giá, bình luận, tên dịch vụ; chip (`5 Sao`, `<= 3 Sao`, `Tour`, `Khách sạn`, `Chuyến bay`); Xuất CSV; Xóa đánh giá |

---

## 4. Các Endpoint API Backend Được Kết Nối

Trang Admin sử dụng đầy đủ các endpoint quản trị từ `Server/src/features/admin/admin.route.ts` (đính kèm JWT Bearer token):
- **Xác thực phiên Admin:** `GET /api/v1/users/profile`
- **Dashboard & Báo cáo:** `GET /api/v1/admin/dashboard/stats`, `GET /api/v1/admin/dashboard/revenue`, `GET /api/v1/admin/dashboard/top-items`
- **Đơn đặt chỗ & Thanh toán:** `GET /api/v1/admin/bookings`, `GET /api/v1/admin/bookings/:id`, `DELETE /api/v1/admin/bookings/:id`, `GET /api/v1/admin/payments`, `PATCH /api/v1/admin/payments/:id/status`
- **Tour, Lịch khởi hành & Ảnh:** `GET /api/v1/admin/tours`, `GET /api/v1/admin/tours/:id`, `POST /api/v1/admin/tours`, `PUT /api/v1/admin/tours/:id`, `DELETE /api/v1/admin/tours/:id`, `PATCH /api/v1/admin/tours/:id/trending`, `POST /api/v1/admin/tours/:tourId/departures`, `DELETE /api/v1/admin/tour-departures/:departureId`, `POST /api/v1/admin/tours/:tourId/images`, `DELETE /api/v1/admin/tour-images/:imageId`
- **Khách sạn & Ảnh:** `GET /api/v1/admin/hotels`, `GET /api/v1/admin/hotels/:id`, `POST /api/v1/admin/hotels`, `PUT /api/v1/admin/hotels/:id`, `DELETE /api/v1/admin/hotels/:id`, `PATCH /api/v1/admin/hotels/:id/trending`, `POST /api/v1/admin/hotels/:hotelId/images`, `DELETE /api/v1/admin/hotel-images/:imageId`
- **Máy bay & Chuyến bay:** `GET /api/v1/admin/planes`, `POST /api/v1/admin/planes`, `PUT /api/v1/admin/planes/:id`, `DELETE /api/v1/admin/planes/:id`, `GET /api/v1/admin/flights`, `POST /api/v1/admin/flights`, `PUT /api/v1/admin/flights/:id`, `DELETE /api/v1/admin/flights/:id`
- **Người dùng & Đánh giá:** `GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id`, `POST /api/v1/admin/users`, `PUT /api/v1/admin/users/:id`, `PATCH /api/v1/admin/users/:id/role`, `POST /api/v1/admin/users/:id/reset-password`, `DELETE /api/v1/admin/users/:id`, `GET /api/v1/admin/reviews`, `DELETE /api/v1/admin/reviews/:userId/:itemType/:itemId`

---

## 5. Kết Quả Kiểm Tra & Xác Minh

| Hạng mục kiểm tra | Lệnh thực hiện | Kết quả |
| :--- | :--- | :--- |
| Sinh route types Next.js | `npx next typegen` (trong `Client/`) | Thành công (`exit code 0`) |
| Kiểm tra kiểu TypeScript | `npx tsc --noEmit` (trong `Client/`) | Thành công (`exit code 0`, 0 lỗi) |
| Kiểm tra ESLint phạm vi Admin | `npx eslint app/admin` (trong `Client/`) | Thành công (`exit code 0`, 0 lỗi, 0 cảnh báo) |
| Kiểm tra comment `(Đã thêm)` trên hàm mới | `Select-String` kiểm tra các hàm trong `Client/app/admin/**` | Đầy đủ `// (Đã thêm)` đầu mỗi hàm |
| Unit/Logic test cho tìm kiếm, sắp xếp, trạng thái & lookup | `Server/node_modules/.bin/tsx .../test_admin_utils.ts` | Thành công (`ALL ADMIN UTILS LOGIC TESTS PASSED!`, `exit code 0`) |
| Production build trong sandbox offline | `npm run build` (trong `Client/`) | Lỗi `next/font/google` (`Roboto`, `Geist Mono`) không kết nối được `fonts.googleapis.com` do môi trường sandbox không có mạng |

> **Khuyến nghị chạy thực tế:** Chạy `npm run build` (hoặc `npm run dev`) tại `Client/` trên máy có kết nối Internet để Next.js tải Google Fonts và kiểm thử giao diện trực tiếp cùng Backend Server.
