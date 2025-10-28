import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import apiService from './api';
import { ENDPOINTS } from '../config/api';
import permissionService from './permissionService';

const LOCATION_TASK_NAME = 'background-location-task';

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentRideId = null;
    this.locationBuffer = [];
    this.lastSendTime = 0;
    this.sendInterval = 30000; // 30s
    this.maxBufferSize = 5;    // gửi khi có >=5 điểm
    this.pendingRideId = null;

    // Notification id thật sự do Expo trả về
    this.trackingNotificationId = null;

    // Cache for ride status
    this.cachedRideStatus = null;
    this.lastStatusCheck = 0;

    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    // Simulation state
    this.isSimulating = false;
    this.simulationTimer = null;
    this.simulationLocalOnly = true; // when true, still buffers but sendBatch will be skipped
    this.simulationStepMs = 2000; // 2s per step
    this.simulationSpeedMps = 8.33; // ~30km/h
    this.simulationProgress = 0;
    this.simulationStart = null; // { lat, lng }
    this.simulationEnd = null;   // { lat, lng }
    this.simulationPolyline = null; // decoded polyline points
    this.onSimulationLocation = null; // optional listener for UI
  }

  handleAppStateChange(nextAppState) {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      if (this.pendingRideId) {
        console.log('App became active, starting pending GPS tracking...');
        this.startTracking(this.pendingRideId).catch((e) =>
          console.error('Failed to start pending GPS tracking:', e)
        );
        this.pendingRideId = null;
      } else if (this.isTracking && this.currentRideId) {
        // App became active while tracking, check if tracking is still running
        console.log('App became active while tracking, checking tracking status...');
        this.checkTrackingStatus();
      }
    } else if (nextAppState === 'background' && this.isTracking) {
      console.log('App went to background while tracking, ensuring foreground service...');
      // Ensure foreground service is running
      this.ensureForegroundService();
    }
  }

  async checkTrackingStatus() {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (!isRunning && this.isTracking) {
        console.log('Tracking stopped unexpectedly, restarting...');
        await this.startTracking(this.currentRideId);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  }

  async ensureForegroundService() {
    try {
      // Check if foreground service notification is still active
      if (this.trackingNotificationId) {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        const trackingNotification = notifications.find(n => n.identifier === this.trackingNotificationId);
        if (!trackingNotification) {
          console.log('Foreground service notification lost, recreating...');
          if (this.currentRideId) {
            await this.showTrackingNotification(this.currentRideId);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring foreground service:', error);
    }
  }

  // --- Simulation helpers ---
  setSimulationListener(listener) {
    this.onSimulationLocation = typeof listener === 'function' ? listener : null;
  }

  getSimulationState() {
    return {
      isSimulating: this.isSimulating,
      start: this.simulationStart,
      end: this.simulationEnd,
      progress: this.simulationProgress,
    };
  }

  startSimulation({ start, end, speedMps, localOnly = true, polyline }) {
    try {
      if (!start || !end) throw new Error('start/end is required');
      if (this.simulationTimer) clearInterval(this.simulationTimer);

      this.simulationStart = { lat: start.lat, lng: start.lng };
      this.simulationEnd = { lat: end.lat, lng: end.lng };
      this.simulationSpeedMps = typeof speedMps === 'number' && speedMps > 0 ? speedMps : this.simulationSpeedMps;
      this.simulationLocalOnly = !!localOnly;
      this.simulationProgress = 0;
      this.isSimulating = true;

      // Decode polyline if provided
      let routePoints = null;
      if (polyline && typeof polyline === 'string') {
        try {
          routePoints = this._decodePolyline(polyline);
          console.log(`✅ Using polyline with ${routePoints.length} points for simulation`);
        } catch (e) {
          console.warn('Failed to decode polyline, using straight line:', e);
        }
      }

      // Calculate total distance and time
      let totalDistance = 0;
      let totalSeconds = 0;
      
      if (routePoints && routePoints.length > 1) {
        // Calculate distance along polyline
        for (let i = 1; i < routePoints.length; i++) {
          totalDistance += this._haversineMeters(routePoints[i - 1], routePoints[i]);
        }
        totalSeconds = Math.max(1, totalDistance / this.simulationSpeedMps);
      } else {
        // Fallback to straight line
        totalDistance = this._haversineMeters(this.simulationStart, this.simulationEnd);
        totalSeconds = Math.max(1, totalDistance / this.simulationSpeedMps);
      }

      this.simulationTimer = setInterval(() => {
        if (!this.isSimulating) return;
        this.simulationProgress += (this.simulationStepMs / 1000) / totalSeconds;
        if (this.simulationProgress >= 1) this.simulationProgress = 1;

        let point;
        
        if (routePoints && routePoints.length > 1) {
          // Interpolate along polyline
          const index = Math.floor(this.simulationProgress * (routePoints.length - 1));
          const nextIndex = Math.min(index + 1, routePoints.length - 1);
          const segmentProgress = (this.simulationProgress * (routePoints.length - 1)) - index;
          point = this._lerpLatLng(routePoints[index], routePoints[nextIndex], segmentProgress);
        } else {
          // Straight line interpolation
          point = this._lerpLatLng(this.simulationStart, this.simulationEnd, this.simulationProgress);
        }

        // Notify UI if subscribed
        if (this.onSimulationLocation) {
          this.onSimulationLocation({ latitude: point.lat, longitude: point.lng });
        }

        // Feed into existing pipeline as a fake OS location
        const fake = [{
          coords: { latitude: point.lat, longitude: point.lng, accuracy: 10 },
          timestamp: Date.now()
        }];
        this.processLocationUpdate(fake);

        if (this.simulationProgress >= 1) {
          this.stopSimulation();
        }
      }, this.simulationStepMs);
    } catch (e) {
      console.error('Failed to start simulation:', e);
      this.stopSimulation();
    }
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.isSimulating = false;
    this.simulationProgress = 0;
  }

  _haversineMeters(a, b) {
    const R = 6371000; // meters
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  _lerpLatLng(a, b, t) {
    return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
  }

  // Decode Google encoded polyline
  _decodePolyline(encoded) {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      
      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    
    return points;
  }

  /**
   * Kiểm tra trạng thái location service
   */
  async checkLocationServiceStatus() {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error('Location services are disabled');
      }
      
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }
      
      return true;
    } catch (error) {
      console.error('Location service check failed:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking for a ride
   */
  async startTracking(rideId) {
    try {
      console.log(`Starting GPS tracking for ride ${rideId}`);

      // Kiểm tra trạng thái location service trước
      const serviceOk = await this.checkLocationServiceStatus();
      if (!serviceOk) {
        throw new Error('Location service not available');
      }

      // Clear cache when starting new ride
      this.cachedRideStatus = null;
      this.lastStatusCheck = 0;

      // Kiểm tra và dừng tracking hiện tại nếu cần
      const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (alreadyStarted) {
        console.log('Stopping existing location tracking...');
        try {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          // Đợi một chút để đảm bảo dừng hoàn toàn
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (stopError) {
          console.warn('Error stopping existing tracking:', stopError);
        }
      }

      // Nếu app đang ở nền → nhắc mở app
      if (AppState.currentState !== 'active') {
        console.log('App is in background, showing notification to start tracking later...');
        await this.showTrackingNotification(rideId);
        this.pendingRideId = rideId;
        return false;
      }

      // 1) Quyền foreground
      let fg = await permissionService?.requestLocationPermission?.(true);
      if (!fg || typeof fg.granted !== 'boolean') {
        fg = await Location.requestForegroundPermissionsAsync();
      }
      if (!fg.granted) {
        throw new Error('Location permission not granted');
      }

      // 2) Quyền background (không chặn nếu chưa có, vẫn chạy foreground)
      let bg = await permissionService?.requestBackgroundLocationPermission?.(true);
      if (!bg || typeof bg.granted !== 'boolean') {
        bg = await Location.requestBackgroundPermissionsAsync();
      }
      if (!bg.granted && Platform.OS === 'android') {
        console.warn('Background location not granted → will run with foreground service notification only');
      }

      this.currentRideId = rideId;
      this.isTracking = true;
      this.locationBuffer = [];
      this.lastSendTime = Date.now();

      // 3) Hiện notification (giữ id để dismiss)
      await this.showTrackingNotification(rideId);

      // 4) Bắt đầu cập nhật nền (Android 14+ cần FGS type=location → plugin expo-location sẽ cấu hình)
      // Thử với cấu hình đơn giản trước để tránh lỗi SharedPreferences
      const locationOptions = {
        accuracy: Location.Accuracy.Balanced, // Giảm accuracy để tránh lỗi
        timeInterval: 15000, // Tăng interval
        distanceInterval: 20, // Tăng distance interval
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: false, // iOS
      };

      // Chỉ thêm foregroundService cho Android và khi có background permission
      if (Platform.OS === 'android' && bg?.granted) {
        locationOptions.foregroundService = {
          notificationTitle: `Đang theo dõi chuyến đi #${rideId}`,
          notificationBody: 'GPS đang hoạt động',
          notificationColor: '#4CAF50',
        };
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, locationOptions);

      console.log(`GPS tracking started for ride ${rideId}`);
      return true;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      
      // Thử lại với cấu hình đơn giản nhất
      try {
        console.log('Retrying with minimal configuration...');
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Lowest,
          timeInterval: 30000,
          distanceInterval: 50,
        });
        console.log(`GPS tracking started with minimal config for ride ${rideId}`);
        return true;
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        
        // Fallback: Bật simulation mode nếu GPS thật không hoạt động
        console.log('GPS tracking failed, enabling simulation mode as fallback...');
        this.isTracking = true;
        this.currentRideId = rideId;
        
        // Bật simulation với pickup -> dropoff nếu có dữ liệu
        try {
          const rideData = await this.getRideData(rideId);
          if (rideData?.pickup_lat && rideData?.dropoff_lat) {
            this.startSimulation({
              start: { lat: rideData.pickup_lat, lng: rideData.pickup_lng },
              end: { lat: rideData.dropoff_lat, lng: rideData.dropoff_lng },
              speedMps: 8.33,
              localOnly: true,
            });
            console.log('Simulation mode enabled as GPS fallback');
            return true;
          }
        } catch (simError) {
          console.error('Failed to start simulation fallback:', simError);
        }
        
        this.isTracking = false;
        this.currentRideId = null;
        // cleanup noti nếu đã bật
        try { await this.hideTrackingNotification(); } catch {}
        throw retryError;
      }
    }
  }

  async stopTracking() {
    try {
      console.log(`Stopping GPS tracking for ride ${this.currentRideId}`);

      const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      if (this.locationBuffer.length > 0) {
        await this.sendLocationBatch();
      }

      await this.hideTrackingNotification();

      this.isTracking = false;
      this.currentRideId = null;
      this.locationBuffer = [];

      console.log('GPS tracking stopped');
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
      throw error;
    }
  }

  /**
   * Hiện notification (lưu lại id trả về để dismiss đúng)
   */
  async showTrackingNotification(rideId) {
    try {
      // (Tùy ý) đảm bảo có notification channel quan trọng trên Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tracking', {
          name: 'Ride Tracking',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      this.trackingNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Đang theo dõi chuyến đi #${rideId}`,
          body: 'GPS đang hoạt động',
          data: { rideId, type: 'tracking' },
          // channelId Android
          ...(Platform.OS === 'android' ? { channelId: 'tracking' } : {}),
        },
        trigger: null, // show ngay
      });
    } catch (e) {
      console.warn('Failed to show tracking notification:', e);
      this.trackingNotificationId = null;
    }
  }

  async hideTrackingNotification() {
    try {
      if (this.trackingNotificationId) {
        await Notifications.dismissNotificationAsync(this.trackingNotificationId);
        this.trackingNotificationId = null;
      }
    } catch (e) {
      console.warn('Failed to hide tracking notification:', e);
    }
  }

  async processLocationUpdate(locations) {
    if (!this.isTracking || !this.currentRideId) return;
    
    // Skip processing during simulation to avoid triggering real tracking
    if (this.isSimulating) return;

    try {
      const validLocations = (locations || [])
        .filter((loc) => loc?.coords?.accuracy <= 50)
        .map((loc) => ({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          timestamp: new Date(loc.timestamp).toISOString()
        }));

      if (validLocations.length === 0) return;

      this.locationBuffer.push(...validLocations);

      const now = Date.now();
      const shouldSend =
        this.locationBuffer.length >= this.maxBufferSize ||
        (now - this.lastSendTime) >= this.sendInterval;

      if (shouldSend) {
        await this.sendLocationBatch();
      }
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  async sendLocationBatch() {
    if (!this.currentRideId || this.locationBuffer.length === 0) return;

    try {
      // When simulating locally, skip sending to backend to avoid noisy errors
      if (this.isSimulating && this.simulationLocalOnly) {
        this.locationBuffer = [];
        this.lastSendTime = Date.now();
        return;
      }

      // Check ride status before sending location data
      const rideStatus = await this.getRideStatus();
      if (rideStatus !== 'ONGOING') {
        console.log(`Ride ${this.currentRideId} status is ${rideStatus}, skipping location send (will retry later)`);
        // Don't clear buffer, keep it for later when ride becomes ONGOING
        return;
      }

      const endpoint = ENDPOINTS.RIDES.TRACK.replace('{rideId}', this.currentRideId);
      const payload = this.locationBuffer.slice(); // copy an toàn
      const response = await apiService.post(endpoint, payload);

      console.log(`Sent ${payload.length} location points for ride ${this.currentRideId}`);
      this.locationBuffer = [];
      this.lastSendTime = Date.now();
      return response;
    } catch (error) {
      console.error('Failed to send location batch:', error);
      // Giữ nguyên buffer để retry lần sau
      throw error;
    }
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      rideId: this.currentRideId,
      bufferSize: this.locationBuffer.length,
      lastSendTime: this.lastSendTime,
    };
  }

  async getRideStatus() {
    try {
      if (!this.currentRideId) return null;
      
      // Cache ride status to avoid too many API calls
      const now = Date.now();
      if (this.lastStatusCheck && (now - this.lastStatusCheck) < 30000) { // 30 seconds cache
        return this.cachedRideStatus;
      }
      
      const endpoint = ENDPOINTS.SHARED_RIDES.GET_BY_ID.replace('{rideId}', this.currentRideId);
      const response = await apiService.get(endpoint);
      const status = response?.status || null;
      
      this.cachedRideStatus = status;
      this.lastStatusCheck = now;
      
      return status;
    } catch (error) {
      console.error('Failed to get ride status:', error);
      return null;
    }
  }

  async getRideData(rideId) {
    try {
      const endpoint = ENDPOINTS.SHARED_RIDES.GET_BY_ID.replace('{rideId}', rideId);
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to get ride data:', error);
      return null;
    }
  }

  async forceSendBuffer() {
    if (this.locationBuffer.length > 0) {
      await this.sendLocationBatch();
    }
  }
}

// Định nghĩa background task (giữ nguyên tên)
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    locationTrackingService.processLocationUpdate(locations);
  }
});

export const locationTrackingService = new LocationTrackingService();
