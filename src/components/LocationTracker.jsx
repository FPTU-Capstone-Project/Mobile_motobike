import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import locationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');

const LocationTracker = ({ 
  showMap = true, 
  trackingEnabled = false,
  onLocationUpdate,
  initialLocation 
}) => {
  const [location, setLocation] = useState(initialLocation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialLocation]);

  useEffect(() => {
    if (trackingEnabled && !isTracking) {
      startLocationTracking();
    } else if (!trackingEnabled && isTracking) {
      stopLocationTracking();
    }

    return () => {
      if (isTracking) {
        locationService.stopLocationTracking();
      }
    };
  }, [trackingEnabled]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      
      if (showMap) {
        setRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      if (onLocationUpdate) {
        onLocationUpdate(currentLocation);
      }
    } catch (error) {
      setError(error.message);
      Alert.alert('Lỗi GPS', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await locationService.startLocationTracking((newLocation) => {
        setLocation(newLocation);
        
        if (showMap) {
          setRegion({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      });

      setIsTracking(true);
    } catch (error) {
      setError(error.message);
      Alert.alert('Lỗi theo dõi GPS', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopLocationTracking = () => {
    LocationService.stopLocationTracking();
    setIsTracking(false);
  };

  const formatCoordinates = (lat, lng) => {
    if (!lat || !lng) return 'Không xác định';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return 'Không xác định';
    return `±${Math.round(accuracy)}m`;
  };

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Icon name="location-on" size={24} color="#2196F3" />
          <Text style={styles.locationTitle}>Vị trí hiện tại</Text>
          {isTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>Đang theo dõi</Text>
            </View>
          )}
        </View>

        {location ? (
          <View style={styles.locationDetails}>
            <Text style={styles.addressText}>
              {location.address || 'Đang xác định địa chỉ...'}
            </Text>
            <Text style={styles.coordinatesText}>
              {formatCoordinates(location.latitude, location.longitude)}
            </Text>
            <View style={styles.locationMeta}>
              <Text style={styles.accuracyText}>
                Độ chính xác: {formatAccuracy(location.accuracy)}
              </Text>
              {location.timestamp && (
                <Text style={styles.timestampText}>
                  {new Date(location.timestamp).toLocaleTimeString('vi-VN')}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.noLocationText}>
            {error || 'Chưa có thông tin vị trí'}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.getCurrentButton]}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="my-location" size={20} color="#fff" />
              <Text style={styles.buttonText}>Lấy vị trí</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            isTracking ? styles.stopTrackingButton : styles.startTrackingButton
          ]}
          onPress={isTracking ? stopLocationTracking : startLocationTracking}
          disabled={isLoading}
        >
          <Icon 
            name={isTracking ? "stop" : "play-arrow"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.buttonText}>
            {isTracking ? 'Dừng theo dõi' : 'Theo dõi'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Placeholder */}
      {showMap && location && (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={48} color="#ccc" />
            <Text style={styles.mapPlaceholderText}>
              Vị trí: {location.address || 'Đang xác định...'}
            </Text>
            <Text style={styles.coordinatesText}>
              {formatCoordinates(location.latitude, location.longitude)}
            </Text>
            <TouchableOpacity
              style={styles.openMapsButton}
              onPress={openInGoogleMaps}
            >
              <Icon name="open-in-new" size={20} color="#fff" />
              <Text style={styles.openMapsText}>Mở Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={getCurrentLocation}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  trackingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  locationDetails: {
    paddingLeft: 32,
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: '#999',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    paddingLeft: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  getCurrentButton: {
    backgroundColor: '#2196F3',
  },
  startTrackingButton: {
    backgroundColor: '#4CAF50',
  },
  stopTrackingButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  openMapsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F44336',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LocationTracker;
