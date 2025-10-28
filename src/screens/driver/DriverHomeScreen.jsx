import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import ModeSelector from '../../components/ModeSelector.jsx';
import RideOfferModal from '../../components/RideOfferModal';

import websocketService from '../../services/websocketService';
import fcmService from '../../services/fcmService';
import authService from '../../services/authService';
import vehicleService from '../../services/vehicleService';
import { locationStorageService } from '../../services/locationStorageService';
import { locationTrackingService } from '../../services/locationTrackingService';

const DriverHomeScreen = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [allowSharing, setAllowSharing] = useState(true);
  const [driverMode, setDriverMode] = useState('manual');
  const [currentRide, setCurrentRide] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const [currentOffer, setCurrentOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerCountdown, setOfferCountdown] = useState(0);
  const [vehicleId, setVehicleId] = useState(null);

  const countdownInterval = useRef(null);

  useEffect(() => {
    initializeDriver();

    return () => {
      websocketService.disconnect();
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const initializeDriver = async () => {
    try {
      setLoading(true);

      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      const locationData = await locationStorageService.getCurrentLocationWithAddress();
      if (locationData.location) {
        setCurrentLocation(locationData.location);
      }

      await loadVehicles();

      try {
        await fcmService.initialize();
        await fcmService.registerToken();
      } catch (fcmError) {
        console.warn('FCM initialization failed, continuing without push notifications:', fcmError);
      }
    } catch (error) {
      console.error('Error initializing driver:', error);
      Alert.alert('Lỗi', 'Không thể khởi tạo ứng dụng tài xế');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await vehicleService.getDriverVehicles({
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });

      if (response?.data) {
        const formattedVehicles = vehicleService.formatVehicles(response.data);
        if (formattedVehicles.length > 0) {
          const firstVehicle = formattedVehicles[0];
          setVehicleId(firstVehicle.id || firstVehicle.vehicleId);
        }
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const handleRideOffer = (offer) => {
    if (offer.type === 'TRACKING_START') {
      handleTrackingStart(offer);
      return;
    }

    setCurrentOffer(offer);
    setShowOfferModal(true);

    if (offer.offerExpiresAt) {
      const expiresAt = new Date(offer.offerExpiresAt).getTime();
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));

      setOfferCountdown(timeLeft);

      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }

      countdownInterval.current = setInterval(() => {
        setOfferCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            setCurrentOffer(null);
            setShowOfferModal(false);
            Alert.alert('Hết thời gian', 'Yêu cầu đã hết thời gian chờ');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleNotification = (notification) => {
    if (notification.message) {
      Alert.alert('Thông báo', notification.message);
    }
  };

  const handleTrackingStart = async (trackingSignal) => {
    try {
      await locationTrackingService.startTracking(trackingSignal.rideId);
      Alert.alert(
        'Bắt đầu theo dõi',
        'Chuyến đi đã bắt đầu. Hệ thống đang theo dõi vị trí của bạn.',
        [
          {
            text: 'Xem chuyến đi',
            onPress: () => {
              navigation.navigate('DriverRideTracking', {
                rideId: trackingSignal.rideId,
                startTracking: true,
              });
            },
          },
          { text: 'OK', style: 'cancel' },
        ],
      );
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert(
        'Lỗi',
        'Không thể bắt đầu theo dõi GPS. Vui lòng kiểm tra quyền truy cập vị trí.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleToggleOnline = async (value) => {
    if (value && !currentLocation) {
      Alert.alert('Cần vị trí', 'Vui lòng bật GPS để có thể nhận chuyến đi', [{ text: 'OK' }]);
      return;
    }

    try {
      if (value) {
        setConnectionStatus('connecting');

        await websocketService.connectAsDriver(handleRideOffer, handleNotification);

        setConnectionStatus('connected');
        console.log('Driver is now online and ready for broadcast offers');
      } else {
        setConnectionStatus('disconnecting');
        websocketService.disconnect();
        setConnectionStatus('disconnected');
        console.log('Driver is now offline');
      }

      setIsOnline(value);
    } catch (error) {
      console.error('Error toggling online status:', error);
      setConnectionStatus('error');
      Alert.alert(
        'Lỗi kết nối',
        `Không thể ${value ? 'kết nối' : 'ngắt kết nối'}: ${error.message}`,
        [{ text: 'OK' }],
      );

      if (value) {
        setIsOnline(false);
      }
    }
  };

  const handleOfferResponse = (accepted, reason = null) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    if (accepted && currentOffer) {
      setCurrentRide({
        riderName: currentOffer.riderName || currentOffer.passengerName,
        pickupLocation: currentOffer.pickupAddress || currentOffer.pickupLocation?.name,
        dropoffLocation: currentOffer.dropoffAddress || currentOffer.dropoffLocation?.name,
        estimatedFare: currentOffer.estimatedFare,
      });
    }

    setShowOfferModal(false);
    setCurrentOffer(null);
    setOfferCountdown(0);
  };

  useEffect(() => {
    if (!isOnline) {
      setCurrentRide(null);
    }
  }, [isOnline]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Đã kết nối';
      case 'connecting':
        return 'Đang kết nối...';
      case 'error':
        return 'Lỗi kết nối';
      case 'disconnecting':
        return 'Đang ngắt kết nối...';
      default:
        return 'Chưa kết nối';
    }
  };

  const todayStats = useMemo(() => {
    const driverStats = user?.driver_profile || {};
    return {
      earnings: driverStats.today_earnings ?? 0,
      rides: driverStats.today_rides ?? 0,
      hours: driverStats.hours_online ?? 0,
      rating: driverStats.rating_avg ?? driverStats.rating ?? 5,
    };
  }, [user]);

  const pendingRequests = useMemo(() => {
    if (!currentOffer) {
      return [];
    }

    return [
      {
        id: currentOffer.rideRequestId || currentOffer.rideId || Date.now(),
        riderName: currentOffer.riderName || currentOffer.passengerName || 'Khách hàng',
        riderRating: currentOffer.riderRating || 4.5,
        pickupLocation: currentOffer.pickupAddress || currentOffer.pickupLocation?.name || 'Điểm đón',
        dropoffLocation:
          currentOffer.dropoffAddress || currentOffer.dropoffLocation?.name || 'Điểm đến',
        distance: currentOffer.distance || 0,
        estimatedFare: currentOffer.estimatedFare || 0,
        estimatedTime: currentOffer.estimatedTime || 0,
        requestTime: 'Vừa nhận',
        isShared: currentOffer.isShared,
      },
    ];
  }, [currentOffer]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang khởi tạo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#10412F', '#000000']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.driverInfo}>
              <Text style={styles.greeting}>Xin chào tài xế,</Text>
              <Text style={styles.driverName}>{user?.user?.full_name || 'Tài xế'}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}
                />
                <Text style={styles.statusText}>{isOnline ? 'Đang online' : 'Offline'}</Text>
              </View>
              <View style={styles.connectionBadge}>
                <Icon name="wifi" size={16} color={getConnectionStatusColor()} />
                <Text style={[styles.connectionText, { color: getConnectionStatusColor() }]}>
                  {getConnectionStatusText()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('SOSAlert')}
            >
              <Icon name="emergency" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.cardTitle}>Trạng thái hoạt động</Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#ddd', true: '#4CAF50' }}
                thumbColor={isOnline ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingLabel}>Cho phép chia sẻ chuyến đi</Text>
              <Switch
                value={allowSharing}
                onValueChange={setAllowSharing}
                trackColor={{ false: '#ddd', true: '#4CAF50' }}
                thumbColor={allowSharing ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {isOnline && (
            <ModeSelector mode={driverMode} onModeChange={setDriverMode} userType="driver" />
          )}

          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Thống kê hôm nay</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient colors={['#10412F', '#000000']} style={styles.statIcon}>
                  <Icon name="attach-money" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.earnings.toLocaleString()}đ</Text>
                <Text style={styles.statLabel}>Thu nhập</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.statIcon}>
                  <Icon name="directions-car" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.rides}</Text>
                <Text style={styles.statLabel}>Chuyến đi</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.statIcon}>
                  <Icon name="schedule" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.hours}h</Text>
                <Text style={styles.statLabel}>Giờ hoạt động</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.statIcon}>
                  <Icon name="star" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.rating?.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
            </View>
          </View>

          {isOnline && pendingRequests.length > 0 && (
            <Animatable.View animation="slideInUp" style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Yêu cầu mới</Text>
                <View style={styles.cardBadge}>
                  <Icon name="notifications-active" size={18} color="#fff" />
                </View>
              </View>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.riderInfo}>
                      <Text style={styles.riderName}>{request.riderName}</Text>
                      <View style={styles.riderRating}>
                        <Icon name="star" size={14} color="#FF9800" />
                        <Text style={styles.ratingText}>{request.riderRating}</Text>
                      </View>
                    </View>
                    <Text style={styles.requestTime}>{request.requestTime}</Text>
                  </View>

                  <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                      <View style={styles.pickupDot} />
                      <Text style={styles.locationText}>{request.pickupLocation}</Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <View style={styles.dropoffDot} />
                      <Text style={styles.locationText}>{request.dropoffLocation}</Text>
                    </View>
                  </View>

                  <View style={styles.requestDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="straighten" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {request.distance ? `${request.distance} km` : '---'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="schedule" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {request.estimatedTime ? `${request.estimatedTime} phút` : '---'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="attach-money" size={16} color="#4CAF50" />
                      <Text style={[styles.detailText, styles.detailHighlight]}>
                        {request.estimatedFare
                          ? `${request.estimatedFare.toLocaleString()} đ`
                          : 'Đang tính'}
                      </Text>
                    </View>
                    {request.isShared && (
                      <View style={styles.sharedBadge}>
                        <Text style={styles.sharedText}>Chia sẻ</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.requestActions}>
                    <ModernButton
                      title="Từ chối"
                      variant="outline"
                      size="small"
                      onPress={() => handleOfferResponse(false)}
                    />
                    <ModernButton
                      title="Nhận chuyến"
                      size="small"
                      onPress={() => handleOfferResponse(true)}
                    />
                  </View>
                </View>
              ))}
            </Animatable.View>
          )}

          {currentRide && (
            <Animatable.View animation="fadeInUp" style={styles.activeRideCard}>
              <View style={styles.activeRideHeader}>
                <View style={styles.activeRideIndicator} />
                <Text style={styles.activeRideTitle}>Đang thực hiện chuyến đi</Text>
              </View>
              <Text style={styles.riderName}>{currentRide.riderName}</Text>
              <View style={styles.activeRideRoute}>
                <Icon name="radio-button-checked" size={16} color="#4CAF50" />
                <Text style={styles.activeRideText}>{currentRide.pickupLocation}</Text>
              </View>
              <View style={styles.activeRideRoute}>
                <Icon name="location-on" size={16} color="#F44336" />
                <Text style={styles.activeRideText}>{currentRide.dropoffLocation}</Text>
              </View>
              <View style={styles.activeRideActions}>
                <ModernButton
                  title="Liên hệ khách"
                  variant="outline"
                  size="small"
                  icon="phone"
                  onPress={() => Alert.alert('Liên hệ', 'Đang gọi khách hàng...')}
                />
                <ModernButton
                  title="Hoàn thành"
                  size="small"
                  icon="check"
                  onPress={() => {
                    setCurrentRide(null);
                    Alert.alert('Hoàn thành', 'Chuyến đi đã hoàn thành!');
                  }}
                />
              </View>
            </Animatable.View>
          )}

          <Animatable.View animation="fadeInUp" delay={60} style={styles.quickActions}>
            <Text style={styles.cardTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                onPress={() => navigation.navigate('RideHistory')}
                style={styles.actionItem}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                  <Icon name="history" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>Lịch sử</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('DriverEarnings')}
                style={styles.actionItem}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                  <Icon name="account-balance-wallet" size={22} color="#16A34A" />
                </View>
                <Text style={styles.actionText}>Thu nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('VehicleManagement')}
                style={styles.actionItem}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                  <Icon name="two-wheeler" size={22} color="#F97316" />
                </View>
                <Text style={styles.actionText}>Phương tiện</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('DriverDashboard')}
                style={styles.actionItem}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(148,163,184,0.18)' }]}>
                  <Icon name="insights" size={22} color="#475569" />
                </View>
                <Text style={styles.actionText}>Bảng điều khiển</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>

      {showOfferModal && currentOffer && (
        <RideOfferModal
          visible={showOfferModal}
          offer={currentOffer}
          countdown={offerCountdown}
          onAccept={() => handleOfferResponse(true)}
          onReject={(reason) => handleOfferResponse(false, reason)}
          onClose={() => handleOfferResponse(false)}
          vehicleId={vehicleId}
          navigation={navigation}
          currentLocation={currentLocation}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1C16',
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
    color: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    gap: 6,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  driverName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  connectionBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#f5f7f9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -18,
    padding: 20,
    gap: 18,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  requestCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  requestTime: {
    fontSize: 12,
    color: '#64748b',
  },
  routeContainer: {
    gap: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  locationText: {
    fontSize: 14,
    color: '#1f2937',
  },
  routeLine: {
    height: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
    marginLeft: 4.5,
  },
  requestDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4b5563',
  },
  detailHighlight: {
    color: '#16A34A',
    fontWeight: '600',
  },
  sharedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  sharedText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeRideCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  activeRideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeRideIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  activeRideTitle: {
    fontSize: 14,
    color: '#CBD5F5',
    letterSpacing: 0.3,
  },
  activeRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeRideText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  activeRideActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActions: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  actionItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
});

export default DriverHomeScreen;

