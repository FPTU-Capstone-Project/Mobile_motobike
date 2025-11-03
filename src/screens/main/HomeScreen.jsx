// src/screens/home/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

import GlassHeader from '../../components/ui/GlassHeader.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import AppBackground from '../../components/layout/AppBackground.jsx';
import { colors } from '../../theme/designTokens';

import ModernButton from '../../components/ModernButton.jsx';
import ActiveRideCard from '../../components/ActiveRideCard.jsx';

import locationService from '../../services/LocationService';
import rideService from '../../services/rideService';
import authService from '../../services/authService';
import permissionService from '../../services/permissionService';
import websocketService from '../../services/websocketService';
import fcmService from '../../services/fcmService';
import { locationStorageService } from '../../services/locationStorageService';

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    initializeHome();
    initializeRiderWebSocket();
  }, []);

  useEffect(() => {
    const loadCurrentUserName = async () => {
      try {
        const cachedUser = authService.getCurrentUser();
        if (cachedUser?.user?.full_name) {
          setCurrentUserName(cachedUser.user.full_name);
          return;
        }
        const profile = await authService.getCurrentUserProfile();
        if (profile?.user?.full_name) {
          setCurrentUserName(profile.user.full_name);
        }
      } catch (error) {
        console.log('Could not load current user name:', error);
      }
    };
    loadCurrentUserName();
  }, []);

  const initializeRiderWebSocket = async () => {
    try {
      try {
        await fcmService.initialize();
        await fcmService.registerToken();
      } catch (fcmError) {
        console.warn('FCM init failed, continue without push:', fcmError);
      }
      await websocketService.connectAsRider(handleRideMatchingUpdate, handleRiderNotification);
      setIsWebSocketConnected(true);
    } catch (error) {
      console.error('Failed to init rider WebSocket:', error);
      setIsWebSocketConnected(false);
    }
  };

  const handleRideMatchingUpdate = (data) => {
    switch (data.status) {
      case 'ACCEPTED':
        Alert.alert(
          'Chuyến đi được chấp nhận!',
          `Tài xế ${data.driverName || 'N/A'} đã chấp nhận chuyến đi của bạn.`,
          [{ text: 'Xem chi tiết', onPress: () => navigation.navigate('RideDetails', { rideId: data.rideId }) }],
        );
        break;
      case 'NO_MATCH':
        Alert.alert('Không tìm thấy tài xế', 'Không có tài xế nào chấp nhận. Vui lòng thử lại.', [{ text: 'OK' }]);
        break;
      case 'JOIN_REQUEST_FAILED':
        Alert.alert('Yêu cầu thất bại', data.reason || 'Không thể tham gia chuyến đi này.', [{ text: 'OK' }]);
        break;
      default:
        console.log('Unknown ride matching status:', data.status);
    }
  };

  const handleRiderNotification = (notification) => {
    console.log('Rider notification:', notification);
  };

  const initializeHome = async () => {
    try {
      setLoading(true);

      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Quyền vị trí
      const locationPermission = await permissionService.requestLocationPermission(true);
      if (locationPermission.granted) {
        const locationData = await locationStorageService.getCurrentLocationWithAddress();
        if (locationData.location) {
          setCurrentLocation(locationData.location);
        } else {
          const location = await locationService.getCurrentLocation();
          setCurrentLocation(location);
        }
      }

      // Tải danh sách chuyến gần bạn (nếu là rider)
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
      setNearbyRides([]);
    } finally {
      setLoadingRides(false);
    }
  };

  const handleBookRide = async () => {
    const locationPermission = await permissionService.requestLocationPermission(true);
    if (!locationPermission.granted) {
      Alert.alert(
        'Cần quyền truy cập vị trí',
        'Để đặt xe, ứng dụng cần biết vị trí hiện tại của bạn. Vui lòng cấp quyền truy cập vị trí.',
        [{ text: 'OK' }],
      );
      return;
    }
    navigation.navigate('RideBooking', {
      pickup: currentLocation,
      pickupAddress: 'Vị trí hiện tại',
    });
  };

  const renderNearbyRides = () => {
    if (!nearbyRides.length) return null;

    return (
      <Animatable.View animation="fadeInUp" duration={520} delay={80} useNativeDriver>
        <CleanCard style={styles.card} contentStyle={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Chuyến xe gần bạn</Text>
            <TouchableOpacity onPress={loadNearbyRides}>
              <Icon name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSubtitle}>Những chuyến đi chia sẻ đang mở quanh bạn</Text>

          {loadingRides ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
          ) : (
            nearbyRides.slice(0, 5).map((ride) => (
              <TouchableOpacity
                key={ride.rideId}
                style={styles.rideRow}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('RideDetails', { rideId: ride.rideId })}
              >
                <View style={styles.rideDriver}>
                  <View style={styles.driverAvatar}>
                    <Icon name="person" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.driverName}>{ride.driverName || 'Tài xế'}</Text>
                    <View style={styles.driverMeta}>
                      <Icon name="star" size={14} color="#FBBF24" />
                      <Text style={styles.driverMetaText}>
                        {(ride.driverRating || 4.8).toFixed(1)} • {ride.availableSeats} chỗ trống
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rideInfo}>
                  <Text style={styles.routeText} numberOfLines={1}>
                    {ride.startLocationName} → {ride.endLocationName}
                  </Text>
                  <Text style={styles.rideMeta}>{rideService.formatDateTime(ride.scheduledDepartureTime)}</Text>
                </View>

                <Text style={styles.ridePrice}>{rideService.formatCurrency(ride.estimatedFare)}</Text>
              </TouchableOpacity>
            ))
          )}
        </CleanCard>
      </Animatable.View>
    );
  };

  const renderUserStats = () => {
    if (!user?.rider_profile) return null;
    return (
      <Animatable.View animation="fadeInUp" duration={540} delay={140} useNativeDriver>
        <CleanCard style={styles.card} contentStyle={styles.cardBody}>
          <Text style={styles.cardTitle}>Thống kê của bạn</Text>
          <Text style={styles.cardSubtitle}>Theo dõi hiệu quả sử dụng chia sẻ xe</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Icon name="directions-car" size={22} color={colors.primary} />
              <Text style={styles.statValue}>{user.rider_profile.total_rides || 0}</Text>
              <Text style={styles.statLabel}>Chuyến đi</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="account-balance-wallet" size={22} color="#FB923C" />
              <Text style={styles.statValue}>{rideService.formatCurrency(user.rider_profile.total_spent || 0)}</Text>
              <Text style={styles.statLabel}>Đã chi tiêu</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="eco" size={22} color="#38BDF8" />
              <Text style={styles.statValue}>{((user.rider_profile.total_rides || 0) * 2.5).toFixed(1)}kg</Text>
              <Text style={styles.statLabel}>CO₂ tiết kiệm</Text>
            </View>
          </View>
        </CleanCard>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <AppBackground>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSpacing}>
            <GlassHeader
              title={currentUserName || 'Người dùng'}
              subtitle="Xin chào,"
              onBellPress={() => {}}
              statusChip={{
                label: isWebSocketConnected ? 'Đã kết nối máy chủ' : 'Đang ngoại tuyến',
                color: isWebSocketConnected ? 'success' : 'warning',
              }}
            />
          </View>

          <View style={styles.content}>
            {/* CTA đặt xe đơn giản */}
            <Animatable.View animation="fadeInUp" duration={420} useNativeDriver>
              <CleanCard style={styles.card} contentStyle={[styles.cardBody, styles.ctaCard]}>
                <View style={styles.ctaTextContainer}>
                  <Text style={styles.cardTitle}>Đặt xe</Text>
                  <Text style={styles.cardSubtitle}>Bấm để chuyển đến trang đặt xe</Text>
                </View>
                <View style={styles.ctaButtonContainer}>
                <ModernButton title="Đặt xe ngay" icon="directions-car" onPress={handleBookRide} />
                </View>
              </CleanCard>
            </Animatable.View>

            {/* Thẻ chuyến đang hoạt động */}
            <Animatable.View animation="fadeInUp" duration={480} delay={60} useNativeDriver>
              <ActiveRideCard navigation={navigation} />
            </Animatable.View>

            {renderNearbyRides()}
            {renderUserStats()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { 
    paddingBottom: 160,
    paddingTop: 24,
  },
  headerSpacing: {
    marginBottom: 24,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 20,
  },
  card: { marginBottom: 12 },
  cardBody: { padding: 20, gap: 18 },
  ctaCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: 12,
  },
  ctaTextContainer: { 
    flex: 1, 
    flexShrink: 1,
    gap: 6,
    marginRight: 12,
  },
  ctaButtonContainer: {
    flexShrink: 0,
  },
  cardTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: -8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: colors.textSecondary },

  // nearby rides
  loadingIndicator: { marginVertical: 14 },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.16)',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rideDriver: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '35%' },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverMetaText: { fontSize: 12, color: colors.textSecondary },
  rideInfo: { width: '45%', gap: 4 },
  routeText: { fontSize: 14, color: colors.textPrimary },
  rideMeta: { fontSize: 12, color: colors.textSecondary },
  ridePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },

  // stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 13, color: colors.textSecondary },
});

export default HomeScreen;
