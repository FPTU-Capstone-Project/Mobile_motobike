import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GoongMap from '../../components/GoongMap.jsx';
import { locationTrackingService } from '../../services/locationTrackingService';
import activeRideService from '../../services/activeRideService';
import rideService from '../../services/rideService';
import locationService from '../../services/LocationService';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const DriverRideTrackingScreen = ({ route, navigation }) => {
  const { rideId, startTracking = false, rideData: initialRideData, status } = route.params || {};
  
  const [isTracking, setIsTracking] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [etaText, setEtaText] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(true);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [markerUpdateKey, setMarkerUpdateKey] = useState(0);

  // Listen to simulation location updates
  useEffect(() => {
    const handleSimulationUpdate = (location) => {
      if (location) {
        console.log('📍 Simulation update:', location);
        setDriverLocation({ 
          latitude: location.latitude, 
          longitude: location.longitude 
        });
        
        // Update map to follow driver
        if (mapRef.current) {
          // Use animateToRegion instead
          mapRef.current.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
      }
    };

    locationTrackingService.setSimulationListener(handleSimulationUpdate);

    return () => {
      locationTrackingService.setSimulationListener(null);
    };
  }, []);

  // Update markers when driver location changes (with throttling)
  useEffect(() => {
    if (driverLocation) {
      // Throttle marker updates to every 500ms
      const timer = setTimeout(() => {
        // Trigger marker update by incrementing key
        setMarkerUpdateKey(prev => prev + 1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [driverLocation]);

  useEffect(() => {
    if (rideId) {
      if (initialRideData) {
        console.log('📦 RAW initialRideData from backend:', JSON.stringify(initialRideData, null, 2));
        console.log('📍 Polyline in ride data:', initialRideData.polyline || initialRideData.route?.polyline);
        
        setRideData(initialRideData);
        setLoading(false);
        
        // Handle both flat and nested location formats from backend
        const getPickupLat = () => {
          if (initialRideData.pickup_location?.lat) return initialRideData.pickup_location.lat;
          if (initialRideData.pickup_lat) return initialRideData.pickup_lat;
          return null;
        };
        const getPickupLng = () => {
          if (initialRideData.pickup_location?.lng) return initialRideData.pickup_location.lng;
          if (initialRideData.pickup_lng) return initialRideData.pickup_lng;
          return null;
        };
        const getPickupName = () => {
          if (initialRideData.pickup_location?.name) return initialRideData.pickup_location.name;
          if (initialRideData.pickup_location?.address) return initialRideData.pickup_location.address;
          if (initialRideData.pickup_location_name) return initialRideData.pickup_location_name;
          return 'Điểm đón';
        };
        const getDropoffLat = () => {
          if (initialRideData.dropoff_location?.lat) return initialRideData.dropoff_location.lat;
          if (initialRideData.dropoff_lat) return initialRideData.dropoff_lat;
          return null;
        };
        const getDropoffLng = () => {
          if (initialRideData.dropoff_location?.lng) return initialRideData.dropoff_location.lng;
          if (initialRideData.dropoff_lng) return initialRideData.dropoff_lng;
          return null;
        };
        const getDropoffName = () => {
          if (initialRideData.dropoff_location?.name) return initialRideData.dropoff_location.name;
          if (initialRideData.dropoff_location?.address) return initialRideData.dropoff_location.address;
          if (initialRideData.dropoff_location_name) return initialRideData.dropoff_location_name;
          return 'Điểm đến';
        };
        
        activeRideService.saveActiveRide({
          rideId: rideId,
          requestId: initialRideData.shared_ride_request_id,
          status: initialRideData.status,
          userType: 'driver',
          pickupLocation: {
            lat: getPickupLat(),
            lng: getPickupLng(),
            name: getPickupName()
          },
          dropoffLocation: {
            lat: getDropoffLat(),
            lng: getDropoffLng(),
            name: getDropoffName()
          },
          totalFare: initialRideData.total_fare || initialRideData.totalFare,
          riderName: initialRideData.rider_name,
          ...initialRideData
        });
        
        // Get current driver location
        locationService.getCurrentLocation().then(loc => {
          if (loc) {
            setDriverLocation({
              latitude: loc.latitude,
              longitude: loc.longitude
            });
          }
        }).catch(e => console.error('Failed to get location:', e));
      } else {
        loadRideData();
      }
    }
    
    if (startTracking) {
      startTrackingService();
    }
  }, [rideId, startTracking, initialRideData]);

  // Auto start tracking when ride is CONFIRMED
  useEffect(() => {
    if (rideData?.status === 'CONFIRMED' && !isTracking) {
      console.log('Ride confirmed, auto-starting GPS tracking...');
      setTimeout(() => {
        startTrackingService();
      }, 2000);
    }
  }, [rideData?.status, isTracking]);

  const loadRideData = async () => {
    try {
      setLoading(true);
      const ride = await rideService.getRideById(rideId);
      setRideData(ride);
    } catch (error) {
      console.error('Failed to load ride data:', error);
      setError('Không thể tải thông tin chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  const startTrackingService = async () => {
    try {
      if (rideData?.status !== 'ONGOING' && rideData?.status !== 'CONFIRMED') {
        Alert.alert('Chưa thể theo dõi', 'Vui lòng bắt đầu chuyến đi trước khi theo dõi GPS.');
        return;
      }

      const success = await locationTrackingService.startTracking(rideId);
      if (success) {
        setIsTracking(true);
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu GPS tracking.');
    }
  };

  const recenterMap = () => {
    try {
      if (!rideData || !mapRef.current) return;
      const points = [];
      const pickupLat = rideData.pickup_location?.lat || rideData.pickup_lat;
      const pickupLng = rideData.pickup_location?.lng || rideData.pickup_lng;
      const dropoffLat = rideData.dropoff_location?.lat || rideData.dropoff_lat;
      const dropoffLng = rideData.dropoff_location?.lng || rideData.dropoff_lng;
      
      if (pickupLat && pickupLng) points.push({ latitude: pickupLat, longitude: pickupLng });
      if (dropoffLat && dropoffLng) points.push({ latitude: dropoffLat, longitude: dropoffLng });
      
      if (points.length > 0) {
        mapRef.current.fitToCoordinates(points, { edgePadding: 100 });
      }
    } catch (e) {}
  };

  const completeRide = async () => {
    try {
      Alert.alert('Hoàn thành chuyến đi', 'Bạn có chắc chắn muốn hoàn thành?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            // Use simple completeRide without parameters
            await rideService.completeRide(rideId, 0, 0);
            await activeRideService.clearActiveRide();
            Alert.alert('Thành công', 'Chuyến đi đã hoàn thành.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]);
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Lỗi', 'Không thể hoàn thành chuyến đi.');
    }
  };

  const handleStartSimulation = () => {
    try {
      const pickupLat = rideData.pickup_location?.lat || rideData.pickup_lat;
      const pickupLng = rideData.pickup_location?.lng || rideData.pickup_lng;
      const dropoffLat = rideData.dropoff_location?.lat || rideData.dropoff_lat;
      const dropoffLng = rideData.dropoff_location?.lng || rideData.dropoff_lng;
      const polyline = rideData.polyline || rideData.route?.polyline; // Get polyline
      
      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        Alert.alert('Lỗi', 'Không có thông tin địa điểm');
        return;
      }
      
      console.log('📍 Starting simulation with polyline:', polyline ? 'Yes' : 'No');
      
      locationTrackingService.startSimulation({
        start: { lat: pickupLat, lng: pickupLng },
        end: { lat: dropoffLat, lng: dropoffLng },
        speedMps: 8.33,
        localOnly: true,
        polyline: polyline, // Pass polyline if available
      });
      setIsSimulating(true);
      setIsTracking(true);
      Alert.alert('Bắt đầu giả lập', polyline ? 'Đang mô phỏng di chuyển theo lộ trình thực...' : 'Đang mô phỏng di chuyển...');
    } catch (e) {
      console.error('Simulation error:', e);
      Alert.alert('Lỗi', 'Không thể bắt đầu giả lập');
    }
  };

  const handleStopSimulation = () => {
    locationTrackingService.stopSimulation();
    setIsSimulating(false);
    setIsTracking(false);
    Alert.alert('Đã dừng', 'Đã dừng giả lập.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getPickupLat = () => rideData?.pickup_location?.lat || rideData?.pickup_lat;
  const getPickupLng = () => rideData?.pickup_location?.lng || rideData?.pickup_lng;
  const getDropoffLat = () => rideData?.dropoff_location?.lat || rideData?.dropoff_lat;
  const getDropoffLng = () => rideData?.dropoff_location?.lng || rideData?.dropoff_lng;

  // Build markers array
  const markers = [];
  
  // Driver location marker (if available)
  if (driverLocation) {
    markers.push({
      id: 'driver',
      coordinate: driverLocation,
      title: 'Vị trí của bạn',
      description: 'Đang di chuyển',
      pinColor: '#2196F3',
      icon: 'motorcycle',
      updateKey: markerUpdateKey // Use updateKey for re-rendering
    });
  }
  
  // Pickup marker
  if (getPickupLat() && getPickupLng()) {
    markers.push({
      id: 'pickup',
      coordinate: { latitude: getPickupLat(), longitude: getPickupLng() },
      title: 'Điểm đón',
      description: rideData?.pickup_location?.name || rideData?.pickup_location?.address || 'Điểm đón',
      pinColor: '#4CAF50'
    });
  }
  
  // Dropoff marker
  if (getDropoffLat() && getDropoffLng()) {
    markers.push({
      id: 'dropoff',
      coordinate: { latitude: getDropoffLat(), longitude: getDropoffLng() },
      title: 'Điểm đến',
      description: rideData?.dropoff_location?.name || rideData?.dropoff_location?.address || 'Điểm đến',
      pinColor: '#f44336'
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Chuyến đi #{rideId}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusText}>Đang theo dõi</Text>
        </View>
      </View>

      {/* Full-Screen Map */}
      <View style={styles.mapContainer}>
        <GoongMap
          onRef={(api) => { mapRef.current = api; }}
          style={styles.map}
          initialRegion={{
            latitude: getPickupLat() || 10.7769,
            longitude: getPickupLng() || 106.7009,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          markers={markers}
        />

        {/* GPS Recenter Button */}
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterMap}>
          <Icon name="my-location" size={22} color="#333" />
        </TouchableOpacity>

        {/* Simulation Toggle */}
        <View style={styles.simulationControls}>
          {!isSimulating ? (
            <TouchableOpacity style={styles.simBtn} onPress={handleStartSimulation}>
              <Icon name="play-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.simBtnText}>Bật giả lập</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.simBtn, styles.simBtnStop]} onPress={handleStopSimulation}>
              <Icon name="pause-circle-outline" size={20} color="#fff" />
              <Text style={styles.simBtnText}>Tắt giả lập</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={styles.bottomSheet}>
        {/* Handle Bar */}
        <TouchableOpacity 
          style={styles.handleBar}
          onPress={() => setShowBottomSheet(!showBottomSheet)}
        >
          <View style={styles.handle} />
        </TouchableOpacity>

        {showBottomSheet && (
          <>
            {/* Ride Info Card */}
            <View style={styles.rideInfoCard}>
              <Text style={styles.cardTitle}>Thông tin chuyến đi</Text>
              
              <View style={styles.infoRow}>
                <Icon name="person" size={20} color="#666" />
                <Text style={styles.infoText}>{rideData?.rider_name || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="location-on" size={20} color="#4CAF50" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {rideData?.pickup_location?.name || rideData?.pickup_location?.address || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="place" size={20} color="#f44336" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {rideData?.dropoff_location?.name || rideData?.dropoff_location?.address || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.completeBtn} onPress={completeRide}>
              <Icon name="check-circle" size={24} color="white" />
              <Text style={styles.completeBtnText}>Hoàn thành chuyến đi</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 8,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  recenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  simulationControls: {
    position: 'absolute',
    left: 16,
    bottom: 200,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  simBtnStop: {
    backgroundColor: '#4CAF50',
  },
  simBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  rideInfoCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DriverRideTrackingScreen;
