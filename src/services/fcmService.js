import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import apiService from './api';
import { ENDPOINTS } from '../config/api';

async function getExpoPushTokenOptional() {
  try {
    const t = await Notifications.getExpoPushTokenAsync(); // nếu SDK yêu cầu, truyền { projectId: ... }
    return t?.data ?? null;
  } catch {
    return null;
  }
}
class FCMService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
    this.tokenListener = null;
    this.notificationListener = null;
    this.responseListener = null;
    // Flag to force enable FCM in development for testing
    this.FORCE_ENABLE_DEV = false; // Set to true to test FCM in development
  }

  // Initialize FCM (to be called after login)
  async initialize() {
    try {
      console.log('Initializing FCM Service...');
      // Không còn mock trong dev
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device or dev build');
        return false;
      }
  
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
  
      const { deviceToken, deviceType } = await this.getNativeDeviceToken();
      this.fcmToken = deviceToken; // lưu FCM (hoặc APNs)
  
      // (tuỳ chọn) lấy thêm Expo token nhưng KHÔNG gửi về backend
      const expoToken = await getExpoPushTokenOptional();
this.expoToken = expoToken;
      
  
      this.setupNotificationListeners();
      this.isInitialized = true;
      console.log('FCM Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
      return false;
    }
  }

  async getNativeDeviceToken() {
    // YÊU CẦU: chạy trên device thật hoặc dev-build (không phải Expo Go)
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') {
      const r = await Notifications.requestPermissionsAsync();
      if (r.status !== 'granted') throw new Error('Notification permission not granted');
    }
  
    // Android => FCM ; iOS => APNs
    const { data, type } = await Notifications.getDevicePushTokenAsync();
    // Trên Android, type sẽ là 'fcm'
    console.log('Native device push token:', type, data);
    return { deviceToken: data, deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' };
  }

  // Get Expo Push Token
  async getExpoPushToken() {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        if (this.FORCE_ENABLE_DEV) {
          // Create mock token for simulator testing
          const mockToken = `ExponentPushToken[dev_simulator_${Date.now()}]`;
          console.log('Using mock token for simulator testing:', mockToken);
          return mockToken;
        }
        console.warn('Push notifications only work on physical devices - FCM disabled in development');
        return null;
      }

      // For development, disable FCM unless forced
      if (__DEV__ && !this.FORCE_ENABLE_DEV) {
        console.warn('FCM disabled in development mode');
        return null;
      }

      try {
        // Get Expo push token
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('Expo Push Token:', token.data);
        return token.data;
      } catch (error) {
        if (__DEV__ && this.FORCE_ENABLE_DEV) {
          // Fallback to mock token in development
          const mockToken = `ExponentPushToken[dev_fallback_${Date.now()}]`;
          console.log('Using mock token for development testing:', mockToken);
          return mockToken;
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  }

  // Get FCM token (returns the Expo push token)
  async getFCMToken() {
    if (!this.fcmToken) {
      const { deviceToken } = await this.getNativeDeviceToken();
      this.fcmToken = deviceToken;
    }
    return this.fcmToken;
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Listen for token updates
    this.tokenListener = Notifications.addPushTokenListener(async (token) => {
      console.log('Push token updated:', token.data);
      this.fcmToken = token.data;
      
      // Re-register with backend when token changes
      try {
        await this.registerToken();
      } catch (error) {
        console.warn('Failed to re-register updated token:', error);
        // Don't throw error, just log it
      }
    });

    // Listen for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      this.handleNotification(notification);
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Register FCM token with backend
  async registerToken() {
    try {
      const token = await this.getFCMToken();
      if (!token) {
        console.warn('No FCM token available, skipping registration');
        return null;
      }
      const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  
      console.log('Registering FCM token:', { token: token.substring(0, 20) + '...', deviceType });
  
      const res = await apiService.post(ENDPOINTS.FCM.REGISTER, {
        token,
        deviceType,
        // (tuỳ chọn) gửi kèm expoToken nếu backend thích lưu:
        // expoToken: this.expoToken ?? null
      });
      console.log('FCM token registered successfully:', res);
      return res;
    } catch (e) {
      console.error('Failed to register FCM token:', e);
      return null;
    }
  }

  // Deactivate FCM token
  async deactivateToken(token = null) {
    try {
      const tokenToDeactivate = token || this.fcmToken;
      if (!tokenToDeactivate) {
        console.warn('No FCM token to deactivate');
        return;
      }

      const response = await apiService.delete(
        `${ENDPOINTS.FCM.DEACTIVATE}?token=${encodeURIComponent(tokenToDeactivate)}`
      );

      console.log('FCM token deactivated successfully:', response);
      
      if (!token) {
        this.fcmToken = null;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to deactivate FCM token:', error);
      throw error;
    }
  }

  // Handle incoming FCM messages (placeholder)
  // Cleanup listeners
  cleanup() {
    if (this.tokenListener) {
      this.tokenListener.remove();
    }
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    
    this.isInitialized = false;
    console.log('FCM Service cleaned up');
  }

  // Handle ride-specific notifications
  handleRideNotification(message) {
    try {
      const { data } = message;
      
      switch (data.type) {
        case 'START_TRACKING':
          this.handleStartTracking(data);
          break;
        case 'STOP_TRACKING':
          this.handleStopTracking(data);
          break;
        case 'RIDE_OFFER':
          this.handleRideOffer(data);
          break;
        case 'RIDE_MATCHED':
          this.handleRideMatched(data);
          break;
        case 'RIDE_CANCELLED':
          this.handleRideCancelled(data);
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error handling ride notification:', error);
    }
  }

  // Handle tracking start notification
  handleStartTracking(data) {
    console.log('Start tracking notification:', data);
    // TODO: Start foreground location service
    // This would trigger the GPS tracking service for drivers
  }

  // Handle tracking stop notification
  handleStopTracking(data) {
    console.log('Stop tracking notification:', data);
    // TODO: Stop foreground location service
  }

  // Handle ride offer notification (for drivers)
  handleRideOffer(data) {
    console.log('Ride offer notification:', data);
    // TODO: Show ride offer UI with countdown timer
  }

  // Handle ride matched notification (for riders)
  handleRideMatched(data) {
    console.log('Ride matched notification:', data);
    // TODO: Navigate to ride tracking screen
  }

  // Handle ride cancelled notification
  handleRideCancelled(data) {
    console.log('Ride cancelled notification:', data);
    // TODO: Show cancellation message and navigate back
  }

  // Request notification permissions (placeholder)
  async requestPermissions() {
    try {
      // Placeholder for permission request
      // In real app, this would request notification permissions
      console.log('Notification permissions requested (placeholder)');
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  // Check if notifications are enabled
  async checkPermissions() {
    try {
      // Placeholder for permission check
      // In real app, this would check current permission status
      console.log('Checking notification permissions (placeholder)');
      return true;
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }
}

// Export singleton instance
const fcmService = new FCMService();
export default fcmService;
