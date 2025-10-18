import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import fcmService from '../services/fcmService';
import { locationTrackingService } from '../services/locationTrackingService';

const FCMTestPanel = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState(null);

  useEffect(() => {
    loadFCMStatus();
    
    // Update tracking status every 5 seconds
    const interval = setInterval(() => {
      const status = locationTrackingService.getTrackingStatus();
      setTrackingStatus(status);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadFCMStatus = async () => {
    try {
      const token = await fcmService.getFCMToken();
      setFcmToken(token);
      setIsInitialized(fcmService.isInitialized);
    } catch (error) {
      console.error('Error loading FCM status:', error);
    }
  };

  const handleInitializeFCM = async () => {
    try {
      const success = await fcmService.initialize();
      if (success) {
        Alert.alert('Thành công', 'FCM đã được khởi tạo');
        await loadFCMStatus();
      } else {
        Alert.alert('Lỗi', 'Không thể khởi tạo FCM');
      }
    } catch (error) {
      console.error('FCM initialization error:', error);
      Alert.alert('Lỗi', 'Lỗi khởi tạo FCM: ' + error.message);
    }
  };

  const handleRegisterToken = async () => {
    try {
      await fcmService.registerToken();
      Alert.alert('Thành công', 'Token đã được đăng ký với backend');
    } catch (error) {
      console.error('Token registration error:', error);
      Alert.alert('Lỗi', 'Không thể đăng ký token: ' + error.message);
    }
  };

  const handleTestTracking = async () => {
    try {
      const testRideId = 999;
      await locationTrackingService.startTracking(testRideId);
      Alert.alert('Thành công', `Bắt đầu test tracking cho ride ${testRideId}`);
    } catch (error) {
      console.error('Test tracking error:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu test tracking: ' + error.message);
    }
  };

  const handleStopTracking = async () => {
    try {
      await locationTrackingService.stopTracking();
      Alert.alert('Thành công', 'Đã dừng tracking');
    } catch (error) {
      console.error('Stop tracking error:', error);
      Alert.alert('Lỗi', 'Không thể dừng tracking: ' + error.message);
    }
  };

  const handleForceSend = async () => {
    try {
      await locationTrackingService.forceSendBuffer();
      Alert.alert('Thành công', 'Đã gửi buffer location');
    } catch (error) {
      console.error('Force send error:', error);
      Alert.alert('Lỗi', 'Không thể gửi buffer: ' + error.message);
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      // In a real app, you'd use Clipboard API
      Alert.alert('FCM Token', fcmToken);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FCM & Tracking Test Panel</Text>

      {/* FCM Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.label}>Initialized:</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isInitialized ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {isInitialized ? 'YES' : 'NO'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Token:</Text>
          <TouchableOpacity 
            style={styles.tokenContainer}
            onPress={copyTokenToClipboard}
          >
            <Text style={styles.tokenText} numberOfLines={2}>
              {fcmToken ? fcmToken.substring(0, 50) + '...' : 'No token'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleInitializeFCM}
          >
            <Icon name="settings" size={16} color="#fff" />
            <Text style={styles.buttonText}>Initialize FCM</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleRegisterToken}
            disabled={!isInitialized}
          >
            <Icon name="cloud-upload" size={16} color="#fff" />
            <Text style={styles.buttonText}>Register Token</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Tracking Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Tracking</Text>
        
        {trackingStatus && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: trackingStatus.isTracking ? '#4CAF50' : '#9E9E9E' }
              ]}>
                <Text style={styles.statusText}>
                  {trackingStatus.isTracking ? 'TRACKING' : 'STOPPED'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Ride ID:</Text>
              <Text style={styles.value}>
                {trackingStatus.rideId || 'None'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Buffer Size:</Text>
              <Text style={styles.value}>
                {trackingStatus.bufferSize} points
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.label}>Last Send:</Text>
              <Text style={styles.value}>
                {trackingStatus.lastSendTime ? 
                  new Date(trackingStatus.lastSendTime).toLocaleTimeString() : 
                  'Never'
                }
              </Text>
            </View>
          </>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.successButton]}
            onPress={handleTestTracking}
          >
            <Icon name="play-arrow" size={16} color="#fff" />
            <Text style={styles.buttonText}>Start Test</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={handleStopTracking}
          >
            <Icon name="stop" size={16} color="#fff" />
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton, styles.fullWidth]}
          onPress={handleForceSend}
        >
          <Icon name="send" size={16} color="#fff" />
          <Text style={styles.buttonText}>Force Send Buffer</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Initialize FCM để lấy push token{'\n'}
          2. Register token với backend{'\n'}
          3. Test tracking để kiểm tra GPS{'\n'}
          4. Backend sẽ gửi START_TRACKING push{'\n'}
          5. App sẽ tự động bắt đầu tracking GPS
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  tokenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  tokenText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  fullWidth: {
    marginHorizontal: 0,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#9E9E9E',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default FCMTestPanel;
