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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
import { colors } from '../../theme/designTokens';

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
        pinColor: "#22C55E"
      });
    }
    if (dropoffLocation) {
      markers.push({
        coordinate: dropoffLocation,
        title: "Điểm đến", 
        description: dropoffAddress,
        pinColor: "#EF4444"
      });
    }
    return markers;
  }, [pickupLocation, dropoffLocation, pickupAddress, dropoffAddress]);

  const initializeLocationWithCache = async () => {
    try {
      setLoadingLocation(true);
      
      const locationData = await locationStorageService.getCurrentLocationWithAddress();
      
      if (locationData.location) {
        setCurrentLocation(locationData.location);
        setPickupLocation(locationData.location);
        
        if (locationData.address) {
          setPickupAddress(locationData.address.shortAddress || 'Vị trí hiện tại');
        } else {
          setPickupAddress('Vị trí hiện tại');
        }
      } else {
        const location = await locationService.getCurrentLocation();
        setCurrentLocation(location);
        setPickupLocation(location);
        setPickupAddress('Vị trí hiện tại');
      }

      if (!locationService.watchId) {
        locationService.startLocationTracking((newLocation) => {
          setCurrentLocation(newLocation);
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
      return;
    }

    try {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      console.log('Map pressed:', { latitude, longitude });

      const address = await locationService.getAddressFromCoordinates(latitude, longitude);
      const addressText = address?.formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const nearbyPOI = await poiService.findLocationByCoordinates(latitude, longitude, 200);

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
      } else if (isSelectingDropoff) {
        setDropoffLocation(locationData);
        setDropoffAddress(nearbyPOI ? nearbyPOI.name : addressText);
        setIsSelectingDropoff(false);
      }
    } catch (error) {
      console.error('Error handling map press:', error);
      Alert.alert('Lỗi', 'Không thể xác định địa chỉ cho vị trí này');
    }
  };

  const handleGetQuote = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập điểm đón và điểm đến');
      return;
    }

    const validation = addressValidation.validateAddresses(pickupAddress, dropoffAddress);
    if (!validation.isValid) {
      Alert.alert('Địa chỉ không hợp lệ', validation.message);
      return;
    }

    let pickup = pickupLocation;
    if (!pickup && pickupAddress.trim()) {
      try {
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
        } else {
          const pickupCoords = await goongService.geocode(pickupAddress);
          if (pickupCoords && pickupCoords.geometry && pickupCoords.geometry.location) {
            pickup = await poiService.coordinatesToPOI(
              pickupCoords.geometry.location.latitude,
              pickupCoords.geometry.location.longitude
            );
          }
        }
        setPickupLocation(pickup);
      } catch (error) {
        console.error('Error processing pickup location:', error);
      }
    }

    let dropoff = dropoffLocation;
    if (!dropoff && dropoffAddress.trim()) {
      try {
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
        } else {
          const dropoffCoords = await goongService.geocode(dropoffAddress);
          if (dropoffCoords && dropoffCoords.geometry && dropoffCoords.geometry.location) {
            dropoff = await poiService.coordinatesToPOI(
              dropoffCoords.geometry.location.latitude,
              dropoffCoords.geometry.location.longitude
            );
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
      
      const desiredPickupTime = null;
      const notes = null;
      
      const quoteData = await rideService.getQuote(pickup, dropoff, desiredPickupTime, notes);
      
      const processedQuote = {
        ...quoteData,
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
        totalFare: quoteData.fare?.total ?? null,
        baseFare: quoteData.fare?.base2Km ?? null,
        distanceFare: quoteData.fare?.after2KmPerKm ?? null,
        timeFare: null,
        validUntil: quoteData.expiresAt
      };
      
      setQuote(processedQuote);
      setShowQuote(true);
      
      if (quoteData.polyline) {
        const decodedPolyline = goongService.decodePolyline(quoteData.polyline);
        const formattedPolyline = decodedPolyline.map(point => [point.longitude, point.latitude]);
        
        if (JSON.stringify(routePolyline) !== JSON.stringify(formattedPolyline)) {
          setRoutePolyline(formattedPolyline);
        }
        
        if (mapRef.current && decodedPolyline.length > 0) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(decodedPolyline, { edgePadding: 50 });
          }, 500);
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
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
        <StatusBar barStyle="dark-content" />
        
        {/* Map - Full Screen */}
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
              <Icon name="map" size={60} color={colors.textMuted} />
              <Text style={styles.mapPlaceholderTitle}>Bản đồ không khả dụng</Text>
              <Text style={styles.mapPlaceholderText}>
                Vui lòng cấu hình Goong API key{'\n'}
                hoặc sử dụng chức năng nhập địa chỉ bên dưới
              </Text>
            </View>
          </View>
        )}

        {/* Header - Absolute Positioned */}
        <View style={styles.headerContainer}>
          <SoftBackHeader
            title="Đặt xe"
            subtitle="Chọn điểm đón và điểm đến"
            onBackPress={() => navigation.goBack()}
            floating={true}
            topOffset={Platform.OS === 'ios' ? 50 : 40}
          />
        </View>

        {/* Location Selection Overlay */}
        {(isSelectingPickup || isSelectingDropoff) && (
          <View style={styles.selectionOverlay}>
            <View style={styles.crosshair}>
              <Icon name="my-location" size={32} color={colors.accent} />
            </View>
            <Animatable.View 
              animation="slideInUp" 
              style={styles.selectionPrompt}
            >
              <CleanCard contentStyle={styles.selectionPromptContent}>
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
              </CleanCard>
            </Animatable.View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <CleanCard style={styles.controlButtonCard} contentStyle={styles.controlButtonContent}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => centerMapToLocation(currentLocation)}
            >
              <Icon name="my-location" size={22} color={colors.accent} />
            </TouchableOpacity>
            
            {pickupLocation && dropoffLocation && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={fitMapToMarkers}
              >
                <Icon name="zoom-out-map" size={22} color={colors.accent} />
              </TouchableOpacity>
            )}
          </CleanCard>
        </View>

        {/* Bottom Panel - Card Based */}
        <Animatable.View 
          animation="slideInUp" 
          style={styles.bottomPanel}
        >
          {!showQuote ? (
            <View style={styles.inputsContainer}>
              {/* Pickup Location Card */}
              <Animatable.View animation="fadeInUp" duration={400}>
                <CleanCard style={styles.locationCard} contentStyle={styles.locationCardContent}>
                  <View style={styles.locationHeader}>
                    <View style={[styles.locationIcon, { backgroundColor: '#22C55E20' }]}>
                      <Icon name="radio-button-checked" size={20} color="#22C55E" />
                    </View>
                    <Text style={styles.locationLabel}>Điểm đón</Text>
                  </View>
                  
                  <AddressInput
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    onLocationSelect={(location) => {
                      setPickupLocation(location);
                      setPickupAddress(location.address);
                    }}
                    placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                    iconName="radio-button-checked"
                    iconColor="#22C55E"
                    style={styles.addressInput}
                    isPickupInput={true}
                    currentLocation={currentLocation}
                  />
                  
                  <TouchableOpacity 
                    style={styles.mapSelectionButton}
                    onPress={() => setIsSelectingPickup(true)}
                  >
                    <Icon name="my-location" size={16} color="#22C55E" />
                    <Text style={styles.mapSelectionText}>Chọn trên bản đồ</Text>
                  </TouchableOpacity>
                </CleanCard>
              </Animatable.View>

              {/* Dropoff Location Card */}
              <Animatable.View animation="fadeInUp" duration={400} delay={60}>
                <CleanCard style={styles.locationCard} contentStyle={styles.locationCardContent}>
                  <View style={styles.locationHeader}>
                    <View style={[styles.locationIcon, { backgroundColor: '#EF444420' }]}>
                      <Icon name="location-on" size={20} color="#EF4444" />
                    </View>
                    <Text style={styles.locationLabel}>Điểm đến</Text>
                  </View>
                  
                  <AddressInput
                    value={dropoffAddress}
                    onChangeText={setDropoffAddress}
                    onLocationSelect={(location) => {
                      setDropoffLocation(location);
                      setDropoffAddress(location.address);
                    }}
                    placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                    iconName="location-on"
                    iconColor="#EF4444"
                    style={styles.addressInput}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.mapSelectionButton, { borderColor: '#EF4444' }]}
                    onPress={() => setIsSelectingDropoff(true)}
                  >
                    <Icon name="my-location" size={16} color="#EF4444" />
                    <Text style={[styles.mapSelectionText, { color: '#EF4444' }]}>Chọn trên bản đồ</Text>
                  </TouchableOpacity>
                </CleanCard>
              </Animatable.View>

              {/* Get Quote Button */}
              <Animatable.View animation="fadeInUp" duration={400} delay={120}>
                <ModernButton
                  title={loading ? "Đang tính giá..." : "Xem giá cước"}
                  onPress={handleGetQuote}
                  disabled={loading || !pickupAddress.trim() || !dropoffAddress.trim()}
                  icon={loading ? null : "calculate"}
                  size="large"
                />
              </Animatable.View>
            </View>
          ) : (
            <View style={styles.quoteContainer}>
              {/* Quote Display Card */}
              <Animatable.View animation="fadeInUp" duration={400}>
                <CleanCard style={styles.quoteCard} contentStyle={styles.quoteCardContent}>
                  <View style={styles.quoteHeader}>
                    <Text style={styles.quoteTitle}>Chi tiết giá cước</Text>
                  </View>

                  <View style={styles.quoteDetails}>
                    {/* Route Info */}
                    <View style={styles.routeInfo}>
                      <View style={styles.routeItem}>
                        <Icon name="radio-button-checked" size={16} color="#22C55E" />
                        <Text style={styles.routeText} numberOfLines={1}>
                          {quote?.pickupAddress}
                        </Text>
                      </View>
                      <View style={styles.routeItem}>
                        <Icon name="location-on" size={16} color="#EF4444" />
                        <Text style={styles.routeText} numberOfLines={1}>
                          {quote?.dropoffAddress}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.quoteDivider} />
                    
                    {/* Trip Details */}
                    <View style={styles.tripDetails}>
                      <View style={styles.tripDetailItem}>
                        <Icon name="straighten" size={20} color={colors.accent} />
                        <View style={styles.tripDetailContent}>
                          <Text style={styles.tripDetailLabel}>Khoảng cách</Text>
                          <Text style={styles.tripDetailValue}>{quote?.distance?.toFixed(1)} km</Text>
                        </View>
                      </View>
                      <View style={styles.tripDetailItem}>
                        <Icon name="schedule" size={20} color="#F97316" />
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
                      
                      {quote?.fare?.surcharge?.amount > 0 && (
                        <View style={styles.quoteRow}>
                          <Text style={styles.quoteLabel}>Phụ phí:</Text>
                          <Text style={styles.quoteValue}>{quote.fare.surcharge.amount?.toLocaleString()} đ</Text>
                        </View>
                      )}
                      
                      {quote?.fare?.discount?.amount > 0 && (
                        <View style={styles.quoteRow}>
                          <Text style={[styles.quoteLabel, { color: '#22C55E' }]}>Giảm giá:</Text>
                          <Text style={[styles.quoteValue, { color: '#22C55E' }]}>-{quote.fare.discount.amount?.toLocaleString()} đ</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.quoteDivider} />
                    
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteTotalLabel}>Tổng cộng:</Text>
                      <Text style={styles.quoteTotalValue}>{quote?.totalFare?.toLocaleString()} đ</Text>
                    </View>
                    
                    <Text style={styles.expiryText}>
                      Báo giá có hiệu lực đến {quote?.validUntil ? new Date(quote.validUntil).toLocaleTimeString('vi-VN') : ''}
                    </Text>
                  </View>
                </CleanCard>
              </Animatable.View>

              {/* Book Ride Button */}
              <Animatable.View animation="fadeInUp" duration={400} delay={60}>
                <ModernButton
                  title={loading ? "Đang đặt xe..." : "Đặt xe ngay"}
                  onPress={handleBookRide}
                  disabled={loading}
                  icon={loading ? null : "directions-car"}
                  size="large"
                />
              </Animatable.View>
            </View>
          )}
        </Animatable.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderContent: {
    alignItems: 'center',
    padding: 40,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginTop: 15,
    marginBottom: 10,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
  },
  selectionPrompt: {
    position: 'absolute',
    bottom: 280,
    left: 20,
    right: 20,
  },
  selectionPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  selectionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    flex: 1,
  },
  cancelSelectionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.glassLight,
  },
  cancelSelectionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 140 : 120,
    zIndex: 10,
  },
  controlButtonCard: {
    marginBottom: 12,
  },
  controlButtonContent: {
    padding: 0,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  inputsContainer: {
    gap: 16,
  },
  locationCard: {
    marginBottom: 0,
  },
  locationCardContent: {
    padding: 20,
    gap: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  addressInput: {
    marginBottom: 0,
  },
  mapSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    alignSelf: 'flex-start',
    gap: 6,
  },
  mapSelectionText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#22C55E',
  },
  quoteContainer: {
    gap: 16,
  },
  quoteCard: {
    marginBottom: 0,
  },
  quoteCardContent: {
    padding: 20,
  },
  quoteHeader: {
    marginBottom: 16,
  },
  quoteTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  quoteDetails: {
    gap: 16,
  },
  routeInfo: {
    gap: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  tripDetailContent: {
    gap: 4,
  },
  tripDetailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  tripDetailValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  fareBreakdown: {
    gap: 10,
  },
  fareTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
  quoteValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  quoteTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  quoteTotalValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#22C55E',
  },
  expiryText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default RideBookingScreen;
