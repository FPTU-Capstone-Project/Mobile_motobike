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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import GlassHeader from '../../components/ui/GlassHeader.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import AppBackground from '../../components/layout/AppBackground.jsx';
import { colors } from '../../theme/designTokens';

import mockData from '../../data/mockData.json';
import ModernButton from '../../components/ModernButton.jsx';
import LocationCard from '../../components/LocationCard.jsx';
import ModeSelector from '../../components/ModeSelector.jsx';
import authService from '../../services/authService';
import verificationService from '../../services/verificationService';

const HomeScreen = ({ navigation }) => {
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [userMode, setUserMode] = useState('auto');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [showDrivers, setShowDrivers] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  const presetLocations = mockData.presetLocations;
  const drivers = mockData.availableDrivers;

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

  // Check verification status when component mounts
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Refresh verification status when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkVerificationStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const checkVerificationStatus = async () => {
    try {
      // Only check for rider verification, not driver
      if (authService.isRider()) {
        // Refresh verification status from API
        const verification = await verificationService.getCurrentStudentVerification();
        console.log('Current verification status:', verification);
        
        // Check if needs verification based on latest data
        const needsVerification = !verification || 
          (verification.status?.toLowerCase() !== 'active' && 
           verification.status?.toLowerCase() !== 'verified' && 
           verification.status?.toLowerCase() !== 'approved');
        
        if (needsVerification) {
          Alert.alert(
            'Cần xác minh tài khoản',
            'Để sử dụng dịch vụ đặt xe, bạn cần xác minh là sinh viên của trường.',
            [
              { 
                text: 'Để sau', 
                style: 'cancel',
                onPress: () => {
                  // User can continue using the app but with limited features
                  console.log('User chose to verify later');
                }
              },
              { 
                text: 'Xác minh ngay', 
                onPress: () => {
                  navigation.navigate('ProfileSwitch');
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.log('Could not check verification status:', error);
      // Fallback to cached data
      if (authService.isRider() && authService.needsRiderVerification()) {
        Alert.alert(
          'Cần xác minh tài khoản',
          'Để sử dụng dịch vụ đặt xe, bạn cần xác minh là sinh viên của trường.',
          [
            { 
              text: 'Để sau', 
              style: 'cancel',
              onPress: () => {
                console.log('User chose to verify later');
              }
            },
            { 
              text: 'Xác minh ngay', 
              onPress: () => {
                navigation.navigate('ProfileSwitch');
              }
            }
          ]
        );
      }
    }
  };

  const handleLocationSelect = (location, type) => {
    if (type === 'pickup') {
      setSelectedPickup(location);
    } else {
      setSelectedDropoff(location);
    }
  };

  const handleFindRide = async () => {
    // Check if user needs verification before allowing ride booking
    try {
      if (authService.isRider()) {
        // Check verification status from API
        const verification = await verificationService.getCurrentStudentVerification();
        const needsVerification = !verification || 
          (verification.status?.toLowerCase() !== 'active' && 
           verification.status?.toLowerCase() !== 'verified' && 
           verification.status?.toLowerCase() !== 'approved');
        
        if (needsVerification) {
          Alert.alert(
            'Cần xác minh tài khoản',
            'Bạn cần xác minh là sinh viên để sử dụng dịch vụ đặt xe.',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Xác minh ngay', 
                onPress: () => navigation.navigate('ProfileSwitch')
              }
            ]
          );
          return;
        }
      }
    } catch (error) {
      console.log('Could not check verification status:', error);
      // Fallback to cached data
      if (authService.isRider() && authService.needsRiderVerification()) {
        Alert.alert(
          'Cần xác minh tài khoản',
          'Bạn cần xác minh là sinh viên để sử dụng dịch vụ đặt xe.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác minh ngay', 
              onPress: () => navigation.navigate('ProfileSwitch')
            }
          ]
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
      // Show available drivers for manual selection
      const filteredDrivers = drivers.filter(driver => 
        driver.currentLocationId === selectedPickup.id || 
        driver.destinationId === selectedDropoff.id
      );
      setAvailableDrivers(filteredDrivers);
      setShowDrivers(true);
    } else {
      // Auto mode - simulate finding driver
      Alert.alert(
        'Đang tìm tài xế...',
        'Hệ thống đang tự động tìm tài xế phù hợp cho bạn',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Chờ', onPress: () => simulateAutoFind() }
        ]
      );
    }
  };

  const simulateAutoFind = () => {
    setTimeout(() => {
      Alert.alert('Tìm thấy tài xế!', 'Tài xế sẽ đến trong 5 phút');
    }, 2000);
  };

  const handleDriverSelect = (driver) => {
    Alert.alert(
      'Gửi yêu cầu',
      `Bạn muốn gửi yêu cầu cho ${driver.name}?\nĐánh giá: ${driver.rating}⭐\nKhoảng cách: ${driver.distance}km`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gửi yêu cầu', onPress: () => {
          setShowDrivers(false);
          Alert.alert('Đã gửi!', 'Yêu cầu đã được gửi đến tài xế');
        }}
      ]
    );
  };

  return (
    <AppBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Verification Banner removed per request */}

        {/* Glass Header */}
        <GlassHeader
          title={currentUserName || 'Người dùng'}
          subtitle="Xin chào,"
          onBellPress={() => {}}
        />

        {/* Mode Selector */}
        <View style={styles.content}>
          <Animatable.View animation="fadeInUp" duration={420} useNativeDriver>
            <CleanCard style={styles.card} contentStyle={styles.cardBody}>
              <Text style={styles.cardTitle}>Chế độ đặt chuyến</Text>
              <Text style={styles.cardSubtitle}>Chọn cách tìm xe phù hợp với nhu cầu của bạn</Text>
              <ModeSelector 
                mode={userMode} 
                onModeChange={setUserMode}
                userType="user"
              />
            </CleanCard>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={440} delay={40} useNativeDriver>
            <CleanCard style={styles.card} contentStyle={styles.cardBody}>
              <Text style={styles.cardTitle}>Lộ trình của bạn</Text>
              <Text style={styles.cardSubtitle}>Chọn nhanh các điểm đến phổ biến quanh khuôn viên</Text>

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
            <Animatable.View animation="fadeInUp">
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
                <View style={styles.routeContainer}>
                  <View style={styles.routePoint}>
                    <View style={styles.pickupDot} />
                    <Text style={styles.routeText}>{selectedPickup.name}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routePoint}>
                    <View style={styles.dropoffDot} />
                    <Text style={styles.routeText}>{selectedDropoff.name}</Text>
                  </View>
                </View>
              </CleanCard>
            </Animatable.View>
          )}

          <Animatable.View animation="fadeInUp" delay={80} useNativeDriver>
            <CleanCard style={styles.card} contentStyle={styles.ctaCard}>
              <View>
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
                        <View style={styles.driverInfo}>
                          <View style={styles.driverAvatar}>
                            <Icon name="person" size={24} color={colors.primary} />
                          </View>
                          <View style={styles.driverDetails}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <View style={styles.driverStats}>
                              <Icon name="star" size={16} color="#F59E0B" />
                              <Text style={styles.rating}>{driver.rating}</Text>
                              <Text style={styles.distance}>• {driver.distance}km</Text>
                              {driver.isSharing && (
                                <View style={styles.sharingBadge}>
                                  <Text style={styles.sharingText}>Chia sẻ</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text style={styles.estimatedTime}>{driver.estimatedTime} phút</Text>
                        </View>
                      </CleanCard>
                    </TouchableOpacity>
                  ))
                )}
              </CleanCard>
            </Animatable.View>
          )}

          <Animatable.View animation="fadeInUp" duration={520} delay={160} useNativeDriver>
            <CleanCard style={styles.card} contentStyle={styles.cardBody}>
              <Text style={styles.cardTitle}>Thao tác nhanh</Text>
              <Text style={styles.cardSubtitle}>Truy cập các chức năng được sử dụng nhiều</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                    <Icon name="history" size={22} color={colors.accent} />
                  </View>
                  <Text style={styles.actionText}>Lịch sử</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                    <Icon name="account-balance-wallet" size={22} color="#16A34A" />
                  </View>
                  <Text style={styles.actionText}>Ví tiền</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                    <Icon name="local-offer" size={22} color="#F97316" />
                  </View>
                  <Text style={styles.actionText}>Ưu đãi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(148,163,184,0.18)' }]}>
                    <Icon name="help" size={22} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.actionText}>Hỗ trợ</Text>
                </TouchableOpacity>
              </View>
            </CleanCard>
          </Animatable.View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 160 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    marginBottom: 20,
  },
  cardBody: {
    padding: 20,
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  cardBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(16,65,47,0.36)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plannerSection: {
    marginTop: 4,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  headingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  locationList: {
    paddingRight: 8,
  },
  locationItem: {
    width: 260,
    marginRight: 12,
  },
  routeContainer: {
    marginTop: 6,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    marginRight: 14,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.highlight,
    marginRight: 14,
  },
  routeLine: {
    width: 2,
    height: 26,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginLeft: 6,
  },
  routeText: { fontSize: 16, color: colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  ctaCard: {
    padding: 20,
    gap: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 18,
  },
  noDriversText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 18,
    fontFamily: 'Inter_400Regular',
  },
  driverCard: {
    marginBottom: 12,
  },
  driverCardContent: {
    paddingVertical: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#E3EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  distance: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  sharingBadge: {
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  sharingText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'Inter_700Bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionItem: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});

export default HomeScreen;
