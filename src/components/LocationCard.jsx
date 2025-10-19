import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import CleanCard from './ui/CleanCard.jsx';

const LocationCard = ({ location, onPress, selected = false }) => {
  const getGradientColors = () => {
    switch (location.type) {
      case 'university':
        return ['#2196F3', '#1976D2'];
      case 'cultural':
        return ['#FF9800', '#F57C00'];
      case 'home':
        return ['#4CAF50', '#388E3C'];
      case 'accommodation':
        return ['#9C27B0', '#7B1FA2'];
      default:
        return ['#757575', '#424242'];
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <CleanCard style={[styles.container, selected && styles.selected]}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name={location.icon} size={24} color="#fff" />
      </LinearGradient>
      
      <View style={styles.contentContainer}>
        <Text style={styles.locationName} numberOfLines={1}>
          {location.name}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={2}>
          {location.address}
        </Text>
      </View>
      
      {selected && (
        <View style={styles.selectedIndicator}>
          <Icon name="check-circle" size={20} color="#4CAF50" />
        </View>
      )}
      </CleanCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
  },
  selected: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  selectedIndicator: {
    marginLeft: 8,
  },
});

export default LocationCard;
