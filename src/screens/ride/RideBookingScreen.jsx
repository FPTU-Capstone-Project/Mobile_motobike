import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import locationService from '../../services/LocationService';
import rideService from '../../services/rideService';
import authService from '../../services/authService';
import goongService from '../../services/goongService';
import poiService from '../../services/poiService';
import { locationStorageService } from '../../services/locationStorageService';
import ModernButton from '../../components/ModernButton.jsx';
import AddressInput from '../../components/AddressInput';
import GoongMap from '../../components/GoongMap.jsx';
import addressValidation from '../../utils/addressValidation';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import AppBackground from '../../components/layout/AppBackground.jsx';
import { colors, gradients, radii, spacing, shadows, typography } from '../../theme/designTokens';

const { width, height } = Dimensions.get('window');

const RideBookingScreen = ({ navigation, route }) => {
  // Get safe area insets for proper header positioning
  const insets = useSafeAreaInsets();
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
      const result = await rideService.bookRide(quote.quoteId);
      
      
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
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <SoftBackHeader
            title="Đặt xe"
            onBackPress={() => navigation.goBack()}
            floating={false}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Đang lấy vị trí hiện tại...</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header with Back Button */}
          <SoftBackHeader
            title="Đặt xe"
            onBackPress={() => navigation.goBack()}
            floating={true}
            topOffset={insets.top + 8}
          />

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
            <Icon name="my-location" size={30} color={colors.accent} />
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
        <CleanCard style={styles.controlButtonCard}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => centerMapToLocation(currentLocation)}
          >
            <Icon name="my-location" size={22} color={colors.accent} />
          </TouchableOpacity>
        </CleanCard>
        
        {pickupLocation && dropoffLocation && (
          <CleanCard style={styles.controlButtonCard}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={fitMapToMarkers}
            >
              <Icon name="zoom-out-map" size={22} color={colors.accent} />
            </TouchableOpacity>
          </CleanCard>
        )}
      </View>

      {/* Bottom Panel */}
      <Animatable.View 
        animation="slideInUp" 
        style={styles.bottomPanel}
      >
        {!showQuote ? (
          <>
            {/* Location Inputs Card */}
            <CleanCard style={styles.locationCard}>
              <View style={styles.locationInputs}>
                <View style={styles.locationInputRow}>
                  <View style={styles.locationIconContainer}>
                    <Icon name="radio-button-checked" size={20} color={colors.accent} />
                  </View>
                  <View style={styles.locationInputContent}>
                    <Text style={styles.locationLabel}>Điểm đón</Text>
                    <AddressInput
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      onLocationSelect={(location) => {
                        setPickupLocation(location);
                        setPickupAddress(location.address);
                      }}
                      placeholder="Chọn điểm đón"
                      iconName="radio-button-checked"
                      iconColor={colors.accent}
                      style={styles.addressInput}
                      isPickupInput={true}
                      currentLocation={currentLocation}
                    />
                  </View>
                </View>
                
                {/* Pickup location selection button */}
                <TouchableOpacity 
                  style={styles.mapSelectionButton}
                  onPress={() => setIsSelectingPickup(true)}
                >
                  <Icon name="my-location" size={16} color={colors.accent} />
                  <Text style={styles.mapSelectionText}>Chọn trên bản đồ</Text>
                </TouchableOpacity>

                <View style={styles.locationDivider}>
                  <View style={styles.dividerLine} />
                  <Icon name="more-vert" size={16} color={colors.textMuted} />
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.locationInputRow}>
                  <View style={styles.locationIconContainer}>
                    <Icon name="location-on" size={20} color="#F44336" />
                  </View>
                  <View style={styles.locationInputContent}>
                    <Text style={styles.locationLabel}>Điểm đến</Text>
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
                  </View>
                </View>
              
                {/* Dropoff location selection button */}
                <TouchableOpacity 
                  style={[styles.mapSelectionButton, { marginTop: spacing.xs }]}
                  onPress={() => setIsSelectingDropoff(true)}
                >
                  <Icon name="my-location" size={16} color="#F44336" />
                  <Text style={styles.mapSelectionText}>Chọn trên bản đồ</Text>
                </TouchableOpacity>
              </View>
            </CleanCard>

            {/* Get Quote Button */}
            <View style={styles.buttonContainer}>
              <ModernButton
                title={loading ? "Đang tính giá..." : "Xem giá cước"}
                onPress={handleGetQuote}
                disabled={loading || !pickupAddress.trim() || !dropoffAddress.trim()}
                icon={loading ? null : "calculate"}
                size="large"
              />
            </View>
          </>
        ) : (
          <>
            {/* Quote Display Card */}
            <CleanCard style={styles.quoteCard}>
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
            </CleanCard>

            {/* Book Ride Button */}
            <View style={styles.buttonContainer}>
              <ModernButton
                title={loading ? "Đang đặt xe..." : "Đặt xe ngay"}
                onPress={handleBookRide}
                disabled={loading}
                icon={loading ? null : "directions-car"}
                size="large"
              />
            </View>
          </>
        )}
      </Animatable.View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  mapPlaceholderTitle: {
    fontSize: typography.subheading,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  mapPlaceholderText: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.floating,
  },
  selectionText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.md,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelSelectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radii.md,
  },
  cancelSelectionText: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  controlButtons: {
    position: 'absolute',
    right: spacing.lg,
    top: Platform.OS === 'ios' ? 100 : 80,
    gap: spacing.sm,
    zIndex: 10,
  },
  controlButtonCard: {
    width: 48,
    height: 48,
    padding: 0,
  },
  controlButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg,
    maxHeight: height * 0.6,
  },
  locationCard: {
    marginBottom: spacing.md,
  },
  locationInputs: {
    gap: spacing.sm,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationIconContainer: {
    marginTop: 4,
  },
  locationInputContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontFamily: 'Inter_500Medium',
  },
  addressInput: {
    marginBottom: 0,
  },
  buttonContainer: {
    marginTop: spacing.sm,
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
    paddingLeft: 28,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    width: 1,
    height: 8,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  quoteCard: {
    marginBottom: spacing.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quoteTitle: {
    fontSize: typography.subheading,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  quoteDetails: {
    gap: spacing.sm,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quoteLabel: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  quoteValue: {
    fontSize: typography.small,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: 'Inter_500Medium',
  },
  quoteDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  quoteTotalLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  quoteTotalValue: {
    fontSize: typography.subheading,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'Inter_700Bold',
  },
  // Enhanced quote display styles
  routeInfo: {
    marginBottom: spacing.md,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  routeText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.small,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripDetailContent: {
    marginLeft: spacing.xs,
    alignItems: 'center',
  },
  tripDetailLabel: {
    fontSize: typography.small - 1,
    color: colors.textMuted,
    marginBottom: 2,
    fontFamily: 'Inter_400Regular',
  },
  tripDetailValue: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  fareBreakdown: {
    marginBottom: spacing.md,
  },
  fareTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  expiryText: {
    fontSize: typography.small - 1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
  },
  mapSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  mapSelectionText: {
    fontSize: typography.small - 1,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
});

export default RideBookingScreen;
