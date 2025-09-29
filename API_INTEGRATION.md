# API Integration Guide

## Tổng quan

Ứng dụng đã được cập nhật để sử dụng API thực từ backend Spring Boot thay vì mock data.

## Cấu hình API

### 1. Backend Setup
Trước khi chạy mobile app, cần khởi động backend:

```bash
cd BE/MotorbikeSharingSystem_BE
./dev.sh
```

Backend sẽ chạy tại: `http://localhost:8081`

### 2. API Configuration
File cấu hình API: `src/config/api.js`

```javascript
export const API_CONFIG = {
  DEV: {
    BASE_URL: 'http://localhost:8081/api/v1',
    TIMEOUT: 10000,
  },
  // Tự động chọn environment dựa trên __DEV__
}
```

## Các Service đã tích hợp

### 1. AuthService (`src/services/authService.js`)

#### Chức năng:
- ✅ **Login** - Đăng nhập với email/phone và password
- ✅ **Register** - Đăng ký tài khoản mới  
- ✅ **Logout** - Đăng xuất và xóa token
- ✅ **Get Profile** - Lấy thông tin hồ sơ người dùng
- ✅ **Update Profile** - Cập nhật thông tin cá nhân
- ✅ **Update Password** - Đổi mật khẩu
- ✅ **Switch Profile** - Chuyển đổi giữa rider/driver
- ✅ **File Upload** - Upload avatar, documents

#### API Endpoints:
```
POST /api/v1/auth/login
POST /api/v1/auth/register  
POST /api/v1/auth/logout
GET  /api/v1/users/me
PUT  /api/v1/users/me
PUT  /api/v1/users/me/update-password
POST /api/v1/users/me/switch-profile
```

### 2. ApiService (`src/services/api.js`)

#### Chức năng:
- ✅ **HTTP Methods** - GET, POST, PUT, DELETE
- ✅ **Authentication** - Tự động thêm Bearer token
- ✅ **Error Handling** - Custom ApiError class
- ✅ **File Upload** - Multipart form data support
- ✅ **Token Management** - Lưu/đọc token từ AsyncStorage

## Màn hình đã cập nhật

### 1. LoginScreen
- ✅ Tích hợp API login
- ✅ Loading state khi đang đăng nhập
- ✅ Error handling với thông báo chi tiết
- ✅ Auto navigation dựa trên user type (rider/driver)

### 2. ProfileScreen  
- ✅ Load user profile từ API
- ✅ Hiển thị loading state
- ✅ Error state với nút retry
- ✅ Hiển thị thông tin từ API response:
  - User info (name, email, student_id)
  - Stats (rides, wallet balance, rating)
  - Verification status

### 3. App.jsx
- ✅ Check authentication khi khởi động
- ✅ Auto login nếu có token hợp lệ
- ✅ Loading screen khi initialize

## Cấu trúc dữ liệu API

### User Profile Response:
```json
{
  "user": {
    "user_id": 1,
    "user_type": "rider",
    "email": "student@university.edu.vn",
    "phone": "0987654321",
    "full_name": "Nguyen Van A",
    "student_id": "SE123456",
    "profile_photo_url": "https://...",
    "is_active": true,
    "email_verified": true,
    "phone_verified": true
  },
  "rider_profile": {
    "emergency_contact": "0987654320",
    "rating_avg": 4.5,
    "total_rides": 15,
    "total_spent": 450000,
    "preferred_payment_method": "wallet"
  },
  "driver_profile": {
    "license_number": "B2-123456",
    "status": "active",
    "rating_avg": 4.8,
    "total_shared_rides": 150,
    "total_earned": 2500000,
    "commission_rate": 0.15,
    "is_available": true,
    "max_passengers": 1
  },
  "wallet": {
    "wallet_id": 1,
    "cached_balance": 150000,
    "pending_balance": 0,
    "is_active": true
  }
}
```

## Error Handling

### ApiError Class:
```javascript
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;  // HTTP status code
    this.data = data;      // Response data
  }
}
```

### Error Status Codes:
- `401` - Unauthorized (sai email/password)
- `400` - Bad Request (validation error)
- `409` - Conflict (email đã tồn tại)
- `0` - Network error (không kết nối được server)

## Demo Credentials

Khi backend chưa sẵn sàng, có thể test với:

```javascript
// Student account
Email: student@university.edu.vn
Password: 123456

// Driver account  
Email: driver@university.edu.vn
Password: 123456
```

## Chạy ứng dụng

### 1. Khởi động Backend:
```bash
cd BE/MotorbikeSharingSystem_BE
./dev.sh
```

### 2. Khởi động Mobile App:
```bash
npm start
# hoặc
npx expo start
```

### 3. Test API Connection:
- Mở browser: `http://localhost:8081/swagger-ui.html`
- Kiểm tra API documentation và test endpoints

## Troubleshooting

### 1. Không kết nối được API:
- Kiểm tra backend đã chạy chưa
- Kiểm tra URL trong `src/config/api.js`
- Kiểm tra firewall/network

### 2. Login thất bại:
- Kiểm tra database có user chưa
- Xem backend logs: `docker logs motorbike-dev-app -f`
- Kiểm tra API response trong network tab

### 3. Token expired:
- Hiện tại chưa có auto refresh token
- User sẽ cần đăng nhập lại

## Roadmap

### Các API chưa tích hợp:
- [ ] Ride booking/sharing
- [ ] Real-time location tracking  
- [ ] Payment/wallet transactions
- [ ] Push notifications
- [ ] File upload (avatar, documents)
- [ ] Admin features

### Improvements cần làm:
- [ ] Auto refresh token
- [ ] Offline mode support
- [ ] Better error messages
- [ ] Loading states cho tất cả screens
- [ ] Pull-to-refresh functionality

