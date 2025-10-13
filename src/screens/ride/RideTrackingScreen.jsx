import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import locationService from '../../services/locationService';
import rideService from '../../services/rideService';
import goongService from '../../services/goongService';
import ModernButton from '../../components/ModernButton.jsx';
import GoongMap from '../../components/GoongMap.jsx';

const { width, height } = Dimensions.get('window');

const RideTrackingScreen = ({ navigation, route }) => {
  const { proposals, quote } = route.params || {};
  
  // States
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [rideStatus, setRideStatus] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [showProposals, setShowProposals] = useState(true);

  // Map ref
  const mapRef = useRef(null);

  useEffect(() => {
    initializeTracking();
    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const initializeTracking = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Start location tracking
      locationService.startLocationTracking((newLocation) => {
        setCurrentLocation(newLocation);
      });

      // If we have proposals, show them
      if (proposals && proposals.length > 0) {
        setShowProposals(true);
      }

    } catch (error) {
      console.error('Error initializing tracking:', error);
    }
  };

  const handleSelectProposal = (proposal) => {
    setSelectedProposal(proposal);
    setShowProposals(false);
    
    // Fit map to show pickup, dropoff, and driver location
    if (mapRef.current) {
      const coordinates = [
        quote.pickup,
        quote.dropoff,
        proposal.driverLocation
      ].filter(Boolean);
      
      const region = locationService.getRegionForCoordinates(coordinates, 0.02);
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Hủy chuyến xe',
      'Bạn có chắc chắn muốn hủy chuyến xe này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy chuyến',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Cancel the ride request
              if (selectedProposal?.requestId) {
                await rideService.cancelRequest(selectedProposal.requestId);
              }
              
              Alert.alert('Thành công', 'Đã hủy chuyến xe', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Cancel ride error:', error);
              Alert.alert('Lỗi', 'Không thể hủy chuyến xe. Vui lòng thử lại.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    if (selectedProposal?.driverPhone) {
      // In a real app, you would use Linking.openURL(`tel:${selectedProposal.driverPhone}`)
      Alert.alert('Gọi tài xế', `Số điện thoại: ${selectedProposal.driverPhone}`);
    }
  };

  const renderProposalCard = (proposal, index) => (
    <Animatable.View
      key={proposal.rideId || index}
      animation="fadeInUp"
      delay={index * 100}
      style={styles.proposalCard}
    >
      <View style={styles.proposalHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Icon name="person" size={24} color="#4CAF50" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{proposal.driverName}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{proposal.driverRating || '5.0'}</Text>
              <Text style={styles.ratingCount}>({proposal.ratingCount || '100'})</Text>
            </View>
          </View>
        </View>
        <View style={styles.proposalPrice}>
          <Text style={styles.priceAmount}>
            {rideService.formatCurrency(proposal.fare || quote?.totalFare || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.proposalDetails}>
        <View style={styles.detailRow}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.detailText}>
            Đón bạn trong {proposal.estimatedArrival || '5-10'} phút
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="directions-car" size={16} color="#666" />
          <Text style={styles.detailText}>
            {proposal.vehicleInfo || 'Honda Wave - 29A1-12345'}
          </Text>
        </View>
      </View>

      <ModernButton
        title="Chọn tài xế này"
        onPress={() => handleSelectProposal(proposal)}
        size="medium"
        icon="check"
      />
    </Animatable.View>
  );

  const renderRideStatus = () => {
    if (!selectedProposal) return null;

    const statusConfig = {
      'PENDING': {
        title: 'Đang chờ tài xế xác nhận',
        subtitle: 'Tài xế sẽ phản hồi trong vài phút',
        icon: 'hourglass-empty',
        color: '#FF9800'
      },
      'CONFIRMED': {
        title: 'Tài xế đang đến đón bạn',
        subtitle: `Dự kiến ${selectedProposal.estimatedArrival || '5-10'} phút`,
        icon: 'directions-car',
        color: '#4CAF50'
      },
      'ONGOING': {
        title: 'Đang trong chuyến đi',
        subtitle: 'Chúc bạn có chuyến đi an toàn',
        icon: 'navigation',
        color: '#2196F3'
      },
      'COMPLETED': {
        title: 'Chuyến đi hoàn thành',
        subtitle: 'Cảm ơn bạn đã sử dụng dịch vụ',
        icon: 'check-circle',
        color: '#4CAF50'
      }
    };

    const config = statusConfig[rideStatus] || statusConfig['PENDING'];

    return (
      <Animatable.View animation="slideInUp" style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: config.color + '20' }]}>
            <Icon name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{config.title}</Text>
            <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Icon name="person" size={24} color="#4CAF50" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{selectedProposal.driverName}</Text>
              <Text style={styles.vehicleInfo}>{selectedProposal.vehicleInfo}</Text>
            </View>
          </View>
          
          <View style={styles.driverActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCallDriver}
            >
              <Icon name="phone" size={20} color="#4CAF50" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Tin nhắn', 'Tính năng nhắn tin đang phát triển')}
            >
              <Icon name="message" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.tripRow}>
            <Icon name="radio-button-checked" size={16} color="#4CAF50" />
            <Text style={styles.tripText} numberOfLines={1}>
              {quote?.pickupAddress || 'Điểm đón'}
            </Text>
          </View>
          
          <View style={styles.tripDivider} />
          
          <View style={styles.tripRow}>
            <Icon name="location-on" size={16} color="#F44336" />
            <Text style={styles.tripText} numberOfLines={1}>
              {quote?.dropoffAddress || 'Điểm đến'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <ModernButton
            title="Hủy chuyến"
            onPress={handleCancelRide}
            disabled={loading || rideStatus === 'ONGOING'}
            variant="outline"
            size="medium"
            icon="cancel"
          />
          
          {rideStatus === 'COMPLETED' && (
            <ModernButton
              title="Đánh giá"
              onPress={() => navigation.navigate('RideRating', { ride: selectedProposal })}
              size="medium"
              icon="star"
            />
          )}
        </View>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showProposals ? 'Chọn tài xế' : 'Theo dõi chuyến xe'}
        </Text>
      </View>

      {/* Map */}
      <GoongMap
        onRef={(ref) => (mapRef.current = ref)}
        style={styles.map}
        initialRegion={
          currentLocation
            ? locationService.getMapRegion(currentLocation.latitude, currentLocation.longitude)
            : {
                latitude: 10.8231,
                longitude: 106.6297,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
        showsUserLocation={true}
        markers={[
          ...(quote?.pickup ? [{
            coordinate: quote.pickup,
            title: "Điểm đón",
            pinColor: "#4CAF50"
          }] : []),
          ...(quote?.dropoff ? [{
            coordinate: quote.dropoff,
            title: "Điểm đến",
            pinColor: "#F44336"
          }] : []),
          ...(selectedProposal?.driverLocation ? [{
            coordinate: selectedProposal.driverLocation,
            title: `Tài xế ${selectedProposal.driverName}`,
            pinColor: "#2196F3"
          }] : [])
        ]}
      />

      {/* Bottom Content */}
      {showProposals ? (
        <View style={styles.proposalsContainer}>
          <Text style={styles.proposalsTitle}>
            Tìm thấy {proposals?.length || 0} tài xế phù hợp
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.proposalsList}
          >
            {proposals?.map((proposal, index) => renderProposalCard(proposal, index))}
          </ScrollView>
        </View>
      ) : (
        renderRideStatus()
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang xử lý...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  proposalsContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
    maxHeight: height * 0.4,
  },
  proposalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  proposalsList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  proposalCard: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  proposalPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  proposalDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tripDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  tripDivider: {
    height: 20,
    width: 1,
    backgroundColor: '#ddd',
    marginLeft: 8,
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
});

export default RideTrackingScreen;
