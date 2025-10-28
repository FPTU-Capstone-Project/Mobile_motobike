import React, { useState, useEffect, useMemo } from 'react';
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
import LocationCard from '../../components/LocationCard.jsx';
import ModeSelector from '../../components/ModeSelector.jsx';
import ActiveRideCard from '../../components/ActiveRideCard.jsx';

import locationService from '../../services/locationService';
import rideService from '../../services/rideService';
import authService from '../../services/authService';
import poiService from '../../services/poiService';
import verificationService from '../../services/verificationService';
import { locationStorageService } from '../../services/locationStorageService';
import permissionService from '../../services/permissionService';
import websocketService from '../../services/websocketService';
import fcmService from '../../services/fcmService';

const HomeScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [presetLocations, setPresetLocations] = useState([]);

  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [userMode, setUserMode] = useState('auto');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showDrivers, setShowDrivers] = useState(false);
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkVerificationStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const initializeRiderWebSocket = async () => {
    try {
      try {
        await fcmService.initialize();
        await fcmService.registerToken();
      } catch (fcmError) {
        console.warn('FCM initialization failed, continuing without push notifications:', fcmError);
      }

      await websocketService.connectAsRider(handleRideMatchingUpdate, handleRiderNotification);
      setIsWebSocketConnected(true);
    } catch (error) {
      console.error('Failed to initialize rider WebSocket:', error);
      setIsWebSocketConnected(false);
    }
  };

  const handleRideMatchingUpdate = (data) => {
    switch (data.status) {
      case 'ACCEPTED':
        Alert.alert(
          'Chuyến đi được chấp nhận!',
          `Tài xế ${data.driverName || 'N/A'} đã chấp nhận chuyến đi của bạn.`,
          [
            {
              text: 'Xem chi tiết',
              onPress: () => navigation.navigate('RideDetails', { rideId: data.rideId }),
            },
          ],
        );
        break;
      case 'NO_MATCH':
        Alert.alert(
          'Không tìm thấy tài xế',
          'Không có tài xế nào chấp nhận chuyến đi của bạn. Vui lòng thử lại.',
          [{ text: 'OK' }],
        );
        break;
      case 'JOIN_REQUEST_FAILED':
        Alert.alert(
          'Yêu cầu tham gia thất bại',
          data.reason || 'Không thể tham gia chuyến đi này.',
          [{ text: 'OK' }],
        );
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

      if (currentUser?.active_profile === 'rider') {
        await Promise.all([loadNearbyRides(), loadPresetLocations(), checkVerificationStatus()]);
      } else {
        await checkVerificationStatus();
      }
    } catch (error) {
      console.error('Error initializing home:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      if (authService.isRider()) {
        const verification = await verificationService.getCurrentStudentVerification();
        const needsVerification =
          !verification ||
          (verification.status?.toLowerCase() !== 'active' &&
            verification.status?.toLowerCase() !== 'verified' &&
            verification.status?.toLowerCase() !== 'approved');

        if (needsVerification) {
          Alert.alert(
            'Cần xác minh tài khoản',
            'Để sử dụng dịch vụ đặt xe, bạn cần xác minh là sinh viên của trường.',
            [
              { text: 'Để sau', style: 'cancel' },
              {
                text: 'Xác minh ngay',
                onPress: () => {
                  navigation.navigate('ProfileSwitch');
                },
              },
            ],
          );
        }
      }
    } catch (error) {
      console.log('Could not check verification status:', error);
      if (authService.isRider() && authService.needsRiderVerification()) {
        Alert.alert(
          'Cần xác minh tài khoản',
          'Để sử dụng dịch vụ đặt xe, bạn cần xác minh là sinh viên của trường.',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Xác minh ngay',
              onPress: () => navigation.navigate('ProfileSwitch'),
            },
          ],
        );
      }
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

  const loadPresetLocations = async () => {
    try {
      const locations = await poiService.getPresetLocations();

      const transformedLocations = locations.map((poi) => ({
        id: poi.locationId,
        locationId: poi.locationId,
        name: poi.name,
        coordinates: {
          latitude: poi.latitude,
          longitude: poi.longitude,
          lat: poi.latitude,
          lng: poi.longitude,
        },
        icon: 'location-on',
        gradient: ['#4CAF50', '#2E7D32'],
        isPOI: true,
        isAdminDefined: poi.isAdminDefined,
      }));

      setPresetLocations(transformedLocations);
    } catch (error) {
      console.error('Error loading preset locations:', error);
      setPresetLocations([]);
    }
  };

  const handleLocationSelect = (location, type) => {
    if (type === 'pickup') {
      setSelectedPickup(location);
    } else {
      setSelectedDropoff(location);
    }
    setShowDrivers(false);
  };

  const handleFindRide = async () => {
    try {
      if (authService.isRider()) {
        const verification = await verificationService.getCurrentStudentVerification();
        const needsVerification =
          !verification ||
          (verification.status?.toLowerCase() !== 'active' &&
            verification.status?.toLowerCase() !== 'verified' &&
            verification.status?.toLowerCase() !== 'approved');

        if (needsVerification) {
          Alert.alert(
            'Cần xác minh tài khoản',
            'Bạn cần xác minh là sinh viên để sử dụng dịch vụ đặt xe.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xác minh ngay', onPress: () => navigation.navigate('ProfileSwitch') },
            ],
          );
          return;
        }
      }
    } catch (error) {
      console.log('Could not check verification status:', error);
      if (authService.isRider() && authService.needsRiderVerification()) {
        Alert.alert(
          'Cần xác minh tài khoản',
          'Bạn cần xác minh là sinh viên để sử dụng dịch vụ đặt xe.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xác minh ngay', onPress: () => navigation.navigate('ProfileSwitch') },
          ],
        );
        return;
      }
    }

    if (!selectedPickup || !selectedDropoff) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn điểm đón và điểm đến');
      return;
    }

    if (selectedPickup.id === selectedDropoff.id) {
      Alert.alert('Lỗi', 'Điểm đón và điểm đến không thể giống nhau');
      return;
    }

    if (userMode === 'manual') {
      const filteredDrivers = derivedDrivers.filter(
        (driver) =>
          driver.startLocationId === selectedPickup.id ||
          driver.endLocationId === selectedDropoff.id,
      );
      setAvailableDrivers(filteredDrivers);
      setShowDrivers(true);
    } else {
      await handleBookRide();
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
      dropoff: selectedDropoff
        ? {
            latitude: selectedDropoff.coordinates?.latitude || selectedDropoff.coordinates?.lat,
            longitude: selectedDropoff.coordinates?.longitude || selectedDropoff.coordinates?.lng,
            ...selectedDropoff,
          }
        : undefined,
      pickupAddress: 'Vị trí hiện tại',
      dropoffAddress: selectedDropoff?.name,
    });
  };

  const handleDriverSelect = (driver) => {
    Alert.alert(
      'Gửi yêu cầu',
      `Bạn muốn gửi yêu cầu cho ${driver.name}?\nĐánh giá: ${driver.rating}⭐\nKhoảng cách: ${driver.distance}km`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi yêu cầu',
          onPress: () => {
            setShowDrivers(false);
            Alert.alert('Đã gửi!', 'Yêu cầu đã được gửi đến tài xế');
          },
        },
      ],
    );
  };

  const derivedDrivers = useMemo(
    () =>
      nearbyRides.map((ride) => ({
        id: ride.rideId,
        name: ride.driverName || 'Tài xế',
        rating: ride.driverRating || 4.8,
        distance: ride.distance || 0,
        startLocationId: ride.startLocationId,
        endLocationId: ride.endLocationId,
        pickupLocation: ride.startLocationName,
        dropoffLocation: ride.endLocationName,
        estimatedFare: ride.estimatedFare,
        availableSeats: ride.availableSeats,
        estimatedTime: ride.estimatedDuration,
        isShared: true,
      })),
    [nearbyRides],
  );

  const renderNearbyRides = () => {
    if (!nearbyRides.length) {
      return null;
    }

    return (
      <Animatable.View animation="fadeInUp" duration={520} delay={80} useNativeDriver>
        <CleanCard style={styles.card} contentStyle={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Chuyến xe gần bạn</Text>
            <TouchableOpacity onPress={loadNearbyRides}>
              <Icon name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSubtitle}>
            Những chuyến đi chia sẻ đang mở gần vị trí hiện tại của bạn
          </Text>
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
                  <Text style={styles.rideMeta}>
                    {rideService.formatDateTime(ride.scheduledDepartureTime)}
                  </Text>
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
    if (!user?.rider_profile) {
      return null;
    }

    return (
      <Animatable.View animation="fadeInUp" duration={540} delay={140} useNativeDriver>
        <CleanCard style={styles.card} contentStyle={styles.cardBody}>
          <Text style={styles.cardTitle}>Thống kê của bạn</Text>
          <Text style={styles.cardSubtitle}>Theo dõi hiệu quả sử dụng dịch vụ chia sẻ xe</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Icon name="directions-car" size={22} color={colors.primary} />
              <Text style={styles.statValue}>{user.rider_profile.total_rides || 0}</Text>
              <Text style={styles.statLabel}>Chuyến đi</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="account-balance-wallet" size={22} color="#FB923C" />
              <Text style={styles.statValue}>
                {rideService.formatCurrency(user.rider_profile.total_spent || 0)}
              </Text>
              <Text style={styles.statLabel}>Đã chi tiêu</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="eco" size={22} color="#38BDF8" />
              <Text style={styles.statValue}>
                {((user.rider_profile.total_rides || 0) * 2.5).toFixed(1)}kg
              </Text>
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
          <GlassHeader
            title={currentUserName || 'Người dùng'}
            subtitle="Xin chào,"
            onBellPress={() => {}}
            statusChip={{
              label: isWebSocketConnected ? 'Đã kết nối máy chủ' : 'Đang ngoại tuyến',
              color: isWebSocketConnected ? 'success' : 'warning',
            }}
          />

          <View style={styles.content}>
            <Animatable.View animation="fadeInUp" duration={420} useNativeDriver>
              <CleanCard style={styles.card} contentStyle={styles.cardBody}>
                <Text style={styles.cardTitle}>Chế độ đặt chuyến</Text>
                <Text style={styles.cardSubtitle}>
                  Chọn cách tìm xe phù hợp với nhu cầu của bạn
                </Text>
                <ModeSelector mode={userMode} onModeChange={setUserMode} userType="user" />
              </CleanCard>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" duration={440} delay={40} useNativeDriver>
              <CleanCard style={styles.card} contentStyle={styles.cardBody}>
                <Text style={styles.cardTitle}>Lộ trình của bạn</Text>
                <Text style={styles.cardSubtitle}>
                  Chọn nhanh các điểm đến phổ biến quanh khuôn viên
                </Text>

                <View style={styles.plannerSection}>
                  <View style={styles.sectionHeadingRow}>
                    <View style={styles.headingDot} />
                    <Text style={styles.sectionHeading}>Điểm đón</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.locationList}
                  >
                    {presetLocations.map((location) => (
                      <View key={`pickup-${location.id}`} style={styles.locationItem}>
                        <LocationCard
                          location={location}
                          selected={selectedPickup?.id === location.id}
                          onPress={() => handleLocationSelect(location, 'pickup')}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.plannerSection}>
                  <View style={styles.sectionHeadingRow}>
                    <View style={[styles.headingDot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.sectionHeading}>Điểm đến</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.locationList}
                  >
                    {presetLocations.map((location) => (
                      <View key={`dropoff-${location.id}`} style={styles.locationItem}>
                        <LocationCard
                          location={location}
                          selected={selectedDropoff?.id === location.id}
                          onPress={() => handleLocationSelect(location, 'dropoff')}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </CleanCard>
            </Animatable.View>

            {selectedPickup && selectedDropoff && (
              <Animatable.View animation="fadeInUp" delay={60} useNativeDriver>
                <CleanCard style={styles.card} contentStyle={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>Tuyến đường của bạn</Text>
                      <Text style={styles.cardSubtitle}>Kiểm tra lại trước khi gửi yêu cầu</Text>
                    </View>
                    <View style={[styles.cardBadge, { backgroundColor: 'rgba(59,130,246,0.22)' }]}>
                      <Icon name="timeline" size={18} color={colors.accent} />
                    </View>
                  </View>
                  <View style={styles.routePreview}>
                    <View style={styles.routePointRow}>
                      <View style={styles.pickupIndicator} />
                      <Text style={styles.routePreviewText}>{selectedPickup.name}</Text>
                    </View>
                    <View style={styles.previewConnector} />
                    <View style={styles.routePointRow}>
                      <View style={styles.dropoffIndicator} />
                      <Text style={styles.routePreviewText}>{selectedDropoff.name}</Text>
                    </View>
                  </View>
                </CleanCard>
              </Animatable.View>
            )}

            <Animatable.View animation="fadeInUp" delay={80} useNativeDriver>
              <CleanCard style={styles.card} contentStyle={styles.ctaCard}>
                <View style={{ gap: 6 }}>
                  <Text style={styles.cardTitle}>Sẵn sàng đặt xe</Text>
                  <Text style={styles.cardSubtitle}>
                    {userMode === 'manual'
                      ? 'Chọn một tài xế phù hợp hoặc chuyển sang chế độ tự động.'
                      : 'Hệ thống sẽ tìm tài xế tốt nhất cho hành trình của bạn.'}
                  </Text>
                </View>
                <ModernButton
                  title={userMode === 'manual' ? 'Tìm tài xế xung quanh' : 'Tìm xe tự động'}
                  onPress={handleFindRide}
                  icon={userMode === 'manual' ? 'search' : 'auto-fix-high'}
                />
              </CleanCard>
            </Animatable.View>

            {showDrivers && userMode === 'manual' && (
              <Animatable.View animation="slideInUp" style={styles.card}>
                <CleanCard contentStyle={styles.cardBody}>
                  <Text style={styles.cardTitle}>Tài xế có sẵn</Text>
                  <Text style={styles.cardSubtitle}>Chọn tài xế phù hợp nhất với bạn</Text>
                  {availableDrivers.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="search-off" size={48} color="rgba(148,163,184,0.45)" />
                      <Text style={styles.noDriversText}>Không có tài xế nào phù hợp</Text>
                      <ModernButton
                        title="Thử chế độ tự động"
                        variant="outline"
                        onPress={() => {
                          setUserMode('auto');
                          setShowDrivers(false);
                        }}
                      />
                    </View>
                  ) : (
                    availableDrivers.map((driver) => (
                      <TouchableOpacity
                        key={driver.id}
                        style={styles.driverCard}
                        activeOpacity={0.88}
                        onPress={() => handleDriverSelect(driver)}
                      >
                        <CleanCard contentStyle={styles.driverCardContent}>
                          <View style={styles.driverInfoRow}>
                            <View style={styles.driverAvatar}>
                              <Icon name="person" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.driverDetails}>
                              <Text style={styles.driverName}>{driver.name}</Text>
                              <View style={styles.driverStats}>
                                <Icon name="star" size={14} color="#FBBF24" />
                                <Text style={styles.driverStatsText}>{driver.rating}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.driverStatsText}>
                                  {driver.availableSeats || 1} chỗ
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.driverRoute}>
                            {driver.pickupLocation} → {driver.dropoffLocation}
                          </Text>
                          <View style={styles.driverMetaRow}>
                            <Text style={styles.driverMetaItem}>
                              <Icon name="straighten" size={14} color="#94A3B8" /> {driver.distance || 0} km
                            </Text>
                            <Text style={styles.driverMetaItem}>
                              <Icon name="watch-later" size={14} color="#94A3B8" />{' '}
                              {driver.estimatedTime || 0} phút
                            </Text>
                            <Text style={[styles.driverMetaItem, styles.driverFare]}>
                              {driver.estimatedFare
                                ? `${driver.estimatedFare.toLocaleString()} đ`
                                : '---'}
                            </Text>
                          </View>
                        </CleanCard>
                      </TouchableOpacity>
                    ))
                  )}
                </CleanCard>
              </Animatable.View>
            )}

            <Animatable.View animation="fadeInUp" duration={480} delay={100} useNativeDriver>
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
  scrollContent: { paddingBottom: 160 },
  content: {
    paddingTop: 8,
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    marginBottom: 12,
  },
  cardBody: {
    padding: 20,
    gap: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -8,
  },
  plannerSection: {
    gap: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationList: {
    gap: 12,
    paddingVertical: 4,
  },
  locationItem: {
    marginRight: 12,
  },
  cardBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routePreview: {
    gap: 14,
    marginTop: 12,
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickupIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  dropoffIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  routePreviewText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  previewConnector: {
    height: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5F5',
    marginLeft: 5,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  noDriversText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  driverCard: {
    marginBottom: 16,
  },
  driverCardContent: {
    padding: 18,
    gap: 12,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverDetails: {
    gap: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverStatsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5F5',
  },
  driverRoute: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  driverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverMetaItem: {
    fontSize: 13,
    color: '#64748b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverFare: {
    fontWeight: '600',
    color: colors.primary,
  },
  loadingIndicator: {
    marginVertical: 14,
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.16)',
  },
  rideDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '35%',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rideInfo: {
    width: '45%',
    gap: 4,
  },
  routeText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  rideMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ridePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});

export default HomeScreen;

