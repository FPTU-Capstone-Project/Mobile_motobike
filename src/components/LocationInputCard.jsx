import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import CleanCard from './ui/CleanCard';
import { colors, radii, spacing } from '../theme/designTokens';
import goongService from '../services/goongService';
import poiService from '../services/poiService';
import { locationStorageService } from '../services/locationStorageService';

const LocationInputCard = ({
  label,
  iconName,
  iconColor,
  value,
  onChangeText,
  onLocationSelect,
  placeholder,
  isPickupInput = false,
  currentLocation = null,
  onFocus,
  onBlur,
  onSearchStart,
  onSearchResults,
}) => {
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isFocused && value && value.length > 0) {
      loadSuggestions(value);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, isFocused]);

  const loadSuggestions = async (query) => {
    try {
      if (onSearchStart) onSearchStart();

      const poiLocations = await poiService.getAllLocations();

      let currentLocationSuggestion = null;
      if (isPickupInput) {
        try {
          const locationData = await locationStorageService.getCurrentLocationWithAddress();
          if (locationData.location && locationData.address) {
            currentLocationSuggestion = {
              place_id: 'current_location',
              description: 'Vị trí hiện tại',
              structured_formatting: {
                main_text: 'Vị trí hiện tại',
                secondary_text: locationData.address.shortAddress || 'Sử dụng GPS để xác định vị trí',
              },
              coordinates: locationData.location,
              isSuggested: true,
              isCurrentLocation: true,
              isPOI: false,
            };
          }
        } catch (error) {
          console.warn('Could not load current location:', error);
        }
      }

      if (query.length <= 2) {
        const shortSuggestions = poiLocations.map((poi) => ({
          place_id: poi.locationId,
          description: poi.name,
          structured_formatting: {
            main_text: poi.name,
            secondary_text: 'Địa điểm được đề xuất',
          },
          coordinates: {
            latitude: poi.latitude,
            longitude: poi.longitude,
          },
          locationId: poi.locationId,
          isSuggested: true,
          isPOI: true,
        }));

        const finalSuggestions = currentLocationSuggestion
          ? [currentLocationSuggestion, ...shortSuggestions]
          : shortSuggestions;

        if (onSearchResults) onSearchResults(finalSuggestions);
        return;
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchPlacesWithPOI(query, poiLocations, currentLocationSuggestion);
      }, 300);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      if (onSearchResults) onSearchResults([]);
    }
  };

  const searchPlacesWithPOI = async (query, poiLocations, currentLocationSuggestion) => {
    if (!goongService.isPlacesConfigured()) {
      console.log('Goong Places API not configured');
      return;
    }

    try {
      setLoading(true);

      const filteredPOI = poiLocations
        .filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()))
        .map((poi) => ({
          place_id: poi.locationId,
          description: poi.name,
          structured_formatting: {
            main_text: poi.name,
            secondary_text: 'Địa điểm được đề xuất',
          },
          coordinates: {
            latitude: poi.latitude,
            longitude: poi.longitude,
          },
          locationId: poi.locationId,
          isSuggested: true,
          isPOI: true,
          isValid: true,
        }));

      const results = await goongService.searchPlaces(query);
      const predictions = Array.isArray(results) ? results : results?.predictions || [];

      const searchResults = predictions.map((item) => ({
        ...item,
        place_id: item.place_id || item.placeId,
        structured_formatting: item.structured_formatting || item.structuredFormatting,
        isValid: true,
        isPOI: false,
      }));

      const currentLocationItems = [];
      if (
        currentLocationSuggestion &&
        ('vị trí hiện tại'.includes(query.toLowerCase()) ||
          'hiện tại'.includes(query.toLowerCase()) ||
          'current'.includes(query.toLowerCase()))
      ) {
        currentLocationItems.push(currentLocationSuggestion);
      }

      const combinedResults = [...currentLocationItems, ...filteredPOI, ...searchResults].slice(0, 8);

      if (onSearchResults) onSearchResults(combinedResults);
    } catch (error) {
      console.error('Search places error:', error);
      if (onSearchResults) onSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCurrentLocation = async () => {
    if (!isPickupInput || !currentLocation) return;

    try {
      const locationData = await locationStorageService.getCurrentLocationWithAddress();
      if (locationData.location && locationData.address) {
        const displayText = 'Vị trí hiện tại';
        onChangeText(displayText);
        onLocationSelect({
          latitude: locationData.location.latitude,
          longitude: locationData.location.longitude,
          address: locationData.address.shortAddress || displayText,
          isCurrentLocation: true,
        });
      }
    } catch (error) {
      console.error('Error selecting current location:', error);
    }
  };

  return (
    <Animatable.View animation="fadeInUp" duration={400}>
      <CleanCard style={styles.card} contentStyle={styles.cardContent}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Icon name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
            <Icon name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              onFocus={() => {
                setIsFocused(true);
                if (onFocus) onFocus();
              }}
              onBlur={() => {
                setIsFocused(false);
                if (onBlur) onBlur();
              }}
            />
            {loading && (
              <ActivityIndicator size="small" color={colors.accent} style={styles.loadingIcon} />
            )}
          </View>
        </View>

        {isPickupInput && currentLocation && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: iconColor }]}
            onPress={handleSelectCurrentLocation}
            activeOpacity={0.7}
          >
            <Icon name="my-location" size={16} color={iconColor} />
            <Text style={[styles.actionButtonText, { color: iconColor }]}>Vị trí hiện tại</Text>
          </TouchableOpacity>
        )}
      </CleanCard>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    flex: 1,
  },
  inputWrapper: {
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.glassLight,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  inputContainerFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  loadingIcon: {
    marginLeft: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    gap: spacing.xs,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});

export default LocationInputCard;

