import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import mockData from '../../data/mockData.json';
import ModernButton from '../../components/ModernButton.jsx';
import ModeSelector from '../../components/ModeSelector.jsx';

const DriverHomeScreen = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [allowSharing, setAllowSharing] = useState(true);
  const [driverMode, setDriverMode] = useState('manual');
  const [currentRide, setCurrentRide] = useState(null);

  const driver = mockData.users[1]; // Driver user
  const todayStats = {
    earnings: 125000,
    rides: 8,
    hours: 6.5,
    rating: 4.8
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Đã offline' : 'Đã online',
      isOnline ? 'Bạn đã ngừng nhận chuyến đi' : 'Bạn đã sẵn sàng nhận chuyến đi'
    );
  };

  const rideRequests = [
    {
      id: 1,
      riderName: 'Nguyen Van A',
      riderRating: 4.5,
      pickupLocation: 'Ký túc xá A',
      dropoffLocation: 'Trường Đại học FPT',
      distance: 5.2,
      estimatedFare: 15000,
      estimatedTime: 3,
      requestTime: '2 phút trước',
      isShared: false
    },
    {
      id: 2,
      riderName: 'Le Thi B',
      riderRating: 4.8,
      pickupLocation: 'Nhà văn hóa',
      dropoffLocation: 'Chợ Bến Thành',
      distance: 8.7,
      estimatedFare: 25000,
      estimatedTime: 7,
      requestTime: '5 phút trước',
      isShared: true
    }
  ];

  const nearbyRiders = [
    {
      id: 3,
      riderName: 'Pham Van C',
      pickupLocation: 'Gần vị trí của bạn',
      dropoffLocation: 'Trường Đại học FPT',
      distance: 0.8,
      estimatedFare: 12000,
      matchPercentage: 95
    }
  ];

  const handleAcceptRide = (ride) => {
    Alert.alert(
      'Xác nhận nhận chuyến',
      `Khách hàng: ${ride.riderName}\nTừ: ${ride.pickupLocation}\nĐến: ${ride.dropoffLocation}\nThu nhập: ${ride.estimatedFare.toLocaleString()} đ`,
      [
        { text: 'Từ chối', style: 'cancel' },
        { text: 'Nhận chuyến', onPress: () => {
          setCurrentRide(ride);
          Alert.alert('Thành công', 'Đã nhận chuyến đi! Hãy đến điểm đón.');
        }}
      ]
    );
  };

  const handleRequestRider = (rider) => {
    Alert.alert(
      'Gửi lời mời',
      `Gửi lời mời cho ${rider.riderName}?\nĐộ phù hợp: ${rider.matchPercentage}%`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gửi lời mời', onPress: () => Alert.alert('Đã gửi!', 'Lời mời đã được gửi đến khách hàng') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.driverInfo}>
              <Text style={styles.greeting}>Xin chào tài xế,</Text>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {isOnline ? 'Đang online' : 'Offline'}
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
          {/* Online Status Card */}
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

          {/* Mode Selector */}
          {isOnline && (
            <ModeSelector 
              mode={driverMode} 
              onModeChange={setDriverMode}
              userType="driver"
            />
          )}

          {/* Today's Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Thống kê hôm nay</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.statIcon}
                >
                  <Icon name="attach-money" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.earnings.toLocaleString()}đ</Text>
                <Text style={styles.statLabel}>Thu nhập</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.statIcon}
                >
                  <Icon name="directions-car" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.rides}</Text>
                <Text style={styles.statLabel}>Chuyến đi</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.statIcon}
                >
                  <Icon name="schedule" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.hours}h</Text>
                <Text style={styles.statLabel}>Thời gian</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#9C27B0', '#7B1FA2']}
                  style={styles.statIcon}
                >
                  <Icon name="star" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{todayStats.rating}</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
            </View>
          </View>

          {/* Current Ride */}
          {currentRide && (
            <Animatable.View animation="slideInUp" style={styles.currentRideCard}>
              <View style={styles.currentRideHeader}>
                <Text style={styles.cardTitle}>Chuyến đi hiện tại</Text>
                <TouchableOpacity style={styles.sosButton}>
                  <Icon name="emergency" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
              <View style={styles.rideInfo}>
                <Text style={styles.riderName}>{currentRide.riderName}</Text>
                <Text style={styles.routeText}>{currentRide.pickupLocation} → {currentRide.dropoffLocation}</Text>
              </View>
              <View style={styles.rideActions}>
                <ModernButton
                  title="Liên hệ khách"
                  variant="outline"
                  size="small"
                  icon="phone"
                  onPress={() => Alert.alert('Gọi', 'Đang gọi khách hàng...')}
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

          {/* Ride Requests or Nearby Riders */}
          {isOnline && !currentRide && (
            <>
              {driverMode === 'auto' && rideRequests.length > 0 && (
                <View style={styles.requestsSection}>
                  <Text style={styles.sectionTitle}>Yêu cầu chuyến đi</Text>
                  {rideRequests.map((request) => (
                    <Animatable.View 
                      key={request.id} 
                      animation="slideInRight" 
                      style={styles.requestCard}
                    >
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
                          <Text style={styles.detailText}>{request.distance} km</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Icon name="schedule" size={16} color="#666" />
                          <Text style={styles.detailText}>{request.estimatedTime} phút</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Icon name="attach-money" size={16} color="#4CAF50" />
                          <Text style={[styles.detailText, { color: '#4CAF50', fontWeight: '600' }]}>
                            {request.estimatedFare.toLocaleString()} đ
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
                          onPress={() => Alert.alert('Đã từ chối', 'Bạn đã từ chối chuyến đi này')}
                        />
                        <ModernButton
                          title="Nhận chuyến"
                          size="small"
                          onPress={() => handleAcceptRide(request)}
                        />
                      </View>
                    </Animatable.View>
                  ))}
                </View>
              )}

              {driverMode === 'manual' && nearbyRiders.length > 0 && (
                <View style={styles.nearbySection}>
                  <Text style={styles.sectionTitle}>Khách hàng gần bạn</Text>
                  {nearbyRiders.map((rider) => (
                    <View key={rider.id} style={styles.nearbyCard}>
                      <View style={styles.nearbyHeader}>
                        <Text style={styles.riderName}>{rider.riderName}</Text>
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchText}>{rider.matchPercentage}% phù hợp</Text>
                        </View>
                      </View>
                      <Text style={styles.nearbyRoute}>
                        {rider.pickupLocation} → {rider.dropoffLocation}
                      </Text>
                      <View style={styles.nearbyDetails}>
                        <Text style={styles.nearbyDistance}>{rider.distance} km</Text>
                        <Text style={styles.nearbyFare}>{rider.estimatedFare.toLocaleString()} đ</Text>
                      </View>
                      <ModernButton
                        title="Gửi lời mời"
                        size="small"
                        icon="send"
                        onPress={() => handleRequestRider(rider)}
                      />
                    </View>
                  ))}
                </View>
              )}

              {((driverMode === 'auto' && rideRequests.length === 0) || 
                (driverMode === 'manual' && nearbyRiders.length === 0)) && (
                <View style={styles.emptyState}>
                  <Icon name="hourglass-empty" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>
                    {driverMode === 'auto' ? 'Chưa có yêu cầu nào' : 'Không có khách hàng gần bạn'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {driverMode === 'auto' ? 
                      'Vui lòng chờ khách hàng đặt chuyến' : 
                      'Thử chuyển sang chế độ tự động'}
                  </Text>
                  {driverMode === 'manual' && (
                    <ModernButton
                      title="Chế độ tự động"
                      variant="outline"
                      onPress={() => setDriverMode('auto')}
                    />
                  )}
                </View>
              )}
            </>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => navigation.navigate('Earnings')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.actionIcon}
                >
                  <Icon name="trending-up" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Thu nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionItem}
                onPress={() => navigation.navigate('Ratings')}
              >
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.actionIcon}
                >
                  <Icon name="star-rate" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Đánh giá</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.actionIcon}
                >
                  <Icon name="history" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText}>Lịch sử</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <LinearGradient
                  colors={['#9C27B0', '#7B1FA2']}
                  style={styles.actionIcon}
                >
                  <Icon name="help" size={20} color="#fff" />
                </LinearGradient>
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
  driverInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
    marginBottom: 8,
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
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  currentRideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  currentRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sosButton: {
    padding: 8,
  },
  rideInfo: {
    marginBottom: 16,
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#666',
  },
  rideActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  requestsSection: {
    marginBottom: 24,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  requestTime: {
    fontSize: 12,
    color: '#666',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    marginRight: 10,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#ddd',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  requestDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  sharedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  sharedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  nearbySection: {
    marginBottom: 24,
  },
  nearbyCard: {
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
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  matchText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  nearbyRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  nearbyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearbyDistance: {
    fontSize: 14,
    color: '#666',
  },
  nearbyFare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
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
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default DriverHomeScreen;