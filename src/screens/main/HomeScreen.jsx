import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

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

  const user = mockData.users[0];
  const presetLocations = mockData.presetLocations;
  const drivers = mockData.availableDrivers;

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Verification Banner */}
        {authService.isRider() && authService.needsRiderVerification() && (
          <Animatable.View animation="fadeInDown" style={styles.verificationBanner}>
            <View style={styles.bannerContent}>
              <Icon name="warning" size={20} color="#FF9800" />
              <Text style={styles.bannerText}>Cần xác minh tài khoản để sử dụng dịch vụ</Text>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => navigation.navigate('ProfileSwitch')}
              >
                <Text style={styles.bannerButtonText}>Xác minh</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}

        {/* Header with Gradient */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Xin chào,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications" size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Mode Selector */}
        <View style={styles.content}>
          <ModeSelector 
            mode={userMode} 
            onModeChange={setUserMode}
            userType="user"
          />

          {/* Location Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn điểm đón</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
              {presetLocations.map((location) => (
                <View key={location.id} style={styles.locationItem}>
                  <LocationCard
                    location={location}
                    selected={selectedPickup?.id === location.id}
                    onPress={() => handleLocationSelect(location, 'pickup')}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn điểm đến</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
              {presetLocations.map((location) => (
                <View key={location.id} style={styles.locationItem}>
                  <LocationCard
                    location={location}
                    selected={selectedDropoff?.id === location.id}
                    onPress={() => handleLocationSelect(location, 'dropoff')}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Selected Route Summary */}
          {selectedPickup && selectedDropoff && (
            <Animatable.View animation="fadeInUp" style={styles.routeSummary}>
              <Text style={styles.routeTitle}>Tuyến đường đã chọn</Text>
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
            </Animatable.View>
          )}

          {/* Find Ride Button */}
          <View style={styles.buttonContainer}>
            <ModernButton
              title={userMode === 'manual' ? 'Tìm tài xế xung quanh' : 'Tìm xe tự động'}
              onPress={handleFindRide}
              icon={userMode === 'manual' ? 'search' : 'auto-fix-high'}
              size="large"
            />
          </View>

          {/* Available Drivers (Manual Mode) */}
          {showDrivers && userMode === 'manual' && (
            <Animatable.View animation="slideInUp" style={styles.driversSection}>
              <Text style={styles.sectionTitle}>Tài xế có sẵn</Text>
              {availableDrivers.length === 0 ? (
                <View style={styles.noDrivers}>
                  <Icon name="search-off" size={48} color="#ccc" />
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
                    onPress={() => handleDriverSelect(driver)}
                  >
                    <View style={styles.driverInfo}>
                      <View style={styles.driverAvatar}>
                        <Icon name="person" size={24} color="#4CAF50" />
                      </View>
                      <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <View style={styles.driverStats}>
                          <Icon name="star" size={16} color="#FF9800" />
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
                  </TouchableOpacity>
                ))
              )}
            </Animatable.View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('History')}>
                <Icon name="history" size={24} color="#2196F3" />
                <Text style={styles.actionText}>Lịch sử</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Wallet')}>
                <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
                <Text style={styles.actionText}>Ví tiền</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Icon name="local-offer" size={24} color="#FF9800" />
                <Text style={styles.actionText}>Ưu đãi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionItem}>
                <Icon name="help" size={24} color="#9C27B0" />
                <Text style={styles.actionText}>Hỗ trợ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  verificationBanner: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    fontWeight: '500',
  },
  bannerButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  locationScroll: {
    marginHorizontal: -4,
  },
  locationItem: {
    width: 280,
    marginRight: 8,
  },
  routeSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  routeContainer: {
    alignItems: 'flex-start',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  driversSection: {
    marginBottom: 24,
  },
  noDrivers: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  noDriversText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  driverCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  sharingBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  sharingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickActions: {
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '22%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;