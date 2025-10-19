import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import locationService from '../../services/locationService';
import rideService from '../../services/rideService';
import authService from '../../services/authService';
import goongService from '../../services/goongService';
import poiService from '../../services/poiService';
import { locationStorageService } from '../../services/locationStorageService';
import ModernButton from '../../components/ModernButton.jsx';
import AddressInput from '../../components/AddressInput';
import GoongMap from '../../components/GoongMap.jsx';
import addressValidation from '../../utils/addressValidation';

const { width, height } = Dimensions.get('window');

const RideBookingScreen = ({ navigation, route }) => {
  // Location states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  // UI states
  const [isSelectingPickup, setIsSelectingPickup] = useState(false);
  const [isSelectingDropoff, setIsSelectingDropoff] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [routePolyline, setRoutePolyline] = useState(null);

  // Map ref
  const mapRef = useRef(null);
  
  // Fixed initial region to prevent WebView reload
  const initialRegionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (mounted) {
        await initializeLocationWithCache();
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
      locationService.stopLocationTracking();
    };
  }, []);

  // Handle navigation params
  useEffect(() => {
    const handleRouteParams = async () => {
      if (route.params) {
        const { pickup, dropoff, pickupAddress: pAddress, dropoffAddress: dAddress } = route.params;
        
        if (pickup) {
          setPickupLocation(pickup);
          if (pAddress) {
            setPickupAddress(pAddress);
          } else {
            // Get address from coordinates
            try {
              const address = await locationService.getAddressFromCoordinates(pickup.latitude, pickup.longitude);
              setPickupAddress(address || 'Vị trí hiện tại');
            } catch (error) {
              setPickupAddress('Vị trí hiện tại');
            }
          }
        }
        
        if (dropoff) {
          setDropoffLocation(dropoff);
          if (dAddress) {
            setDropoffAddress(dAddress);
          } else {
            // Get address from coordinates
            try {
              const address = await locationService.getAddressFromCoordinates(dropoff.latitude, dropoff.longitude);
              setDropoffAddress(address || 'Điểm đến đã chọn');
            } catch (error) {
              setDropoffAddress('Điểm đến đã chọn');
            }
          }
        }
      }
    };
    
    handleRouteParams();
  }, [route.params]);

  // Set initial region once when currentLocation is available
  useEffect(() => {
    if (currentLocation && !initialRegionRef.current) {
      initialRegionRef.current = locationService.getMapRegion(
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
  }, [currentLocation]);

  // Memoized markers to prevent unnecessary re-renders
  const mapMarkers = React.useMemo(() => {
    const markers = [];
    if (pickupLocation) {
      markers.push({
        coordinate: pickupLocation,
        title: "Điểm đón",
        description: pickupAddress,
        pinColor: "#4CAF50"
      });
    }
    if (dropoffLocation) {
      markers.push({
        coordinate: dropoffLocation,
        title: "Điểm đến", 
        description: dropoffAddress,
        pinColor: "#F44336"
      });
    }
    return markers;
  }, [pickupLocation, dropoffLocation, pickupAddress, dropoffAddress]);

  const initializeLocationWithCache = async () => {
    try {
      setLoadingLocation(true);
      
      // Try to get cached location first
      const locationData = await locationStorageService.getCurrentLocationWithAddress();
      
      if (locationData.location) {
        setCurrentLocation(locationData.location);
        
        // Set pickup to current location by default
        setPickupLocation(locationData.location);
        
        // Use cached address if available
        if (locationData.address) {
          setPickupAddress(locationData.address.shortAddress || 'Vị trí hiện tại');
        } else {
          setPickupAddress('Vị trí hiện tại');
        }
      } else {
        // Fallback to regular location service
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        setPickupLocation(location);
        setPickupAddress('Vị trí hiện tại');
      }

      // Start location tracking only once
      if (!locationService.watchId) {
        locationService.startLocationTracking((newLocation) => {
          setCurrentLocation(newLocation);
          // Update cache with new location
          locationStorageService.saveCurrentLocation(newLocation);
        });
      }

    } catch (error) {
      console.error('Error initializing location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và quyền truy cập.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    if (!isSelectingPickup && !isSelectingDropoff) {
      return; // Not in selection mode
    }

    try {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      console.log('Map pressed:', { latitude, longitude });

      // Get address for the coordinates
      const address = await locationService.getAddressFromCoordinates(latitude, longitude);
      const addressText = address?.formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      // Try to find nearby POI
      const nearbyPOI = await poiService.findLocationByCoordinates(latitude, longitude, 200); // 200m radius

      const locationData = nearbyPOI ? {
        id: nearbyPOI.locationId,
        locationId: nearbyPOI.locationId,
        latitude: nearbyPOI.latitude,
        longitude: nearbyPOI.longitude,
        name: nearbyPOI.name,
        isPOI: true
      } : {
        latitude: latitude,
        longitude: longitude,
        isPOI: false
      };

      if (isSelectingPickup) {
        setPickupLocation(locationData);
        setPickupAddress(nearbyPOI ? nearbyPOI.name : addressText);
        setIsSelectingPickup(false);
        console.log('Pickup location set:', locationData);
      } else if (isSelectingDropoff) {
        setDropoffLocation(locationData);
        setDropoffAddress(nearbyPOI ? nearbyPOI.name : addressText);
        setIsSelectingDropoff(false);
        console.log('Dropoff location set:', locationData);
      }
    } catch (error) {
      console.error('Error handling map press:', error);
      Alert.alert('Lỗi', 'Không thể xác định địa chỉ cho vị trí này');
    }
  };

  const handleGetQuote = async () => {
    // Check if we have addresses at minimum
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập điểm đón và điểm đến');
      return;
    }

    // Validate addresses
    const validation = addressValidation.validateAddresses(pickupAddress, dropoffAddress);
    if (!validation.isValid) {
      Alert.alert('Địa chỉ không hợp lệ', validation.message);
      return;
    }

    // Process pickup location - prefer POI, fallback to coordinates
    let pickup = pickupLocation;
    if (!pickup && pickupAddress.trim()) {
      try {
        // First try to find POI by address
        const pickupPOI = await poiService.searchLocations(pickupAddress, 1);
        if (pickupPOI && pickupPOI.length > 0) {
          pickup = {
            id: pickupPOI[0].id,
            locationId: pickupPOI[0].id,
            latitude: pickupPOI[0].latitude,
            longitude: pickupPOI[0].longitude,
            name: pickupPOI[0].name,
            isPOI: true
          };
          console.log('Found pickup POI:', pickup);
        } else {
          // Fallback to geocoding
          const pickupCoords = await goongService.geocode(pickupAddress);
          if (pickupCoords && pickupCoords.geometry && pickupCoords.geometry.location) {
            // Try to find nearby POI for these coordinates
            pickup = await poiService.coordinatesToPOI(
              pickupCoords.geometry.location.latitude,
              pickupCoords.geometry.location.longitude
            );
            console.log('Pickup location processed:', pickup);
          }
        }
        setPickupLocation(pickup);
      } catch (error) {
        console.error('Error processing pickup location:', error);
      }
    }

    // Process dropoff location - prefer POI, fallback to coordinates
    let dropoff = dropoffLocation;
    if (!dropoff && dropoffAddress.trim()) {
      try {
        // First try to find POI by address
        const dropoffPOI = await poiService.searchLocations(dropoffAddress, 1);
        if (dropoffPOI && dropoffPOI.length > 0) {
          dropoff = {
            id: dropoffPOI[0].id,
            locationId: dropoffPOI[0].id,
            latitude: dropoffPOI[0].latitude,
            longitude: dropoffPOI[0].longitude,
            name: dropoffPOI[0].name,
            isPOI: true
          };
          console.log('Found dropoff POI:', dropoff);
        } else {
          // Fallback to geocoding
          const dropoffCoords = await goongService.geocode(dropoffAddress);
          if (dropoffCoords && dropoffCoords.geometry && dropoffCoords.geometry.location) {
            // Try to find nearby POI for these coordinates
            dropoff = await poiService.coordinatesToPOI(
              dropoffCoords.geometry.location.latitude,
              dropoffCoords.geometry.location.longitude
            );
            console.log('Dropoff location processed:', dropoff);
          }
        }
        setDropoffLocation(dropoff);
      } catch (error) {
        console.error('Error processing dropoff location:', error);
      }
    }

    if (!pickup || !dropoff) {
      Alert.alert('Lỗi', 'Không thể xác định tọa độ cho địa chỉ đã nhập');
      return;
    }

    try {
      setLoading(true);
      
      // Get desired pickup time (optional - can be set by user)
      const desiredPickupTime = null; // TODO: Add time picker
      const notes = null; // TODO: Add notes input
      
      const quoteData = await rideService.getQuote(pickup, dropoff, desiredPickupTime, notes);
      
      // Process the quote data to match our UI needs
      const processedQuote = {
        ...quoteData, // có: distanceM, durationS, expiresAt, fare.{total,subtotal,base2Km,after2KmPerKm,...}, polyline
        pickup,
        dropoff,
        pickupAddress,
        dropoffAddress,
      
        distance: (typeof quoteData.distanceM === 'number')
          ? quoteData.distanceM / 1000
          : null,
      
        estimatedDuration: (typeof quoteData.durationS === 'number')
          ? Math.round(quoteData.durationS / 60)
          : null,
      
        // map sang tên cũ UI đang hiển thị, nhưng từ giá trị đã normalize
        totalFare: quoteData.fare?.total ?? null,
        baseFare: quoteData.fare?.base2Km ?? null,             // giá mở cửa 2km đầu
        distanceFare: quoteData.fare?.after2KmPerKm ?? null,    // đơn giá/km sau 2km
        timeFare: null,                                         // BE hiện chưa cung cấp theo phút
        validUntil: quoteData.expiresAt
      };
      
      setQuote(processedQuote);
      setShowQuote(true);
      
      // Store polyline data to pass to map component
      if (quoteData.polyline) {
        const decodedPolyline = goongService.decodePolyline(quoteData.polyline);
        
        // Convert to format expected by GoongMap: [[lng, lat], [lng, lat], ...] for MapBox GL
        const formattedPolyline = decodedPolyline.map(point => [point.longitude, point.latitude]);
        
        // Only set if different to prevent unnecessary re-renders
        if (JSON.stringify(routePolyline) !== JSON.stringify(formattedPolyline)) {
          setRoutePolyline(formattedPolyline);
        }
        
        // Fit map to show entire route
        if (mapRef.current && decodedPolyline.length > 0) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(decodedPolyline, { edgePadding: 50 });
          }, 500); // Small delay to ensure map is ready
        }
      }
      
    } catch (error) {
      console.error('Get quote error:', error);
      Alert.alert('Lỗi', 'Không thể tính giá cước. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!quote) return;

    try {
      setLoading(true);
      console.log('Booking ride with quoteId:', quote.quoteId);
      const result = await rideService.bookRide(quote.quoteId);
      console.log('Book ride result:', result);
      
      // Navigate to rider matching screen
      navigation.navigate('RiderMatching', {
        rideRequest: {
          ...result,
          quote: quote,
          pickupAddress: pickupAddress,
          dropoffAddress: dropoffAddress,
          fare: quote.fare
        }
      });
    } catch (error) {
      console.error('Book ride error:', error);
      let errorMessage = 'Không thể đặt xe. Vui lòng thử lại.';
      
      if (error.status === 402) {
        errorMessage = 'Số dư ví không đủ. Vui lòng nạp thêm tiền.';
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy tài xế phù hợp trong khu vực.';
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const centerMapToLocation = (location) => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const fitMapToMarkers = () => {
    if (mapRef.current && pickupLocation && dropoffLocation) {
      const coordinates = [pickupLocation, dropoffLocation];
      const region = locationService.getRegionForCoordinates(coordinates, 0.02);
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang lấy vị trí hiện tại...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt xe</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Map */}
      {goongService.isMapsConfigured() ? (
        <GoongMap
          onRef={(ref) => (mapRef.current = ref)}
          style={styles.map}
          initialRegion={
            initialRegionRef.current || {
              latitude: 10.8231,
              longitude: 106.6297,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }
          }
          onMapPress={handleMapPress}
          showsUserLocation={true}
          polyline={routePolyline}
          markers={mapMarkers}
        />
      ) : (
        <View style={[styles.map, styles.mapPlaceholder]}>
          <View style={styles.mapPlaceholderContent}>
            <Icon name="map" size={60} color="#ccc" />
            <Text style={styles.mapPlaceholderTitle}>Bản đồ không khả dụng</Text>
            <Text style={styles.mapPlaceholderText}>
              Vui lòng cấu hình Goong API key{'\n'}
              hoặc sử dụng chức năng nhập địa chỉ bên dưới
            </Text>
          </View>
        </View>
      )}

      {/* Location Selection Overlay */}
      {(isSelectingPickup || isSelectingDropoff) && (
        <View style={styles.selectionOverlay}>
          <View style={styles.crosshair}>
            <Icon name="my-location" size={30} color="#4CAF50" />
          </View>
          <Animatable.View 
            animation="slideInUp" 
            style={styles.selectionPrompt}
          >
            <Text style={styles.selectionText}>
              {isSelectingPickup ? 'Chọn điểm đón' : 'Chọn điểm đến'}
            </Text>
            <TouchableOpacity
              style={styles.cancelSelectionButton}
              onPress={() => {
                setIsSelectingPickup(false);
                setIsSelectingDropoff(false);
              }}
            >
              <Text style={styles.cancelSelectionText}>Hủy</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => centerMapToLocation(currentLocation)}
        >
          <Icon name="my-location" size={24} color="#4CAF50" />
        </TouchableOpacity>
        
        {pickupLocation && dropoffLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={fitMapToMarkers}
          >
            <Icon name="zoom-out-map" size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Panel */}
      <Animatable.View 
        animation="slideInUp" 
        style={styles.bottomPanel}
      >
        {!showQuote ? (
          <>
            {/* Location Inputs */}
            <View style={styles.locationInputs}>
              <AddressInput
                value={pickupAddress}
                onChangeText={setPickupAddress}
                onLocationSelect={(location) => {
                  setPickupLocation(location);
                  setPickupAddress(location.address);
                }}
                placeholder="Chọn điểm đón"
                iconName="radio-button-checked"
                iconColor="#4CAF50"
                style={styles.addressInput}
                isPickupInput={true}
                currentLocation={currentLocation}
              />
              
              {/* Pickup location selection button */}
              <TouchableOpacity 
                style={styles.mapSelectionButton}
                onPress={() => setIsSelectingPickup(true)}
              >
                <Icon name="my-location" size={16} color="#4CAF50" />
                <Text style={styles.mapSelectionText}>Chọn trên bản đồ</Text>
              </TouchableOpacity>

              <View style={styles.locationDivider}>
                <View style={styles.dividerLine} />
                <Icon name="more-vert" size={16} color="#ccc" />
                <View style={styles.dividerLine} />
              </View>

              <AddressInput
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
                onLocationSelect={(location) => {
                  setDropoffLocation(location);
                  setDropoffAddress(location.address);
                }}
                placeholder="Chọn điểm đến"
                iconName="location-on"
                iconColor="#F44336"
                style={styles.addressInput}
              />
              
              {/* Dropoff location selection button */}
              <TouchableOpacity 
                style={styles.mapSelectionButton}
                onPress={() => setIsSelectingDropoff(true)}
              >
                <Icon name="my-location" size={16} color="#F44336" />
                <Text style={styles.mapSelectionText}>Chọn trên bản đồ</Text>
              </TouchableOpacity>
            </View>

            {/* Get Quote Button */}
            <ModernButton
              title={loading ? "Đang tính giá..." : "Xem giá cước"}
              onPress={handleGetQuote}
              disabled={loading || !pickupAddress.trim() || !dropoffAddress.trim()}
              icon={loading ? null : "calculate"}
              size="large"
            />
          </>
        ) : (
          <>
            {/* Quote Display */}
            <View style={styles.quoteContainer}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteTitle}>Chi tiết giá cước</Text>
              </View>

              <View style={styles.quoteDetails}>
                {/* Route Info */}
                <View style={styles.routeInfo}>
                  <View style={styles.routeItem}>
                    <Icon name="radio-button-checked" size={16} color="#4CAF50" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {quote?.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.routeItem}>
                    <Icon name="location-on" size={16} color="#F44336" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {quote?.dropoffAddress}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.quoteDivider} />
                
                {/* Trip Details */}
                <View style={styles.tripDetails}>
                  <View style={styles.tripDetailItem}>
                    <Icon name="straighten" size={20} color="#2196F3" />
                    <View style={styles.tripDetailContent}>
                      <Text style={styles.tripDetailLabel}>Khoảng cách</Text>
                      <Text style={styles.tripDetailValue}>{quote?.distance?.toFixed(1)} km</Text>
                    </View>
                  </View>
                  <View style={styles.tripDetailItem}>
                    <Icon name="schedule" size={20} color="#FF9800" />
                    <View style={styles.tripDetailContent}>
                      <Text style={styles.tripDetailLabel}>Thời gian</Text>
                      <Text style={styles.tripDetailValue}>{quote?.estimatedDuration} phút</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.quoteDivider} />
                
                {/* Fare Breakdown */}
                <View style={styles.fareBreakdown}>
                  <Text style={styles.fareTitle}>Chi tiết giá cước</Text>
                  
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Cước cơ bản:</Text>
                    <Text style={styles.quoteValue}>{quote?.baseFare?.toLocaleString()} đ</Text>
                  </View>
                  
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Phí theo km:</Text>
                    <Text style={styles.quoteValue}>{quote?.distanceFare?.toLocaleString()} đ</Text>
                  </View>
                  
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteLabel}>Phí theo thời gian:</Text>
                    <Text style={styles.quoteValue}>{quote?.timeFare?.toLocaleString()} đ</Text>
                  </View>
                  
                  {quote?.fare?.surcharge?.amount > 0 && (
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Phụ phí:</Text>
                      <Text style={styles.quoteValue}>{quote.fare.surcharge.amount?.toLocaleString()} đ</Text>
                    </View>
                  )}
                  
                  {quote?.fare?.discount?.amount > 0 && (
                    <View style={styles.quoteRow}>
                      <Text style={[styles.quoteLabel, { color: '#4CAF50' }]}>Giảm giá:</Text>
                      <Text style={[styles.quoteValue, { color: '#4CAF50' }]}>-{quote.fare.discount.amount?.toLocaleString()} đ</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.quoteDivider} />
                
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteTotalLabel}>Tổng cộng:</Text>
                  <Text style={styles.quoteTotalValue}>{quote?.totalFare?.toLocaleString()} đ</Text>
                </View>
                
                {/* Expiry Info */}
                <Text style={styles.expiryText}>
                  Báo giá có hiệu lực đến {quote?.validUntil ? new Date(quote.validUntil).toLocaleTimeString('vi-VN') : ''}
                </Text>
              </View>
            </View>

            {/* Book Ride Button */}
            <ModernButton
              title={loading ? "Đang đặt xe..." : "Đặt xe ngay"}
              onPress={handleBookRide}
              disabled={loading}
              icon={loading ? null : "directions-car"}
              size="large"
            />
          </>
        )}
      </Animatable.View>
    </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40, // Same width as back button to center title
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
    color: '#666',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderContent: {
    alignItems: 'center',
    padding: 40,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -15,
    marginLeft: -15,
  },
  selectionPrompt: {
    position: 'absolute',
    bottom: 200,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 15,
  },
  cancelSelectionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  cancelSelectionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 100 : 80,
    gap: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  locationInputs: {
    marginBottom: 20,
  },
  addressInput: {
    marginBottom: 5,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 5,
  },
  locationTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  locationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 25,
    marginVertical: 5,
  },
  dividerLine: {
    width: 1,
    height: 8,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
  },
  quoteContainer: {
    marginBottom: 20,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quoteDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#666',
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  quoteDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  quoteTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quoteTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // New styles for enhanced quote display
  routeInfo: {
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  routeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripDetailContent: {
    marginLeft: 8,
    alignItems: 'center',
  },
  tripDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  tripDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fareBreakdown: {
    marginBottom: 15,
  },
  fareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  expiryText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  mapSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  mapSelectionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default RideBookingScreen;
