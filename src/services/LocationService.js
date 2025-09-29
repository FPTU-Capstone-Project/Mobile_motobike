import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.isTracking = false;
  }

  // Yêu cầu quyền truy cập GPS
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Quyền truy cập vị trí bị từ chối');
      }

      // Yêu cầu thêm quyền background location cho tài xế
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        foreground: status === 'granted',
        background: backgroundStatus === 'granted'
      };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }

  // Lấy vị trí hiện tại
  async getCurrentLocation() {
    try {
      const permissions = await this.requestLocationPermission();
      
      if (!permissions.foreground) {
        throw new Error('Không có quyền truy cập vị trí');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000, // Cache trong 1 phút
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        address: null
      };

      // Lấy địa chỉ từ tọa độ
      await this.reverseGeocode();

      // Lưu vị trí vào storage
      await this.saveLocationToStorage();

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  // Theo dõi vị trí liên tục (cho tài xế)
  async startLocationTracking(callback) {
    try {
      const permissions = await this.requestLocationPermission();
      
      if (!permissions.foreground) {
        throw new Error('Không có quyền truy cập vị trí');
      }

      this.isTracking = true;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Cập nhật mỗi 5 giây
          distanceInterval: 10, // Hoặc khi di chuyển 10m
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading
          };

          // Callback để cập nhật UI
          if (callback) {
            callback(this.currentLocation);
          }

          // Lưu vị trí
          this.saveLocationToStorage();
        }
      );

      return this.watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  // Dừng theo dõi vị trí
  stopLocationTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
  }

  // Chuyển đổi tọa độ thành địa chỉ
  async reverseGeocode(latitude, longitude) {
    try {
      const lat = latitude || this.currentLocation?.latitude;
      const lng = longitude || this.currentLocation?.longitude;

      if (!lat || !lng) {
        throw new Error('Không có tọa độ để chuyển đổi');
      }

      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = `${address.street || ''} ${address.district || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
        
        if (this.currentLocation) {
          this.currentLocation.address = formattedAddress;
          this.currentLocation.addressDetails = address;
        }

        return formattedAddress;
      }

      return 'Không xác định được địa chỉ';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Lỗi khi xác định địa chỉ';
    }
  }

  // Chuyển đổi địa chỉ thành tọa độ
  async geocode(address) {
    try {
      const locations = await Location.geocodeAsync(address);
      
      if (locations.length > 0) {
        return {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude
        };
      }

      throw new Error('Không tìm thấy tọa độ cho địa chỉ này');
    } catch (error) {
      console.error('Error geocoding:', error);
      throw error;
    }
  }

  // Tính khoảng cách giữa 2 điểm
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Khoảng cách (km)
    
    return Math.round(distance * 1000) / 1000; // Làm tròn 3 chữ số thập phân
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Lưu vị trí vào AsyncStorage
  async saveLocationToStorage() {
    try {
      if (this.currentLocation) {
        await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(this.currentLocation));
      }
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  }

  // Lấy vị trí đã lưu từ AsyncStorage
  async getLocationFromStorage() {
    try {
      const savedLocation = await AsyncStorage.getItem('lastKnownLocation');
      if (savedLocation) {
        this.currentLocation = JSON.parse(savedLocation);
        return this.currentLocation;
      }
      return null;
    } catch (error) {
      console.error('Error getting location from storage:', error);
      return null;
    }
  }

  // Kiểm tra xem có đang theo dõi vị trí không
  isLocationTracking() {
    return this.isTracking;
  }

  // Lấy vị trí hiện tại (cached hoặc fresh)
  getLocation() {
    return this.currentLocation;
  }
}

export default new LocationService();
