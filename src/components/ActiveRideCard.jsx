import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import activeRideService from '../services/activeRideService';

const ActiveRideCard = ({ navigation }) => {
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveRide();
  }, []);

  const loadActiveRide = async () => {
    try {
      const ride = await activeRideService.getActiveRide();
      setActiveRide(ride);
    } catch (error) {
      console.error('Failed to load active ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeRide = () => {
    if (!activeRide) return;

    const screenName = activeRide.userType === 'driver' ? 'DriverRideTracking' : 'RideTracking';
    const params = {
      rideId: activeRide.rideId,
      requestId: activeRide.requestId,
      driverInfo: activeRide.driverInfo,
      status: activeRide.status,
      rideData: activeRide,
      startTracking: false
    };

    navigation.navigate(screenName, params);
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Hủy chuyến đi',
      'Bạn có chắc chắn muốn hủy chuyến đi đang diễn ra?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy',
          style: 'destructive',
          onPress: async () => {
            await activeRideService.clearActiveRide();
            setActiveRide(null);
          }
        }
      ]
    );
  };

  if (loading) {
    return null;
  }

  if (!activeRide) {
    return null;
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'ONGOING':
        return 'Đang diễn ra';
      case 'PENDING':
        return 'Đang chờ';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4CAF50';
      case 'ONGOING':
        return '#2196F3';
      case 'PENDING':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  return (
    <Animatable.View 
      animation="fadeInUp" 
      delay={200}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(activeRide.status) }]} />
          <Text style={styles.statusText}>
            {getStatusText(activeRide.status)}
          </Text>
        </View>
        <Text style={styles.rideId}>Chuyến #{activeRide.rideId}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.locationRow}>
          <Icon name="radio-button-checked" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={1}>
            {activeRide.pickupLocation?.name || 'Điểm đón'}
          </Text>
        </View>
        
        <View style={styles.locationRow}>
          <Icon name="location-on" size={16} color="#F44336" />
          <Text style={styles.locationText} numberOfLines={1}>
            {activeRide.dropoffLocation?.name || 'Điểm đến'}
          </Text>
        </View>

        {activeRide.userType === 'rider' && activeRide.driverInfo && (
          <View style={styles.driverRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.driverText}>
              Tài xế: {activeRide.driverInfo.driverName}
            </Text>
          </View>
        )}

        {activeRide.userType === 'driver' && activeRide.riderName && (
          <View style={styles.driverRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.driverText}>
              Khách: {activeRide.riderName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={handleResumeRide}
        >
          <Icon name="play-arrow" size={20} color="#fff" />
          <Text style={styles.resumeText}>Tiếp tục</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelRide}
        >
          <Icon name="close" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rideId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  resumeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveRideCard;
