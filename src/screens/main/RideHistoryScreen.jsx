import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';

import rideService from '../../services/rideService';
import authService from '../../services/authService';
import ratingService from '../../services/ratingService';

const RideHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('ongoing'); // ongoing, completed, all
  const [ongoingRides, setOngoingRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [ratedRequestIds, setRatedRequestIds] = useState(new Set()); // Track which requests have been rated
  
  const tabs = [
    { key: 'ongoing', label: 'Đang diễn ra', icon: 'directions-car' },
    { key: 'completed', label: 'Hoàn thành', icon: 'check-circle' },
    { key: 'all', label: 'Tất cả', icon: 'list' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [])
  );

  const loadRides = async () => {
    try {
      setLoading(true);
      
      // Get current user to extract userId (thử dùng userId thay cho riderId)
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.warn('⚠️ No current user found');
        setOngoingRides([]);
        setCompletedRides([]);
        return;
      }

      // Extract userId from user data
      const userId = currentUser?.user?.user_id || currentUser?.user_id;
      if (!userId) {
        console.warn('⚠️ No user ID found in user data:', currentUser);
        setOngoingRides([]);
        setCompletedRides([]);
        return;
      }

      console.log('📋 Loading rides for user ID (trying as riderId):', userId);

      // Load ratings to check which requests have been rated
      try {
        const ratingsResponse = await ratingService.getRiderRatingsHistory(0, 100);
        const ratings = ratingsResponse?.data || [];
        const ratedIds = new Set(ratings.map(rating => rating.shared_ride_request_id || rating.requestId));
        setRatedRequestIds(ratedIds);
        console.log(`✅ Loaded ${ratings.length} ratings, ${ratedIds.size} unique request IDs`);
      } catch (ratingError) {
        console.warn('⚠️ Could not load ratings (will assume no ratings):', ratingError);
        setRatedRequestIds(new Set());
      }

      // Load ongoing rides (CONFIRMED, ONGOING) - thử dùng userId
      try {
        const ongoingResponse = await rideService.getRiderRequests(userId, 'ONGOING', 0, 50);
        const confirmedResponse = await rideService.getRiderRequests(userId, 'CONFIRMED', 0, 50);
        
        console.log('📦 ONGOING Response:', JSON.stringify(ongoingResponse, null, 2));
        console.log('📦 CONFIRMED Response:', JSON.stringify(confirmedResponse, null, 2));
        
        const ongoingData = ongoingResponse?.data || [];
        const confirmedData = confirmedResponse?.data || [];
        
        console.log('📦 ONGOING Data:', JSON.stringify(ongoingData, null, 2));
        console.log('📦 CONFIRMED Data:', JSON.stringify(confirmedData, null, 2));
        
        // Combine and transform to ride cards format
        const allOngoing = [...ongoingData, ...confirmedData].map(request => {
          console.log('📋 Processing ongoing request:', JSON.stringify(request, null, 2));
          
          // Get pickup address - prioritize address, then name
          const pickupAddr = request.pickup_location?.address || 
                           request.pickup_location?.name || 
                           request.pickup_location_name || 
                           'N/A';
          
          // Get dropoff address - prioritize name if address is "N/A", then address, then name
          let dropoffAddr = 'N/A';
          if (request.dropoff_location) {
            if (request.dropoff_location.address && request.dropoff_location.address !== 'N/A') {
              dropoffAddr = request.dropoff_location.address;
            } else if (request.dropoff_location.name) {
              dropoffAddr = request.dropoff_location.name;
            }
          } else if (request.dropoff_location_name) {
            dropoffAddr = request.dropoff_location_name;
          }
          
          return {
            rideId: request.shared_ride_id,
            requestId: request.shared_ride_request_id,
            status: request.status,
            userType: 'rider',
            pickupAddress: pickupAddr,
            dropoffAddress: dropoffAddr,
            totalFare: request.fare_amount !== undefined && request.fare_amount !== null ? request.fare_amount : (request.total_fare !== undefined && request.total_fare !== null ? request.total_fare : null),
            distance: request.distance_km || request.estimated_distance_km || request.actual_distance || null,
            driverInfo: {
              driverName: request.driver_name || null,
              driverId: request.driver_id || null,
            },
            createdAt: request.created_at,
            pickupTime: request.pickup_time,
            estimatedPickupTime: request.estimated_pickup_time,
            actualPickupTime: request.actual_pickup_time,
            actualDropoffTime: request.actual_dropoff_time,
            // Raw data để debug
            raw: request,
          };
        });

        console.log(`✅ Loaded ${allOngoing.length} ongoing rides from API`);
        console.log('📋 Transformed ongoing rides:', JSON.stringify(allOngoing, null, 2));
        setOngoingRides(allOngoing);
      } catch (error) {
        console.error('Error loading ongoing rides:', error);
        setOngoingRides([]);
      }

      // Load completed rides
      try {
        const completedResponse = await rideService.getRiderRequests(userId, 'COMPLETED', 0, 50);
        const completedData = completedResponse?.data || [];
        
        console.log('📦 COMPLETED Response:', JSON.stringify(completedResponse, null, 2));
        console.log('📦 COMPLETED Data:', JSON.stringify(completedData, null, 2));
        
        const allCompleted = completedData.map(request => {
          console.log('📋 Processing completed request:', JSON.stringify(request, null, 2));
          
          // Get pickup address - prioritize address, then name
          const pickupAddr = request.pickup_location?.address || 
                           request.pickup_location?.name || 
                           request.pickup_location_name || 
                           'N/A';
          
          // Get dropoff address - prioritize name if address is "N/A", then address, then name
          let dropoffAddr = 'N/A';
          if (request.dropoff_location) {
            if (request.dropoff_location.address && request.dropoff_location.address !== 'N/A') {
              dropoffAddr = request.dropoff_location.address;
            } else if (request.dropoff_location.name) {
              dropoffAddr = request.dropoff_location.name;
            }
          } else if (request.dropoff_location_name) {
            dropoffAddr = request.dropoff_location_name;
          }
          
          return {
            rideId: request.shared_ride_id,
            requestId: request.shared_ride_request_id,
            status: request.status,
            userType: 'rider',
            pickupAddress: pickupAddr,
            dropoffAddress: dropoffAddr,
            totalFare: request.fare_amount !== undefined && request.fare_amount !== null ? request.fare_amount : (request.total_fare !== undefined && request.total_fare !== null ? request.total_fare : null),
            distance: request.actual_distance || request.distance_km || request.estimated_distance_km || null,
            driverInfo: {
              driverName: request.driver_name || null,
              driverId: request.driver_id || null,
            },
            createdAt: request.created_at,
            completedAt: request.actual_dropoff_time || request.estimated_dropoff_time,
            actualPickupTime: request.actual_pickup_time,
            actualDropoffTime: request.actual_dropoff_time,
            // Raw data để debug
            raw: request,
          };
        });

        console.log(`✅ Loaded ${allCompleted.length} completed rides`);
        console.log('📋 Transformed completed rides:', JSON.stringify(allCompleted, null, 2));
        setCompletedRides(allCompleted);
      } catch (error) {
        console.error('Error loading completed rides:', error);
        setCompletedRides([]);
      }
      
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chuyến đi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const handleResumeRide = (ride) => {
    console.log('📍 Resuming ride:', ride);
    
    if (ride.userType === 'driver') {
      // Navigate to driver tracking screen
      navigation.navigate('DriverRideTracking', {
        rideId: ride.rideId,
        initialRideData: ride,
      });
    } else {
      // Navigate to rider tracking screen
      navigation.navigate('RideTracking', {
        rideId: ride.rideId,
        requestId: ride.requestId,
        driverInfo: ride.driverInfo,
        status: ride.status,
      });
    }
  };

  const handleViewDetails = (ride) => {
    // Navigate to ride details screen with full ride data
    navigation.navigate('RideDetails', {
      ride: ride,
      rideId: ride.rideId,
      requestId: ride.requestId,
    });
  };

  const handleRateRide = async (ride) => {
    try {
      console.log('📋 Loading ride data for rating:', ride.rideId, ride.requestId);
      
      // Extract data from ride.raw first (most reliable source for request-specific data)
      const raw = ride.raw || {};
      
      // Try to get full ride data from API to ensure we have all information
      let rideData = null;
      let requestData = null;
      try {
        const rideResponse = await rideService.getRideById(ride.rideId);
        console.log('📦 Raw ride response:', JSON.stringify(rideResponse, null, 2));
        
        // Handle response structure - could be direct data or wrapped in { data: ... }
        // Check if response has data property and it's not empty
        if (rideResponse?.data && typeof rideResponse.data === 'object' && Object.keys(rideResponse.data).length > 0) {
          rideData = rideResponse.data;
        } else if (rideResponse && typeof rideResponse === 'object' && Object.keys(rideResponse).length > 0) {
          rideData = rideResponse;
        }
        
        console.log('✅ Processed rideData:', JSON.stringify(rideData, null, 2));
        console.log('🔍 rideData fields:', {
          hasDriverId: !!rideData?.driver_id,
          hasDriverName: !!rideData?.driver_name,
          hasActualDistance: rideData?.actual_distance !== undefined,
          hasActualDuration: rideData?.actual_duration !== undefined,
          driver_id: rideData?.driver_id,
          driver_name: rideData?.driver_name,
          actual_distance: rideData?.actual_distance,
          actual_duration: rideData?.actual_duration,
        });
        
        // Try to get request-specific data by fetching ride requests
        try {
          const requestsResponse = await rideService.getRideRequests(ride.rideId);
          const requestList = Array.isArray(requestsResponse) 
            ? requestsResponse 
            : (requestsResponse?.data || requestsResponse?.content || requestsResponse?.items || []);
          
          requestData = requestList.find(req => 
            req.shared_ride_request_id === ride.requestId || 
            req.shared_ride_request_id === parseInt(ride.requestId) ||
            req.request_id === ride.requestId
          );
          console.log('✅ Found request data from ride requests:', JSON.stringify(requestData, null, 2));
        } catch (reqError) {
          console.warn('⚠️ Could not load ride requests, using raw data:', reqError);
        }
      } catch (error) {
        console.warn('⚠️ Could not load ride data, using cached data:', error);
      }
      
      // Use requestData if available, otherwise use raw
      const request = requestData || raw;
      
      // Extract values with explicit checks
      // Driver info from rideData (most reliable)
      let driverId = null;
      let driverName = null;
      if (rideData) {
        driverId = rideData.driver_id ?? rideData.driver?.driver_id ?? null;
        driverName = rideData.driver_name ?? rideData.driver?.name ?? rideData.driver?.full_name ?? null;
      }
      // Fallback to request/raw if rideData doesn't have it
      if (!driverId) driverId = request?.driver_id ?? null;
      if (!driverName) driverName = request?.driver_name ?? request?.driver?.name ?? request?.driver?.full_name ?? null;
      
      // Fare from request (request-specific) - check both fare_amount and total_fare
      let totalFare = null;
      if (request && request.fare_amount !== undefined && request.fare_amount !== null) {
        totalFare = request.fare_amount;
      } else if (request && request.total_fare !== undefined && request.total_fare !== null) {
        totalFare = request.total_fare;
      } else if (raw && raw.fare_amount !== undefined && raw.fare_amount !== null) {
        totalFare = raw.fare_amount;
      } else if (raw && raw.total_fare !== undefined && raw.total_fare !== null) {
        totalFare = raw.total_fare;
      }
      
      console.log('💰 Fare extraction:', {
        requestFareAmount: request?.fare_amount,
        requestTotalFare: request?.total_fare,
        rawFareAmount: raw?.fare_amount,
        rawTotalFare: raw?.total_fare,
        finalTotalFare: totalFare,
      });
      
      // Distance from rideData (ride-level), fallback to request/raw
      let actualDistance = null;
      if (rideData && (rideData.actual_distance !== undefined && rideData.actual_distance !== null)) {
        actualDistance = rideData.actual_distance;
      } else if (request && (request.actual_distance !== undefined && request.actual_distance !== null)) {
        actualDistance = request.actual_distance;
      } else if (request && request.distance_km) {
        actualDistance = request.distance_km;
      } else if (raw && raw.actual_distance) {
        actualDistance = raw.actual_distance;
      } else if (raw && raw.distance_km) {
        actualDistance = raw.distance_km;
      }
      
      // Duration from rideData (ride-level), fallback to request/raw
      let actualDuration = null;
      if (rideData && (rideData.actual_duration !== undefined && rideData.actual_duration !== null)) {
        actualDuration = rideData.actual_duration;
      } else if (request && (request.actual_duration !== undefined && request.actual_duration !== null)) {
        actualDuration = request.actual_duration;
      } else if (request && request.duration_minutes) {
        actualDuration = request.duration_minutes;
      } else if (raw && raw.actual_duration) {
        actualDuration = raw.actual_duration;
      } else if (raw && raw.duration_minutes) {
        actualDuration = raw.duration_minutes;
      }
      
      console.log('📋 Final rating data:', {
        rideId: ride.rideId,
        requestId: ride.requestId,
        driverId,
        driverName,
        totalFare,
        actualDistance,
        actualDuration,
        debug: {
          rideDataExists: !!rideData,
          rideDataDriverId: rideData?.driver_id,
          rideDataDriverName: rideData?.driver_name,
          rideDataActualDistance: rideData?.actual_distance,
          rideDataActualDuration: rideData?.actual_duration,
          requestFareAmount: request?.fare_amount,
          requestTotalFare: request?.total_fare,
        },
      });
      
      // Navigate to rating screen
      navigation.navigate('RatingScreen', {
        rideId: ride.rideId,
        requestId: ride.requestId,
        driverId,
        driverName,
        totalFare,
        actualDistance,
        actualDuration,
      });
    } catch (error) {
      console.error('❌ Error loading ride data for rating:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chuyến đi. Vui lòng thử lại.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ONGOING':
      case 'CONFIRMED':
        return '#F97316';
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Chưa có';
    if (amount === 0) return 'Miễn phí';
    return `${Number(amount).toLocaleString('vi-VN')} ₫`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse ISO string and format without timezone conversion
      const date = new Date(dateString);
      // Use UTC methods to avoid timezone conversion
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
      // Parse ISO string and format without timezone conversion
      const date = new Date(dateString);
      // Use UTC methods to avoid timezone conversion
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const period = date.getUTCHours() >= 12 ? 'PM' : 'AM';
      const displayHours = date.getUTCHours() % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatDateForList = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const months = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
      const day = date.getUTCDate();
      const month = months[date.getUTCMonth()];
      const hours = date.getUTCHours() % 12 || 12;
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const period = date.getUTCHours() >= 12 ? 'PM' : 'AM';
      return `${day} ${month}, ${hours}:${minutes} ${period}`;
    } catch (e) {
      return dateString;
    }
  };

  const renderRideCard = (ride, index) => {
    const isOngoing = ride.status === 'ONGOING' || ride.status === 'CONFIRMED';
    
    return (
      <TouchableOpacity
        key={`${ride.rideId || ride.requestId}-${index}`}
        style={styles.rideCardSimple}
        onPress={() => handleViewDetails(ride)}
        activeOpacity={0.7}
      >
        {/* Left: Service Icon and Name */}
        <View style={styles.leftSection}>
          <View style={styles.serviceIcon}>
            <Icon name="two-wheeler" size={24} color="#fff" />
            <View style={styles.clockIcon}>
              <Icon name="access-time" size={10} color="#fff" />
            </View>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Xe máy</Text>
            {ride.createdAt && (
              <Text style={styles.dateTimeText}>
                {formatDateForList(ride.createdAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Price and Arrow */}
        <View style={styles.rightSection}>
          <Text style={styles.priceText}>
            {ride.totalFare !== null && ride.totalFare !== undefined 
              ? formatCurrency(ride.totalFare) 
              : 'Chưa có'}
          </Text>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    let displayRides = [];
    
    switch (selectedTab) {
      case 'ongoing':
        displayRides = ongoingRides;
        break;
      case 'completed':
        displayRides = completedRides;
        break;
      case 'all':
        displayRides = [...ongoingRides, ...completedRides];
        break;
      default:
        displayRides = [];
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    if (displayRides.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="inbox" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {selectedTab === 'ongoing' 
              ? 'Bạn chưa có chuyến đi nào đang diễn ra' 
              : 'Chưa có lịch sử chuyến đi'}
          </Text>
          {selectedTab === 'ongoing' && (
            <TouchableOpacity
              style={styles.createRideButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createRideButtonText}>Tạo chuyến mới</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {displayRides.map((ride, index) => renderRideCard(ride, index))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
        <Text style={styles.headerSubtitle}>
          {ongoingRides.length} đang diễn ra · {completedRides.length} hoàn thành
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={selectedTab === tab.key ? '#4CAF50' : '#999'}
            />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  createRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  createRideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  rideCardSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  clockIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#666',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  routeText: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '500',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 16,
    marginVertical: 4,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  driverText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
  ratingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  ratingButtonText: {
    color: '#FFA500',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RideHistoryScreen;

