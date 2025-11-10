import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import rideService from '../services/rideService';
import ratingService from '../services/ratingService';

const RideDetailsScreen = ({ navigation, route }) => {
  const { ride: initialRide, rideId, requestId } = route.params || {};
  const [ride, setRide] = useState(initialRide || null);
  const [rideData, setRideData] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    loadRideDetails();
  }, [rideId, requestId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);

      // Load full ride data
      if (rideId) {
        try {
          const rideResponse = await rideService.getRideById(rideId);
          const rideDataObj = rideResponse?.data || rideResponse;
          setRideData(rideDataObj);
          console.log('✅ Loaded ride data:', rideDataObj);

          // Load request data if available
          if (requestId) {
            let request = null;
            
            // First, check if ride data has ride_requests
            if (rideDataObj?.ride_requests && Array.isArray(rideDataObj.ride_requests)) {
              request = rideDataObj.ride_requests.find(
                req => req.shared_ride_request_id === requestId || 
                       req.shared_ride_request_id === parseInt(requestId)
              );
            }
            
            // If not found, try to load request data separately
            if (!request) {
              try {
                const requestsResponse = await rideService.getRideRequests(rideId);
                const requestList = Array.isArray(requestsResponse) 
                  ? requestsResponse 
                  : (requestsResponse?.data || requestsResponse?.content || requestsResponse?.items || []);
                request = requestList.find(
                  req => req.shared_ride_request_id === requestId || 
                         req.shared_ride_request_id === parseInt(requestId)
                );
                console.log('✅ Loaded request data from API:', request);
              } catch (reqError) {
                console.warn('⚠️ Could not load request data:', reqError);
              }
            }
            
            if (request) {
              setRequestData(request);
              console.log('✅ Set request data:', request);
            } else {
              console.warn('⚠️ Request data not found for requestId:', requestId);
            }
          }
        } catch (error) {
          console.error('❌ Error loading ride data:', error);
        }
      }

      // Load rating if ride is completed (check rideData status if ride status is not available)
      const rideStatus = ride?.status || rideData?.status;
      if (requestId && rideStatus === 'COMPLETED') {
        try {
          const ratingsResponse = await ratingService.getRiderRatingsHistory(0, 100);
          const ratings = ratingsResponse?.data || [];
          const rideRating = ratings.find(r => 
            r.shared_ride_request_id === requestId || 
            r.request_id === requestId ||
            r.shared_ride_request_id === parseInt(requestId)
          );
          if (rideRating) {
            setRating(rideRating);
            console.log('✅ Loaded rating:', rideRating);
          }
        } catch (ratingError) {
          console.warn('⚠️ Could not load rating:', ratingError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading ride details:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chuyến đi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Merge data from multiple sources
  const getMergedData = useCallback(() => {
    const request = requestData || ride?.raw || {};
    const rideInfo = rideData || {};
    
    // Get pickup location - check multiple sources with priority
    let pickupLocation = null;
    let pickupAddress = 'N/A';
    
    // Priority 1: request.pickup_location (from requestData)
    if (request?.pickup_location && 
        typeof request.pickup_location.lat === 'number' && 
        typeof request.pickup_location.lng === 'number') {
      pickupLocation = {
        lat: request.pickup_location.lat,
        lng: request.pickup_location.lng,
      };
      pickupAddress = request.pickup_location.address || 
                     request.pickup_location.name || 
                     'N/A';
    } 
    // Priority 2: rideInfo.start_location (from rideData)
    else if (rideInfo?.start_location && 
             typeof rideInfo.start_location.lat === 'number' && 
             typeof rideInfo.start_location.lng === 'number') {
      pickupLocation = {
        lat: rideInfo.start_location.lat,
        lng: rideInfo.start_location.lng,
      };
      pickupAddress = rideInfo.start_location.address || 
                     rideInfo.start_location.name || 
                     ride?.pickupAddress || 
                     'N/A';
    } 
    // Priority 3: ride.raw.pickup_location (from initial ride data)
    else if (ride?.raw?.pickup_location && 
             typeof ride.raw.pickup_location.lat === 'number' && 
             typeof ride.raw.pickup_location.lng === 'number') {
      pickupLocation = {
        lat: ride.raw.pickup_location.lat,
        lng: ride.raw.pickup_location.lng,
      };
      pickupAddress = ride.raw.pickup_location.address || 
                     ride.raw.pickup_location.name || 
                     ride?.pickupAddress || 
                     'N/A';
    }
    // Fallback: just address
    else if (ride?.pickupAddress) {
      pickupAddress = ride.pickupAddress;
    }
    
    // Get dropoff location - check multiple sources with priority
    let dropoffLocation = null;
    let dropoffAddress = 'N/A';
    
    // Priority 1: request.dropoff_location (from requestData)
    if (request?.dropoff_location && 
        typeof request.dropoff_location.lat === 'number' && 
        typeof request.dropoff_location.lng === 'number') {
      dropoffLocation = {
        lat: request.dropoff_location.lat,
        lng: request.dropoff_location.lng,
      };
      dropoffAddress = request.dropoff_location.name || 
                      request.dropoff_location.address || 
                      'N/A';
    } 
    // Priority 2: rideInfo.end_location (from rideData)
    else if (rideInfo?.end_location && 
             typeof rideInfo.end_location.lat === 'number' && 
             typeof rideInfo.end_location.lng === 'number') {
      dropoffLocation = {
        lat: rideInfo.end_location.lat,
        lng: rideInfo.end_location.lng,
      };
      dropoffAddress = rideInfo.end_location.name || 
                      rideInfo.end_location.address || 
                      ride?.dropoffAddress || 
                      'N/A';
    } 
    // Priority 3: ride.raw.dropoff_location (from initial ride data)
    else if (ride?.raw?.dropoff_location && 
             typeof ride.raw.dropoff_location.lat === 'number' && 
             typeof ride.raw.dropoff_location.lng === 'number') {
      dropoffLocation = {
        lat: ride.raw.dropoff_location.lat,
        lng: ride.raw.dropoff_location.lng,
      };
      dropoffAddress = ride.raw.dropoff_location.name || 
                      ride.raw.dropoff_location.address || 
                      ride?.dropoffAddress || 
                      'N/A';
    }
    // Fallback: just address
    else if (ride?.dropoffAddress) {
      dropoffAddress = ride.dropoffAddress;
    }
    
    return {
      rideId: rideId || ride?.rideId || request.shared_ride_id || rideInfo.shared_ride_id,
      requestId: requestId || ride?.requestId || request.shared_ride_request_id,
      status: ride?.status || request.status || rideInfo.status,
      driverName: rideInfo.driver_name || request.driver_name || ride?.driverInfo?.driverName,
      driverId: rideInfo.driver_id || request.driver_id || ride?.driverInfo?.driverId,
      vehicleModel: rideInfo.vehicle_model || null,
      vehiclePlate: rideInfo.vehicle_plate || null,
      pickupAddress: pickupAddress,
      pickupLocation: pickupLocation,
      dropoffAddress: dropoffAddress,
      dropoffLocation: dropoffLocation,
      totalFare: request.fare_amount || 
                request.total_fare || 
                ride?.totalFare || 
                null,
      distance: rideInfo.actual_distance || 
               request.actual_distance || 
               request.distance_km || 
               ride?.distance || 
               null,
      duration: rideInfo.actual_duration || 
               request.actual_duration || 
               request.duration_minutes || 
               null,
      polyline: request.polyline || null,
      createdAt: request.created_at || ride?.createdAt || rideInfo.created_at,
      actualPickupTime: request.actual_pickup_time || ride?.actualPickupTime,
      actualDropoffTime: request.actual_dropoff_time || ride?.actualDropoffTime,
      estimatedPickupTime: request.estimated_pickup_time,
      estimatedDropoffTime: request.estimated_dropoff_time,
      rating: rating,
    };
  }, [rideData, requestData, ride, rating, rideId, requestId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const period = date.getUTCHours() >= 12 ? 'PM' : 'AM';
      const displayHours = date.getUTCHours() % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Chưa có';
    if (amount === 0) return 'Miễn phí';
    return `${Number(amount).toLocaleString('vi-VN')} ₫`;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONGOING':
        return '#F97316';
      case 'CONFIRMED':
        return '#3B82F6';
      case 'COMPLETED':
        return '#22C55E';
      case 'CANCELLED':
        return '#EF4444';
      case 'SCHEDULED':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONGOING':
        return 'Đang diễn ra';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'SCHEDULED':
        return 'Đã lên lịch';
      default:
        return status || 'Không xác định';
    }
  };

  const handleRateRide = () => {
    const data = getMergedData();
    navigation.navigate('RatingScreen', {
      rideId: data.rideId,
      requestId: data.requestId,
      driverId: data.driverId,
      driverName: data.driverName,
      totalFare: data.totalFare,
      actualDistance: data.distance,
      actualDuration: data.duration,
    });
  };

  const handleResumeRide = () => {
    const data = getMergedData();
    if (data.status === 'ONGOING' || data.status === 'CONFIRMED') {
      navigation.navigate('RideTracking', {
        rideId: data.rideId,
        requestId: data.requestId,
      });
    }
  };


  // Get merged data - but only if we have some data
  const data = useMemo(() => {
    if (loading) {
      return null;
    }
    
    // At least one data source should be available
    if (!rideData && !requestData && !ride) {
      return null;
    }
    
    try {
      return getMergedData();
    } catch (error) {
      console.error('❌ Error getting merged data:', error);
      return null;
    }
  }, [loading, rideData, requestData, ride, rating, getMergedData]);


  // Early return AFTER all hooks are called
  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOngoing = data.status === 'ONGOING' || data.status === 'CONFIRMED';
  const isCompleted = data.status === 'COMPLETED';

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
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(data.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                {getStatusText(data.status)}
              </Text>
            </View>
            {data.rideId && (
              <Text style={styles.rideId}>ID: #{data.rideId}</Text>
            )}
          </View>
          {data.createdAt && (
            <Text style={styles.dateText}>{formatDate(data.createdAt)}</Text>
          )}
        </View>

        {/* Route Info */}
        <View style={styles.routeCard}>
          <Text style={styles.cardTitle}>Lộ trình</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.pickupDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>Điểm đón</Text>
                <Text style={styles.locationAddress}>{data.pickupAddress}</Text>
                {data.actualPickupTime && (
                  <Text style={styles.timeText}>⏰ {formatTime(data.actualPickupTime)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePoint}>
              <View style={styles.dropoffDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>Điểm đến</Text>
                <Text style={styles.locationAddress}>{data.dropoffAddress}</Text>
                {data.actualDropoffTime && (
                  <Text style={styles.timeText}>⏰ {formatTime(data.actualDropoffTime)}</Text>
                )}
              </View>
            </View>
          </View>

          {(data.distance || data.duration) && (
            <View style={styles.routeStats}>
              {data.distance && (
                <View style={styles.statItem}>
                  <Icon name="straighten" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {typeof data.distance === 'number' 
                      ? `${data.distance.toFixed(2)} km` 
                      : `${data.distance} km`}
                  </Text>
                </View>
              )}
              {data.duration && (
                <View style={styles.statItem}>
                  <Icon name="schedule" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {typeof data.duration === 'number' 
                      ? `${data.duration} phút` 
                      : `${data.duration} phút`}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Driver Info */}
        {data.driverName && (
          <View style={styles.driverCard}>
            <Text style={styles.cardTitle}>Tài xế</Text>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Icon name="person" size={24} color="#666" />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{data.driverName}</Text>
                {data.vehiclePlate && (
                  <Text style={styles.vehicleInfo}>
                    {data.vehicleModel ? `${data.vehicleModel} • ` : ''}
                    {data.vehiclePlate}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Payment Card */}
        {data.totalFare !== null && (
          <View style={styles.paymentCard}>
            <Text style={styles.cardTitle}>Thanh toán</Text>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Tổng cộng:</Text>
              <Text style={styles.fareValue}>{formatCurrency(data.totalFare)}</Text>
            </View>
          </View>
        )}

        {/* Rating Card */}
        {isCompleted && data.rating && (
          <View style={styles.ratingCard}>
            <Text style={styles.cardTitle}>Đánh giá của bạn</Text>
            <View style={styles.ratingInfo}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name={star <= data.rating.rating_score ? 'star' : 'star-border'}
                    size={24}
                    color="#FFA500"
                  />
                ))}
              </View>
              {data.rating.comment && (
                <Text style={styles.ratingComment}>{data.rating.comment}</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          {isOngoing && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleResumeRide}
            >
              <Icon name="play-arrow" size={20} color="#4CAF50" />
              <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
                Tiếp tục theo dõi
              </Text>
            </TouchableOpacity>
          )}
          
          {isCompleted && !data.rating && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleRateRide}
            >
              <Icon name="star-rate" size={20} color="#FFA500" />
              <Text style={[styles.actionButtonText, { color: '#FFA500' }]}>
                Đánh giá chuyến đi
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  paymentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ratingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  ratingInfo: {
    marginTop: 10,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ratingComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default RideDetailsScreen;
