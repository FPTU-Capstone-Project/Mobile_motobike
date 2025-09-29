# SEP491 - Development Guide

## 🚀 Quick Start với Bash Script

### Cài đặt và chạy
```bash
# Cấp quyền thực thi cho script (Linux/macOS)
chmod +x start-dev.sh

# Chạy script tự động (khởi động tất cả)
./start-dev.sh --auto

# Hoặc chạy interactive mode
./start-dev.sh
```

### Các tùy chọn trong script

1. **Start Full Stack** - Khởi động cả Backend + Frontend
2. **Start Backend Only** - Chỉ khởi động Backend (port 3000)
3. **Start Frontend Only** - Chỉ khởi động Expo (port 8081)
4. **Kill All Dev Servers** - Dừng tất cả server đang chạy
5. **Install Dependencies** - Cài đặt dependencies cho cả frontend và backend
6. **Clear Cache & Restart** - Xóa cache và cài đặt lại
7. **Exit** - Thoát script

### Ports được sử dụng
- **3000**: Backend API Server
- **8081**: Expo Metro Bundler
- **19000**: Expo DevTools
- **19001**: Expo Tunnel
- **19002**: Expo LAN

## 📱 Chức năng GPS và Phone Call

### GPS Location Service
```javascript
import LocationService from '../services/LocationService';

// Yêu cầu quyền GPS
const permissions = await LocationService.requestLocationPermission();

// Lấy vị trí hiện tại
const location = await LocationService.getCurrentLocation();

// Theo dõi vị trí liên tục (cho tài xế)
await LocationService.startLocationTracking((location) => {
  console.log('New location:', location);
});

// Dừng theo dõi
LocationService.stopLocationTracking();
```

### Phone Service
```javascript
import PhoneService from '../services/PhoneService';

// Gọi điện với xác nhận
await PhoneService.makePhoneCall('0987654321', 'Tài xế ABC');

// Gọi khẩn cấp (không cần xác nhận)
await PhoneService.makeEmergencyCall('113');

// Gửi SMS
await PhoneService.sendSMS('0987654321', 'Tin nhắn', 'Tài xế ABC');

// Lấy danh bạ từ điện thoại
const contacts = await PhoneService.getContacts();
```

### Components có sẵn

#### DriverContactCard
```jsx
<DriverContactCard
  driver={driverData}
  onCallPress={(driver) => console.log('Called:', driver.name)}
  onMessagePress={(driver) => console.log('Messaged:', driver.name)}
  onLocationPress={(location) => console.log('Location:', location)}
  showLocation={true}
  showMessage={true}
/>
```

#### LocationTracker
```jsx
<LocationTracker
  showMap={true}
  trackingEnabled={true}
  onLocationUpdate={(location) => console.log('Location updated:', location)}
  initialLocation={{ latitude: 10.7769, longitude: 106.7009 }}
/>
```

## 🔑 Permissions cần thiết

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

### iOS (ios/YourApp/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Ứng dụng cần truy cập vị trí để hiển thị tài xế gần bạn</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Ứng dụng cần truy cập vị trí để theo dõi chuyến đi</string>
<key>NSContactsUsageDescription</key>
<string>Ứng dụng cần truy cập danh bạ để gọi điện cho tài xế</string>
```

## 🎯 Cách sử dụng trong ứng dụng

### Đăng nhập
- **Tài khoản sinh viên**: `student@university.edu.vn` / `123456`
- **Tài khoản tài xế**: `driver@university.edu.vn` / `123456`

### Tính năng cho Tài xế
1. **Dashboard**: Thống kê thu nhập, đánh giá
2. **Thu nhập**: Biểu đồ và chi tiết thu nhập
3. **Đánh giá**: Xem rating và feedback từ khách hàng
4. **SOS Alert**: Cảnh báo khẩn cấp với 5 loại tình huống
5. **GPS Tracking**: Theo dõi vị trí liên tục
6. **Profile**: Quản lý thông tin cá nhân và xe

### Tính năng cho Khách hàng
1. **Đặt xe**: Tìm và đặt chuyến đi
2. **Theo dõi**: Xem vị trí tài xế real-time
3. **Liên lạc**: Gọi điện/nhắn tin cho tài xế
4. **Thanh toán**: Ví điện tử và tiền mặt
5. **Lịch sử**: Xem các chuyến đi đã thực hiện

## 🛠️ Troubleshooting

### Lỗi thường gặp
1. **Metro bundler không start**: Chạy `npx expo start --clear`
2. **Lỗi permissions**: Kiểm tra AndroidManifest.xml và Info.plist
3. **Maps không hiển thị**: Cần Google Maps API key
4. **GPS không hoạt động**: Bật location services trên thiết bị

### Reset hoàn toàn
```bash
# Xóa node_modules và reinstall
rm -rf node_modules
npm install

# Clear Expo cache
npx expo r -c

# Hoặc sử dụng script
./start-dev.sh
# Chọn option 6: Clear Cache & Restart
```

## 📦 Dependencies chính
- **expo-location**: GPS và location services
- **expo-contacts**: Truy cập danh bạ điện thoại
- **react-native-maps**: Hiển thị bản đồ
- **@react-native-async-storage/async-storage**: Lưu trữ local
- **react-native-vector-icons**: Icons

## 🌟 Tính năng nổi bật

### SOS Alert System
- 5 loại tình huống khẩn cấp
- Đếm ngược 10 giây
- Hiệu ứng rung và thị giác
- Tự động gọi số khẩn cấp

### Real-time Location
- Theo dõi vị trí liên tục
- Hiển thị trên bản đồ
- Tính khoảng cách chính xác
- Lưu cache vị trí

### Smart Phone Integration
- Gọi điện trực tiếp
- Gửi SMS tự động
- Tìm kiếm trong danh bạ
- Format số điện thoại Việt Nam

---

*Được phát triển cho dự án SEP491 - Hệ thống chia sẻ xe máy cho sinh viên*
