import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import LocationCard from '../../components/LocationCard.jsx';
import locationService from '../../services/locationService';
import rideService from '../../services/rideService';
import authService from '../../services/authService';
import mockData from '../../data/mockData.json';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);

  // Mock data fallback
  const presetLocations = mockData.presetLocations;

  useEffect(() => {
    initializeHome();
  }, []);

  const initializeHome = async () => {
    try {
      setLoading(true);
      
      // Get user info
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Get current location
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Load nearby rides if user is a rider
      if (currentUser?.active_profile === 'rider') {
        await loadNearbyRides();
      }

    } catch (error) {
      console.error('Error initializing home:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyRides = async () => {
    try {
      setLoadingRides(true);
      const rides = await rideService.getAvailableRides();
      setNearbyRides(rides?.data || []);
    } catch (error) {
      console.error('Error loading nearby rides:', error);
      setNearbyRides([]); // Set empty array on error
    } finally {
      setLoadingRides(false);
    }
  };

  const handleBookRide = () => {
    navigation.navigate('RideBooking');
  };

  const handleQuickLocation = async (location) => {
    try {
      if (!currentLocation) {
        Alert.alert('Lỗi', 'Không thể xác định vị trí hiện tại');
        return;
      }

      console.log(currentLocation);

      // Convert coordinates format if needed
      const dropoffCoords = {
        latitude: location.coordinates?.latitude || location.coordinates?.lat || 0,
        longitude: location.coordinates?.longitude || location.coordinates?.lng || 0
      };

      // Navigate to ride booking with preset destination
      navigation.navigate('RideBooking', {
        pickup: currentLocation,
        dropoff: dropoffCoords,
        pickupAddress: 'Vị trí hiện tại',
        dropoffAddress: location.name
      });
    } catch (error) {
      console.error('Error handling quick location:', error);
      Alert.alert('Lỗi', 'Không thể đặt xe đến vị trí này');
    }
  };

  const handleRideSelect = (ride) => {
    navigation.navigate('RideDetails', { rideId: ride.rideId });
  };

  const renderQuickActions = () => (
    <Animatable.View animation="fadeInUp" delay={200} style={styles.quickActionsCard}>
      <Text style={styles.sectionTitle}>Đặt xe nhanh</Text>
      
      <ModernButton
        title="Đặt xe ngay"
        onPress={handleBookRide}
        icon="directions-car"
        size="large"
        style={styles.bookRideButton}
      />

      <Text style={styles.quickLocationTitle}>Hoặc chọn điểm đến phổ biến:</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.locationsList}
      >
        {(presetLocations || []).map((location, index) => (
          <TouchableOpacity
            key={location.id}
            style={styles.quickLocationCard}
            onPress={() => handleQuickLocation(location)}
          >
            <LinearGradient
              colors={location.gradient || ['#4CAF50', '#2E7D32']}
              style={styles.locationGradient}
            >
              <Icon name={location.icon} size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationDistance}>
              {currentLocation ? 
                locationService.formatDistance(
                  locationService.calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    location.coordinates?.latitude || location.coordinates?.lat || 0,
                    location.coordinates?.longitude || location.coordinates?.lng || 0
                  )
                ) : '-- km'
              }
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animatable.View>
  );

  const renderNearbyRides = () => {
    if (!nearbyRides.length) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={400} style={styles.nearbyRidesCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chuyến xe gần bạn</Text>
          <TouchableOpacity onPress={loadNearbyRides}>
            <Icon name="refresh" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {loadingRides ? (
          <ActivityIndicator size="small" color="#4CAF50" style={styles.loadingIndicator} />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ridesList}
          >
            {(nearbyRides || []).slice(0, 5).map((ride, index) => (
              <TouchableOpacity
                key={ride.rideId}
                style={styles.rideCard}
                onPress={() => handleRideSelect(ride)}
              >
                <View style={styles.rideHeader}>
                  <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                      <Icon name="person" size={20} color="#4CAF50" />
                    </View>
                    <Text style={styles.driverName}>{ride.driverName}</Text>
                  </View>
                  <Text style={styles.ridePrice}>
                    {rideService.formatCurrency(ride.estimatedFare)}
                  </Text>
                </View>

                <View style={styles.rideRoute}>
                  <View style={styles.routePoint}>
                    <Icon name="radio-button-checked" size={12} color="#4CAF50" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.startLocationName}
                    </Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Icon name="location-on" size={12} color="#F44336" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.endLocationName}
                    </Text>
                  </View>
                </View>

                <View style={styles.rideDetails}>
                  <Text style={styles.rideTime}>
                    {rideService.formatDateTime(ride.scheduledDepartureTime)}
                  </Text>
                  <Text style={styles.availableSeats}>
                    {ride.availableSeats} chỗ trống
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animatable.View>
    );
  };

  const renderUserStats = () => {
    if (!user?.rider_profile) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={600} style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Thống kê của bạn</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="directions-car" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{user.rider_profile.total_rides || 0}</Text>
            <Text style={styles.statLabel}>Chuyến đi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="account-balance-wallet" size={24} color="#FF9800" />
            <Text style={styles.statValue}>
              {rideService.formatCurrency(user.rider_profile.total_spent || 0)}
            </Text>
            <Text style={styles.statLabel}>Đã chi tiêu</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="eco" size={24} color="#2196F3" />
            <Text style={styles.statValue}>
              {((user.rider_profile.total_rides || 0) * 2.5).toFixed(1)}kg
            </Text>
            <Text style={styles.statLabel}>CO₂ tiết kiệm</Text>
          </View>
        </View>
      </Animatable.View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.user?.full_name || 'Người dùng'}</Text>
              <Text style={styles.location}>
                {currentLocation ? '📍 Vị trí hiện tại' : '📍 Đang xác định vị trí...'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Nearby Rides (for riders) */}
        {user?.active_profile === 'rider' && renderNearbyRides()}

        {/* User Stats */}
        {renderUserStats()}

        {/* Safety Tips */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Icon name="security" size={24} color="#FF9800" />
            <Text style={styles.safetyTitle}>An toàn là ưu tiên hàng đầu</Text>
          </View>
          <Text style={styles.safetyText}>
            • Luôn đeo mũ bảo hiểm khi di chuyển{'\n'}
            • Chia sẻ thông tin chuyến đi với người thân{'\n'}
            • Sử dụng tính năng SOS khi cần thiết
          </Text>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  bookRideButton: {
    marginBottom: 20,
  },
  quickLocationTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  locationsList: {
    gap: 15,
  },
  quickLocationCard: {
    alignItems: 'center',
    width: 100,
  },
  locationGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationDistance: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  nearbyRidesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  ridesList: {
    gap: 15,
  },
  rideCard: {
    width: width * 0.7,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ridePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rideRoute: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    fontSize: 11,
    color: '#666',
  },
  availableSeats: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  safetyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  safetyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;