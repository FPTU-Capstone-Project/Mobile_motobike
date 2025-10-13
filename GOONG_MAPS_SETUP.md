# 🗺️ Hướng dẫn Setup Goong Maps API

## 📋 Tổng quan

Goong Maps là giải pháp bản đồ Việt Nam **MIỄN PHÍ** thay thế cho Google Maps. Không cần thẻ tín dụng để sử dụng!

## 🚀 Bước 1: Đăng ký tài khoản Goong

1. Truy cập: https://account.goong.io/
2. Đăng ký tài khoản miễn phí
3. Xác thực email
4. Tạo API key mới

## 🔑 Bước 2: Lấy API Key

1. Đăng nhập vào https://account.goong.io/
2. Vào mục **"API Keys"**
3. Click **"Create new key"**
4. Đặt tên cho key (ví dụ: "MSSUS Mobile App")
5. Copy API key

## ⚙️ Bước 3: Cấu hình trong ứng dụng

Mở file `src/services/goongService.js` và thay thế:

```javascript
// Thay thế dòng này:
this.apiKey = 'YOUR_GOONG_API_KEY';

// Bằng API key thực của bạn:
this.apiKey = 'your-actual-goong-api-key-here';
```

## 📦 Bước 4: Cài đặt dependencies

```bash
npm install react-native-webview
# hoặc
yarn add react-native-webview
```

## 🎯 Bước 5: Test ứng dụng

1. Khởi động ứng dụng:
```bash
npm start
# hoặc
yarn start
```

2. Mở ứng dụng trên thiết bị/emulator
3. Vào màn hình "Đặt xe" để test bản đồ

## ✨ Tính năng đã tích hợp

### 🗺️ GoongMap Component
- Hiển thị bản đồ Việt Nam
- Đánh dấu vị trí (markers)
- Click để chọn vị trí
- Zoom và pan
- Hiển thị vị trí hiện tại

### 🛣️ Goong Service
- **Directions API**: Tính đường đi giữa 2 điểm
- **Places API**: Tìm kiếm địa điểm
- **Geocoding API**: Chuyển đổi tọa độ ↔ địa chỉ
- **Distance Matrix**: Tính khoảng cách nhiều điểm

## 🔧 Cách sử dụng

### Hiển thị bản đồ cơ bản:
```jsx
import GoongMap from '../components/GoongMap';

<GoongMap
  initialRegion={{
    latitude: 10.8231,
    longitude: 106.6297,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
  showsUserLocation={true}
  onMapPress={(event) => {
    console.log('Clicked:', event.nativeEvent.coordinate);
  }}
/>
```

### Thêm markers:
```jsx
<GoongMap
  markers={[
    {
      coordinate: { latitude: 10.8231, longitude: 106.6297 },
      title: "Điểm đón",
      description: "Vị trí đón khách",
      pinColor: "#4CAF50"
    }
  ]}
/>
```

### Sử dụng Goong Service:
```javascript
import goongService from '../services/goongService';

// Tìm đường đi
const route = await goongService.getDirections(
  { latitude: 10.8231, longitude: 106.6297 },
  { latitude: 10.7769, longitude: 106.7009 }
);

// Tìm kiếm địa điểm
const places = await goongService.searchPlaces('Bến Thành Market');

// Chuyển tọa độ thành địa chỉ
const address = await goongService.reverseGeocode(10.8231, 106.6297);
```

## 🎨 Tùy chỉnh giao diện

### Thay đổi màu marker:
```jsx
markers={[
  {
    coordinate: { latitude: 10.8231, longitude: 106.6297 },
    pinColor: "#FF0000" // Đỏ
  }
]}
```

### Thêm polyline (đường đi):
```jsx
<GoongMap
  polyline={[
    { latitude: 10.8231, longitude: 106.6297 },
    { latitude: 10.7769, longitude: 106.7009 }
  ]}
/>
```

## 🚨 Xử lý lỗi

### Lỗi: "Vui lòng cấu hình Goong API key"
- Kiểm tra API key trong `goongService.js`
- Đảm bảo API key không phải `'YOUR_GOONG_API_KEY'`

### Lỗi: WebView không load
- Kiểm tra kết nối internet
- Đảm bảo API key hợp lệ
- Restart ứng dụng

### Lỗi: Không hiển thị bản đồ
- Kiểm tra permissions location
- Kiểm tra WebView permissions
- Xem console logs để debug

## 📊 Giới hạn API (Free tier)

- **25,000 requests/tháng** cho mỗi API
- **Unlimited** cho Static Maps
- **Không giới hạn** số lượng markers

## 🔄 Migration từ Google Maps

Đã được thực hiện tự động:
- ✅ Thay thế `MapView` → `GoongMap`
- ✅ Thay thế `Marker` → `markers` prop
- ✅ Cập nhật tất cả screens sử dụng maps
- ✅ Loại bỏ Google Maps dependencies

## 🆘 Hỗ trợ

- **Goong Documentation**: https://docs.goong.io/
- **API Reference**: https://docs.goong.io/rest/
- **Support**: support@goong.io

## 🎉 Hoàn thành!

Bây giờ ứng dụng của bạn đã sử dụng Goong Maps - một giải pháp bản đồ Việt Nam miễn phí, không cần thẻ tín dụng!

### Các màn hình đã được cập nhật:
- ✅ `RideBookingScreen` - Đặt xe với bản đồ
- ✅ `RideTrackingScreen` - Theo dõi chuyến xe
- ✅ `HomeScreen` - Tích hợp với location service

### Các service mới:
- ✅ `goongService.js` - API calls
- ✅ `GoongMap.jsx` - Map component
- ✅ Tích hợp với `locationService.js`
