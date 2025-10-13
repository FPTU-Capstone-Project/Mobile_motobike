import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import goongService from '../services/goongService';
import addressValidation from '../utils/addressValidation';

const AddressInput = ({
  value,
  onChangeText,
  onLocationSelect,
  placeholder,
  iconName,
  iconColor,
  style,
  isPickupInput = false, // New prop to identify pickup input
  currentLocation = null, // Current user location
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  // Separate state to track if user is actively typing
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Only search if user is actively typing, not when value is set programmatically
    if (isTyping && value && value.length > 0) {
      // Always show suggested addresses first
      const suggestedAddresses = addressValidation.getSuggestedAddresses();
      
      if (value.length <= 2) {
        // Show suggested addresses and current location for short queries
        const shortSuggestions = suggestedAddresses.map(addr => ({
          place_id: addr.id,
          description: addr.title,
          structured_formatting: {
            main_text: addr.title,
            secondary_text: addr.description
          },
          coordinates: addr.coordinates,
          isSuggested: true
        }));

        // Add current location for pickup input
        if (isPickupInput && currentLocation) {
          shortSuggestions.unshift({
            place_id: 'current_location',
            description: 'Vị trí hiện tại',
            structured_formatting: {
              main_text: 'Vị trí hiện tại',
              secondary_text: 'Sử dụng GPS để xác định vị trí'
            },
            coordinates: currentLocation,
            isSuggested: true,
            isCurrentLocation: true
          });
        }

        setSuggestions(shortSuggestions);
        setShowSuggestions(true);
        return;
      }
      
      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    } else if (!isTyping) {
      // Don't show suggestions when value is set programmatically
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, isTyping]);

  const searchPlaces = async (query) => {
    
    if (!goongService.isPlacesConfigured()) {
      console.log('Goong Places API not configured');
      return;
    }
    
    try {
      setLoading(true);
      const results = await goongService.searchPlaces(query);
      
      // Handle both formats: array directly or {predictions: array}
      const predictions = Array.isArray(results) ? results : results?.predictions || [];
      
      if (predictions && predictions.length > 0) {
        
        // Show all search results
        const searchResults = predictions.map(item => ({
          ...item,
          place_id: item.place_id || item.placeId, // Handle both field names
          structured_formatting: item.structured_formatting || item.structuredFormatting, // Handle both field names
          isValid: true // Treat all results as valid
        }));
        
        // Combine suggested addresses with search results
        const suggestedAddresses = addressValidation.getSuggestedAddresses();
        const suggestedItems = suggestedAddresses
          .filter(addr => 
            addr.title.toLowerCase().includes(query.toLowerCase()) ||
            addr.description.toLowerCase().includes(query.toLowerCase())
          )
          .map(addr => ({
            place_id: addr.id,
            description: addr.title,
            structured_formatting: {
              main_text: addr.title,
              secondary_text: addr.description
            },
            coordinates: addr.coordinates,
            isSuggested: true,
            isValid: true
          }));

        // Add current location for pickup input
        const currentLocationItems = [];
        if (isPickupInput && currentLocation && 
            ('vị trí hiện tại'.includes(query.toLowerCase()) || 
             'hiện tại'.includes(query.toLowerCase()) ||
             'current'.includes(query.toLowerCase()))) {
          currentLocationItems.push({
            place_id: 'current_location',
            description: 'Vị trí hiện tại',
            structured_formatting: {
              main_text: 'Vị trí hiện tại',
              secondary_text: 'Sử dụng GPS để xác định vị trí'
            },
            coordinates: currentLocation,
            isSuggested: true,
            isCurrentLocation: true,
            isValid: true
          });
        }
        
        // Combine and limit results
        const combinedResults = [...currentLocationItems, ...suggestedItems, ...searchResults].slice(0, 8);
        
        setSuggestions(combinedResults);
        setShowSuggestions(true);
      }
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = async (suggestion) => {
    try {
      setIsTyping(false); // Stop triggering search when setting value programmatically
      
      // If it's a suggested address or current location, use coordinates directly
      if (suggestion.isSuggested && suggestion.coordinates) {
        const displayText = suggestion.structured_formatting?.main_text || suggestion.description;
        onChangeText(displayText);
        onLocationSelect({
          latitude: suggestion.coordinates.latitude,
          longitude: suggestion.coordinates.longitude,
          address: displayText,
        });
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }
      
      // For Goong API results, get place details
      const placeId = suggestion.place_id || suggestion.placeId;
      const placeDetails = await goongService.getPlaceDetails(placeId);
      
      if (placeDetails && placeDetails.result) {
        const location = placeDetails.result.geometry.location;
        // Prioritize main_text for display, use formatted_address for coordinates
        const displayText = suggestion.structured_formatting?.main_text || suggestion.description;
        const fullAddress = placeDetails.result.formatted_address || displayText;
        
        onChangeText(displayText);
        onLocationSelect({
          latitude: location.lat,
          longitude: location.lng,
          address: fullAddress, // Use full address for backend
        });
      } else {
        // Fallback to geocoding if place details fail
        const displayText = suggestion.structured_formatting?.main_text || suggestion.description;
        const geocodeResults = await goongService.geocode(displayText);
        if (geocodeResults && geocodeResults.results && geocodeResults.results.length > 0) {
          const location = geocodeResults.results[0].geometry.location;
          onChangeText(displayText);
          onLocationSelect({
            latitude: location.lat,
            longitude: location.lng,
            address: displayText,
          });
        }
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Get place details error:', error);
      // Fallback: just set the text with proper display name
      const displayText = suggestion.structured_formatting?.main_text || suggestion.description;
      onChangeText(displayText);
      setShowSuggestions(false);
    }
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        item.isSuggested && styles.suggestedItem,
        item.isValid === false && styles.invalidItem
      ]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Icon 
        name={item.isCurrentLocation ? "my-location" : item.isSuggested ? "star" : item.isValid === false ? "warning" : "location-on"} 
        size={20} 
        color={item.isCurrentLocation ? "#4CAF50" : item.isSuggested ? "#FF9800" : "#666"} 
        style={styles.suggestionIcon} 
      />
      <View style={styles.suggestionContent}>
        <Text style={[
          styles.suggestionMain,
          item.isSuggested && styles.suggestedText
        ]} numberOfLines={1}>
          {item.structured_formatting?.main_text || item.description}
        </Text>
        <Text style={styles.suggestionSecondary} numberOfLines={1}>
          {item.structured_formatting?.secondary_text || ''}
        </Text>
      </View>
      {item.isSuggested && (
        <View style={styles.suggestedBadge}>
          <Text style={styles.suggestedBadgeText}>Gợi ý</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Icon name={iconName} size={20} color={iconColor} />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) => {
            setIsTyping(true); // User is actively typing
            onChangeText(text);
          }}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Hide suggestions when input loses focus (with delay to allow selection)
            setTimeout(() => {
              setShowSuggestions(false);
            }, 200);
          }}
        />
        {loading && (
          <ActivityIndicator size="small" color="#666" style={styles.loadingIcon} />
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.place_id || item.description}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 5,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    maxHeight: 200,
    zIndex: 9999, // Higher z-index to prevent overlap
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  suggestionSecondary: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // New styles for suggested items
  suggestedItem: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  suggestedText: {
    color: '#E65100',
    fontWeight: '600',
  },
  suggestedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  suggestedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  // Styles for invalid items
  invalidItem: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  invalidText: {
    color: '#C62828',
  },
  invalidSecondary: {
    color: '#E57373',
  },
  invalidBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  invalidBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddressInput;
