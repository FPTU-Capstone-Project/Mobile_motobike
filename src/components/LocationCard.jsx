import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import CleanCard from './ui/CleanCard.jsx';
import { colors } from '../theme/designTokens';

const iconGradients = {
  university: ['rgba(59,130,246,0.85)', 'rgba(14,165,233,0.8)'],
  cultural: ['rgba(249,115,22,0.9)', 'rgba(251,191,36,0.82)'],
  home: ['rgba(34,197,94,0.85)', 'rgba(16,185,129,0.78)'],
  accommodation: ['rgba(168,85,247,0.85)', 'rgba(59,130,246,0.8)'],
  default: ['rgba(148,163,184,0.78)', 'rgba(99,102,241,0.75)'],
};

const LocationCard = ({ location, onPress, selected = false }) => {
  const gradientColors = iconGradients[location.type] || iconGradients.default;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <CleanCard
        style={[styles.card, selected && styles.selected]}
        contentStyle={styles.cardContent}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name={location.icon} size={24} color="#fff" />
        </LinearGradient>
        
        <View style={styles.details}>
          <Text style={styles.locationName} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={styles.locationAddress} numberOfLines={2}>
            {location.address}
          </Text>
        </View>
        
        {selected && (
          <View style={styles.selectedIndicator}>
            <Icon name="check" size={18} color={colors.accent} />
          </View>
        )}
      </CleanCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  selected: {
    borderColor: 'rgba(59,130,246,0.35)',
    borderWidth: 1.4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(59,130,246,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default LocationCard;
