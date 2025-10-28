# Hướng dẫn Test Ride Matching Flow

## Tổng quan

Flow test này sẽ mô phỏng quá trình:
1. **Driver** tạo shared ride
2. **Rider** book chuyến đi 
3. **Backend** matching và gửi offer cho driver
4. **Driver** accept offer
5. **Rider** nhận thông báo chấp nhận

---

## Bước 1: Chuẩn bị

### 1.1. Tài khoản test
- **Driver account**: `driver1@example.com` / `password123`
- **Rider account**: `rider1@example.com` / `password123`

### 1.2. Kiểm tra backend
- Backend đang chạy tại: `http://192.168.2.15:8080`
- WebSocket endpoint: `/ws-native`

---

## Bước 2: Driver tạo Shared Ride

### 2.1. Đăng nhập Driver
1. Mở app, đăng nhập với tài khoản driver
2. Từ HomeScreen → bấm "Chế độ tài xế"
3. Vào `DriverHomeScreen`

### 2.2. Tạo chuyến chia sẻ
1. Bấm nút **"+"** (add-circle icon) ở header
2. Điền thông tin:
   - **Điểm đi**: Chọn từ danh sách POI (ví dụ: "Đại học FPT")
   - **Điểm đến**: Chọn điểm khác (ví dụ: "Vincom Center")
   - **Thời gian**: Chọn thời gian trong tương lai (ít nhất 30 phút)
   - **Số hành khách**: 1
   - **Giá cơ bản**: 20000 VNĐ
   - **Giá/km**: 3500 VNĐ
   - **Khoảng cách**: 5.2 km
   - **Thời gian**: 15 phút

3. Bấm **"Tạo chuyến đi"**

### 2.3. Kiểm tra logs
```
LOG  Creating shared ride with data: {
  "vehicleId": 1,
  "startLocationId": 10,
  "endLocationId": 11,
  "scheduledTime": "2025-10-17T08:30:00.000Z",
  "maxPassengers": 1,
  "baseFare": 20000,
  "perKmRate": 3500,
  "estimatedDistance": 5.2,
  "estimatedDuration": 15
}
LOG  API Request: POST http://192.168.2.15:8080/api/v1/rides
LOG  Shared ride created successfully: { sharedRideId: 300, status: "SCHEDULED", ... }
```

### 2.4. Bật trạng thái Online
1. Quay lại `DriverHomeScreen`
2. Bật switch **"Sẵn sàng nhận chuyến"**
3. Kiểm tra UI chuyển thành màu xanh "Đã kết nối"

### 2.5. Kiểm tra WebSocket logs
```
LOG  🟢 Going online - connecting WebSocket...
LOG  🔄 WebSocket attempt 1/1: ws://192.168.2.15:8080/ws-native?token=...
LOG  ✅ WebSocket connected successfully
LOG  📡 Subscribing to: /user/queue/ride-offers
LOG  📡 Subscribing to: /user/queue/notifications
LOG  ✅ Driver connected and subscribed to all queues
```

---

## Bước 3: Rider Book chuyến đi

### 3.1. Đăng nhập Rider (thiết bị khác hoặc simulator khác)
1. Đăng nhập với tài khoản rider
2. Từ HomeScreen → bấm **"Đặt xe ngay"**

### 3.2. Tạo quote
1. Chọn **điểm đón** gần với điểm đi của shared ride
2. Chọn **điểm đến** gần với điểm đến của shared ride
3. Bấm **"Xem giá cước"**
4. Bấm **"Đặt xe ngay"**

### 3.3. Kiểm tra logs
```
LOG  API Request: POST http://192.168.2.15:8080/api/v1/ride-requests
LOG  Ride request created: { shared_ride_request_id: 123, status: "PENDING", ... }
LOG  🔄 WebSocket attempt 1/1: ws://192.168.2.15:8080/ws-native?token=...
LOG  ✅ Rider connected and subscribed to all queues
LOG  📡 Subscribing to: /user/queue/ride-matching
```

### 3.4. Chuyển sang RiderMatchingScreen
- App tự động chuyển sang màn hình "Tìm tài xế"
- Hiển thị spinner và "Đang tìm tài xế phù hợp..."

---

## Bước 4: Backend Matching (tự động)

### 4.1. Backend sẽ tự động:
1. Tìm shared rides phù hợp với ride request
2. Chọn shared ride của driver làm candidate
3. Gửi offer tới driver qua WebSocket

### 4.2. Driver nhận offer
```
LOG  Processing ride offer: {
  "type": "RIDE_OFFER",
  "requestId": 123,
  "rideId": 300,
  "pickupLocation": "...",
  "dropoffLocation": "...",
  "fare": 25000,
  "offerExpiresAt": "2025-10-17T07:32:30.000Z",
  "riderInfo": { ... }
}
```

### 4.3. RideOfferModal hiển thị
- Modal popup với thông tin chuyến đi
- Countdown timer (90 giây)
- Nút "Chấp nhận" và "Từ chối"

---

## Bước 5: Driver Accept Offer

### 5.1. Driver bấm "Chấp nhận"
```
LOG  Accepting ride offer: requestId=123, rideId=300
LOG  API Request: POST http://192.168.2.15:8080/api/v1/ride-requests/123/accept
LOG  Accept ride request successful
```

### 5.2. Rider nhận thông báo
```
LOG  Rider matching update received: {
  "status": "ACCEPTED",
  "driverId": 50,
  "driverName": "Nguyễn Văn A",
  "vehiclePlate": "59H1-12345",
  "vehicleModel": "Honda Wave",
  "driverRating": 4.8,
  "estimatedPickupTime": "2025-10-17T08:00:00.000Z"
}
```

### 5.3. UI Updates
- **Rider**: Alert "Chuyến đi đã được chấp nhận!" → chuyển sang RideTrackingScreen
- **Driver**: Alert "Bạn đã chấp nhận chuyến đi!" → có thể chuyển sang RideTrackingScreen

---

## Bước 6: Tracking Start (Optional)

### 6.1. Backend gửi TRACKING_START signal
```
LOG  Tracking start signal received: {
  "type": "TRACKING_START",
  "rideId": 300
}
```

### 6.2. Driver bắt đầu GPS tracking
```
LOG  Location tracking started for ride 300
LOG  Background location update: { latitude: ..., longitude: ... }
LOG  Sending 5 location points for ride 300
```

---

## Troubleshooting

### Lỗi thường gặp:

1. **WebSocket không kết nối**
   - Kiểm tra backend đang chạy
   - Kiểm tra JWT token hợp lệ
   - Thử restart app

2. **Không nhận được offer**
   - Kiểm tra driver đã online chưa
   - Kiểm tra shared ride đã tạo thành công chưa
   - Kiểm tra thời gian và địa điểm có match không

3. **Accept offer thất bại**
   - Kiểm tra offer chưa hết hạn
   - Kiểm tra wallet balance đủ không
   - Kiểm tra shared ride còn chỗ trống

4. **iOS version mismatch**
   - Chạy `npx expo install --fix`
   - Chạy `npx expo run:ios --clear`

### Debug commands:
```bash
# Clear cache và rebuild
npx expo install --fix
npx expo run:ios --clear

# Check logs
npx react-native log-ios
npx react-native log-android
```

---

## Expected Flow Summary

```
Driver: Login → Create Shared Ride → Go Online → Wait for Offer
                                                      ↓
Backend: Match Request → Send Offer to Driver → Wait for Response
                                                      ↓
Driver: Receive Offer → Accept → Start Tracking
                           ↓
Rider: Login → Book Ride → Wait for Match → Receive Acceptance → Start Tracking
```

**Thời gian test**: ~5-10 phút
**Thiết bị cần**: 2 thiết bị hoặc 1 thiết bị + 1 simulator
