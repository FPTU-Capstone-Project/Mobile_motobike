import React, { useState } from 'react';
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
import DriverContactCard from '../components/DriverContactCard';
import LocationTracker from '../components/LocationTracker';

const RideDetailsScreen = ({ navigation, route }) => {
  const [showLocationTracker, setShowLocationTracker] = useState(false);

  // Mock ride data - trong thực tế sẽ lấy từ route.params hoặc API
  const ride = {
    id: 1,
    driverName: 'Tran Thi B',
    driverPhone: '0987654322',
    driverRating: 4.8,
    riderName: 'Nguyen Van A',
    pickupLocation: 'Ký túc xá A',
    pickupAddress: '123 Đường ABC, Quận 1, TP.HCM',
    dropoffLocation: 'Trường Đại học FPT',
    dropoffAddress: '456 Đường XYZ, Quận 9, TP.HCM',
    status: 'ongoing', // Changed to ongoing để test các chức năng
    fare: 15000,
    date: '2024-01-15T08:00:00Z',
    duration: 20,
    distance: 5.2,
    paymentMethod: 'Ví điện tử',
    vehicleType: 'Xe máy',
    rideType: 'Xe thường'
  };

  // Mock driver data
  const driver = {
    id: 2,
    name: ride.driverName,
    phone: ride.driverPhone,
    rating: ride.driverRating,
    totalRides: 150,
    avatar: 'https://via.placeholder.com/100',
    isOnline: true,
    vehicleInfo: {
      brand: 'Honda',
      model: 'Winner X',
      licensePlate: '59-H1 123.45'
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' lúc ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'ongoing':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const handleDriverCall = (driver) => {
    console.log('Called driver:', driver.name);
    // Track call event
  };

  const handleDriverMessage = (driver) => {
    console.log('Messaged driver:', driver.name);
    // Track message event
  };

  const handleLocationPress = (location) => {
    console.log('Location pressed:', location);
    // Navigate to map view or show detailed location
  };

  const handleLocationUpdate = (location) => {
    console.log('Location updated:', location);
    // Update location in real-time
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'ongoing':
        return 'Đang diễn ra';
      default:
        return 'Không xác định';
    }
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Gọi tài xế',
      `Bạn có muốn gọi cho ${ride.driverName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi', onPress: () => Alert.alert('Đang gọi...', ride.driverPhone) }
      ]
    );
  };

  const handleRateRide = () => {
    Alert.alert('Đánh giá', 'Chức năng đánh giá đang được phát triển');
  };

  const handleReportIssue = () => {
    Alert.alert('Báo cáo sự cố', 'Chức năng báo cáo đang được phát triển');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyến đi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(ride.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
                {getStatusText(ride.status)}
              </Text>
            </View>
            <Text style={styles.rideId}>#{ride.id}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(ride.date)}</Text>
        </View>

        {/* Route Card */}
        <View style={styles.routeCard}>
          <Text style={styles.cardTitle}>Lộ trình</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.pickupDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{ride.pickupLocation}</Text>
                <Text style={styles.locationAddress}>{ride.pickupAddress}</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={styles.dropoffDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{ride.dropoffLocation}</Text>
                <Text style={styles.locationAddress}>{ride.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Icon name="straighten" size={16} color="#666" />
              <Text style={styles.statText}>{ride.distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.statText}>{ride.duration} phút</Text>
            </View>
          </View>
        </View>

        {/* Driver Contact Card */}
        <DriverContactCard
          driver={driver}
          onCallPress={handleDriverCall}
          onMessagePress={handleDriverMessage}
          onLocationPress={handleLocationPress}
          showLocation={ride.status === 'ongoing'}
          showMessage={true}
        />

        {/* Location Tracker - chỉ hiển thị khi chuyến đi đang diễn ra */}
        {ride.status === 'ongoing' && (
          <>
            <TouchableOpacity
              style={styles.locationToggleButton}
              onPress={() => setShowLocationTracker(!showLocationTracker)}
            >
              <Icon 
                name={showLocationTracker ? "expand-less" : "expand-more"} 
                size={24} 
                color="#2196F3" 
              />
              <Text style={styles.locationToggleText}>
                {showLocationTracker ? 'Ẩn bản đồ' : 'Hiển thị bản đồ'}
              </Text>
            </TouchableOpacity>

            {showLocationTracker && (
              <LocationTracker
                showMap={true}
                trackingEnabled={true}
                onLocationUpdate={handleLocationUpdate}
              />
            )}
          </>
        )}

        {/* Ride Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Chi tiết chuyến đi</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loại xe:</Text>
            <Text style={styles.detailValue}>{ride.vehicleType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loại chuyến:</Text>
            <Text style={styles.detailValue}>{ride.rideType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thanh toán:</Text>
            <Text style={styles.detailValue}>{ride.paymentMethod}</Text>
          </View>
        </View>

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Thanh toán</Text>
          
          <View style={styles.fareBreakdown}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Cước phí:</Text>
              <Text style={styles.fareValue}>{ride.fare.toLocaleString()} đ</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Phí dịch vụ:</Text>
              <Text style={styles.fareValue}>0 đ</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Giảm giá:</Text>
              <Text style={styles.fareValue}>0 đ</Text>
            </View>
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{ride.fare.toLocaleString()} đ</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {ride.status === 'completed' && (
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRateRide}>
              <Icon name="star-rate" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Đánh giá chuyến đi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleReportIssue}>
              <Icon name="report-problem" size={20} color="#000" />
              <Text style={styles.actionButtonText}>Báo cáo sự cố</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 34,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rideId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  routeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  routeContainer: {
    marginBottom: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
    marginTop: 4,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 12,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  routeStats: {
    flexDirection: 'row',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  driverCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  fareBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 14,
    color: '#000',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  locationToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  locationToggleText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default RideDetailsScreen;
