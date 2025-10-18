# 🚀 WebSocket Integration Guide - Driver & Rider

## 📋 **Tổng quan**

Hệ thống WebSocket cho phép real-time communication giữa:
- **Rider**: Nhận cập nhật matching status khi đặt xe
- **Driver**: Nhận ride offers và notifications
- **Backend**: Gửi real-time updates qua STOMP protocol

---

## 🔧 **Backend Endpoints**

### **WebSocket Endpoints:**
- **SockJS (Web)**: `http://localhost:8080/ws?token=JWT_TOKEN`
- **Native (React Native)**: `ws://localhost:8080/ws-native?token=JWT_TOKEN`

### **STOMP Queues:**
- **Driver Offers**: `/user/queue/ride-offers`
- **Rider Matching**: `/user/queue/ride-matching`  
- **Notifications**: `/user/queue/notifications`

---

## 👨‍💼 **Driver Flow**

### **1. Kết nối WebSocket**
```javascript
// DriverHomeScreen.jsx
await websocketService.connectAsDriver(
  handleRideOffer,      // Callback cho ride offers
  handleNotification    // Callback cho notifications
);
```

### **2. Nhận Ride Offers**
```javascript
const handleRideOffer = (offer) => {
  console.log('Received offer:', offer);
  // Hiển thị modal với thông tin:
  // - Rider info
  // - Pickup/dropoff locations  
  // - Fare amount
  // - Countdown timer
};
```

### **3. Accept/Reject Offer**
```javascript
// Accept offer
await rideService.acceptRideRequest(requestId, rideId);

// Reject offer  
await rideService.rejectRideRequest(requestId, reason);
```

### **4. Cách test Driver:**

#### **Bước 1**: Mở DriverHomeScreen
```
Home → Chế độ tài xế
```

#### **Bước 2**: Bật chế độ online
```
Toggle "Sẵn sàng nhận chuyến" → ON
```

#### **Bước 3**: Kiểm tra connection
```
Status: "Đã kết nối" (màu xanh)
Logs: "✅ Driver connected and subscribed to all queues"
```

#### **Bước 4**: Test với backend demo
```html
<!-- Mở driver.html trong browser -->
<script>
const JWT = "YOUR_DRIVER_JWT_TOKEN";
// Click "Connect WS" → "Accept Current Offer"
</script>
```

---

## 👨‍💻 **Rider Flow**

### **1. Đặt xe**
```javascript
// RideBookingScreen.jsx
const result = await rideService.bookRide(quoteId);

// Navigate to matching screen
navigation.navigate('RiderMatching', {
  rideRequest: { ...result, quote, pickupAddress, dropoffAddress }
});
```

### **2. Kết nối WebSocket**
```javascript
// RiderMatchingScreen.jsx
await websocketService.connectAsRider(
  handleRideMatching,   // Callback cho matching updates
  handleNotification    // Callback cho notifications
);
```

### **3. Nhận Matching Updates**
```javascript
const handleRideMatching = (matchingData) => {
  switch (matchingData.type) {
    case 'DRIVER_MATCHED':
      setMatchingStatus('matched');
      break;
    case 'RIDE_ACCEPTED':
      setMatchingStatus('accepted');
      // Navigate to RideTracking
      break;
    case 'RIDE_REJECTED':
      setMatchingStatus('searching');
      break;
    case 'NO_DRIVERS_AVAILABLE':
      setMatchingStatus('cancelled');
      break;
  }
};
```

### **4. Cách test Rider:**

#### **Bước 1**: Đặt xe
```
Home → Đặt xe ngay → Chọn điểm đón/đến → Xem giá cước → Đặt xe
```

#### **Bước 2**: Theo dõi matching
```
RiderMatchingScreen hiển thị:
- Status: "Đang tìm tài xế..."
- Thông tin chuyến đi
- Real-time notifications
```

#### **Bước 3**: Test với backend demo
```html
<!-- Mở rider.html trong browser -->
<script>
const JWT = "YOUR_RIDER_JWT_TOKEN";
// Click "Connect WS" → "Create AI Booking"
</script>
```

---

## 🔄 **Complete Test Scenario**

### **Scenario 1: Successful Ride Matching**

#### **Setup:**
1. **Driver**: Login → DriverHome → Toggle ON
2. **Rider**: Login → Book ride → Wait for matching

#### **Flow:**
```
1. Rider books ride → Backend creates ride request
2. Backend sends offer to available drivers
3. Driver receives offer → Accepts
4. Rider receives "RIDE_ACCEPTED" → Navigate to tracking
5. Both parties connected for ride tracking
```

#### **Expected Logs:**
```
// Driver
LOG  📨 Received driver offer: {requestId: "123", rideId: 456}
LOG  ✅ Ride request accepted successfully

// Rider  
LOG  📨 Received rider matching update: {type: "DRIVER_MATCHED"}
LOG  📨 Received rider matching update: {type: "RIDE_ACCEPTED"}
```

### **Scenario 2: Driver Rejection**

#### **Flow:**
```
1. Driver receives offer → Rejects
2. Backend finds next available driver
3. Rider stays in "searching" state
4. Process repeats until match found
```

---

## 🛠️ **Debugging**

### **WebSocket Connection Issues:**

#### **Check Endpoint:**
```javascript
// Current endpoint
ws://192.168.2.15:8080/ws-native?token=JWT_TOKEN

// Backend logs should show:
DEBUG WebSocketHandlerMapping : Mapped to WebSocketHandler
DEBUG JwtHandshakeInterceptor : Valid token found in WS handshake
```

#### **Check Token:**
```javascript
// Token format
eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl92ZXJzaW9uIjox...

// Should include:
- sub: user email
- active_profile: "driver" or "rider"  
- profiles: ["DRIVER", "RIDER"]
```

### **Common Issues:**

#### **1. "No valid token found"**
```
Solution: Check JWT token format and expiration
```

#### **2. "Expected HTTP 101 response but was '200'"**
```
Solution: Wrong endpoint or authentication failed
```

#### **3. "WebSocket not connected"**
```
Solution: Call connect() before subscribing to queues
```

### **Debug Tools:**

#### **WebSocket Test Panel:**
```
DriverTestScreen → WebSocket Test Panel
- Connect/Disconnect buttons
- Send test messages
- View connection logs
```

#### **Browser Demo:**
```
Open driver.html or rider.html in browser
Test WebSocket connection with real backend
```

---

## 📱 **Production Considerations**

### **1. Error Handling:**
```javascript
// Graceful fallback when WebSocket fails
try {
  await websocketService.connect();
} catch (error) {
  // Continue without real-time updates
  // Use polling as fallback
}
```

### **2. Reconnection:**
```javascript
// Auto-reconnect on connection loss
websocketService.onDisconnect = () => {
  setTimeout(() => websocketService.connect(), 5000);
};
```

### **3. Background Handling:**
```javascript
// Handle app backgrounding
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background') {
    websocketService.disconnect();
  } else if (nextAppState === 'active') {
    websocketService.connect();
  }
});
```

---

## 🎯 **Next Steps**

1. **✅ Driver WebSocket**: Hoàn thành
2. **✅ Rider WebSocket**: Hoàn thành  
3. **🔄 Testing**: Test với backend demo
4. **📱 UI Polish**: Improve matching screen UI
5. **🔔 Push Notifications**: Integrate with FCM
6. **📍 Location Tracking**: Real-time GPS updates
7. **💰 Payment Integration**: Handle payment flow

---

## 📞 **Support**

Nếu gặp vấn đề:
1. Check console logs cho WebSocket connection
2. Verify JWT token và permissions
3. Test với browser demo files
4. Check backend logs cho authentication

**Happy Coding! 🚀**
