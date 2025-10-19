import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import apiService from './api';
import { ENDPOINTS } from '../config/api';
import permissionService from './permissionService';

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_NOTIFICATION_ID = 'ride-tracking';

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentRideId = null;
    this.locationBuffer = [];
    this.lastSendTime = 0;
    this.sendInterval = 30000; // 30 seconds
    this.maxBufferSize = 5; // Send when buffer reaches 5 points
    this.pendingRideId = null;
    
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes
   */
  handleAppStateChange(nextAppState) {
    if (nextAppState === 'active' && this.pendingRideId) {
      console.log('App became active, starting pending GPS tracking...');
      this.startTracking(this.pendingRideId).catch(error => {
        console.error('Failed to start pending GPS tracking:', error);
      });
      this.pendingRideId = null;
    }
  }

  /**
   * Start GPS tracking for a ride (called when receiving START_TRACKING push)
   */
  async startTracking(rideId) {
    try {
      console.log(`Starting GPS tracking for ride ${rideId}`);

      // Check if app is in foreground
      if (AppState.currentState !== 'active') {
        console.log('App is in background, showing notification to start tracking...');
        // Show notification to bring app to foreground
        await this.showTrackingNotification(rideId);
        // Store rideId to start tracking when app becomes active
        this.pendingRideId = rideId;
        return false; // Return false to indicate tracking will start later
      }

      // Request location permissions using PermissionService
      const foregroundResult = await permissionService.requestLocationPermission(true);
      if (!foregroundResult.granted) {
        throw new Error('Location permission not granted');
      }

      // Request background location permission
      const backgroundResult = await permissionService.requestBackgroundLocationPermission(true);
      if (!backgroundResult.granted) {
        console.warn('Background location permission not granted');
        // Continue with foreground tracking only
      }

      this.currentRideId = rideId;
      this.isTracking = true;
      this.locationBuffer = [];
      this.lastSendTime = Date.now();

      // Show persistent notification (required for foreground service)
      await this.showTrackingNotification(rideId);

      // Start location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 10, // 10 meters
        deferredUpdatesInterval: 30000, // 30 seconds
        foregroundService: {
          notificationTitle: `Đang theo dõi chuyến đi #${rideId}`,
          notificationBody: 'GPS đang hoạt động',
          notificationColor: '#4CAF50',
        },
      });

      console.log(`GPS tracking started for ride ${rideId}`);
      return true;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      this.isTracking = false;
      this.currentRideId = null;
      throw error;
    }
  }

  /**
   * Stop GPS tracking (called when receiving STOP_TRACKING push)
   */
  async stopTracking() {
    try {
      console.log(`Stopping GPS tracking for ride ${this.currentRideId}`);

      if (this.isTracking) {
        // Stop location updates
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

        // Send any remaining buffered points
        if (this.locationBuffer.length > 0) {
          await this.sendLocationBatch();
        }

        // Hide tracking notification
        await this.hideTrackingNotification();

        this.isTracking = false;
        this.currentRideId = null;
        this.locationBuffer = [];

        console.log('GPS tracking stopped');
      }
    } catch (error) {
      console.error('Failed to stop GPS tracking:', error);
      throw error;
    }
  }

  /**
   * Show persistent notification for tracking
   */
  async showTrackingNotification(rideId) {
    await Notifications.scheduleNotificationAsync({
      identifier: TRACKING_NOTIFICATION_ID,
      content: {
        title: `Đang theo dõi chuyến đi #${rideId}`,
        body: 'GPS đang hoạt động',
        data: { rideId, type: 'tracking' },
        sticky: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Hide tracking notification
   */
  async hideTrackingNotification() {
    await Notifications.dismissNotificationAsync(TRACKING_NOTIFICATION_ID);
  }

  /**
   * Process location update (called by TaskManager)
   */
  async processLocationUpdate(locations) {
    if (!this.isTracking || !this.currentRideId) {
      return;
    }

    try {
      // Filter and add locations to buffer
      const validLocations = locations
        .filter(location => location.coords.accuracy <= 50) // Only accurate locations
        .map(location => ({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          timestamp: new Date(location.timestamp).toISOString(),
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
        }));

      this.locationBuffer.push(...validLocations);

      // Send batch if buffer is full or enough time has passed
      const now = Date.now();
      const shouldSend = 
        this.locationBuffer.length >= this.maxBufferSize ||
        (now - this.lastSendTime) >= this.sendInterval;

      if (shouldSend && this.locationBuffer.length > 0) {
        await this.sendLocationBatch();
      }
    } catch (error) {
      console.error('Error processing location update:', error);
    }
  }

  /**
   * Send location batch to backend
   */
  async sendLocationBatch() {
    if (!this.currentRideId || this.locationBuffer.length === 0) {
      return;
    }

    try {
      const endpoint = ENDPOINTS.RIDES.TRACK.replace('{rideId}', this.currentRideId);
      const response = await apiService.post(endpoint, this.locationBuffer);

      console.log(`Sent ${this.locationBuffer.length} location points for ride ${this.currentRideId}`);
      console.log('Tracking response:', response);

      // Clear buffer and update last send time
      this.locationBuffer = [];
      this.lastSendTime = Date.now();

      return response;
    } catch (error) {
      console.error('Failed to send location batch:', error);
      // Keep locations in buffer for retry
      throw error;
    }
  }

  /**
   * Get current tracking status
   */
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      rideId: this.currentRideId,
      bufferSize: this.locationBuffer.length,
      lastSendTime: this.lastSendTime,
    };
  }

  /**
   * Force send current buffer (for testing)
   */
  async forceSendBuffer() {
    if (this.locationBuffer.length > 0) {
      await this.sendLocationBatch();
    }
  }
}

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    // Process locations through the service instance
    locationTrackingService.processLocationUpdate(locations);
  }
});

export const locationTrackingService = new LocationTrackingService();