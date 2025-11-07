import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import CleanCard from './ui/CleanCard';
import { colors, radii, spacing } from '../theme/designTokens';

const SearchResultsCard = ({
  suggestions = [],
  loading = false,
  visible = false,
  onSelectSuggestion,
  style,
}) => {
  if (!visible && suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={300}
      delay={index * 50}
    >
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          item.isSuggested && styles.suggestedItem,
          item.isValid === false && styles.invalidItem,
        ]}
        onPress={() => onSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          item.isCurrentLocation && styles.iconContainerCurrent,
          item.isPOI && styles.iconContainerPOI,
        ]}>
          <Icon
            name={
              item.isCurrentLocation
                ? 'my-location'
                : item.isPOI
                ? 'place'
                : item.isSuggested
                ? 'star'
                : item.isValid === false
                ? 'warning'
                : 'location-on'
            }
            size={20}
            color={
              item.isCurrentLocation
                ? '#22C55E'
                : item.isPOI
                ? '#3B82F6'
                : item.isSuggested
                ? '#F97316'
                : '#6B7280'
            }
          />
        </View>

        <View style={styles.suggestionContent}>
          <Text
            style={[
              styles.suggestionMain,
              item.isSuggested && styles.suggestedText,
            ]}
            numberOfLines={1}
          >
            {item.structured_formatting?.main_text || item.description}
          </Text>
          <Text style={styles.suggestionSecondary} numberOfLines={1}>
            {item.structured_formatting?.secondary_text || ''}
          </Text>
        </View>

        {item.isPOI && (
          <View style={styles.badgePOI}>
            <Text style={styles.badgeText}>POI</Text>
          </View>
        )}
        {item.isCurrentLocation && (
          <View style={styles.badgeGPS}>
            <Text style={styles.badgeText}>GPS</Text>
          </View>
        )}
        {item.isSuggested && !item.isPOI && !item.isCurrentLocation && (
          <View style={styles.badgeSuggested}>
            <Text style={styles.badgeText}>Gợi ý</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <Animatable.View
      animation={visible ? 'slideInUp' : 'slideOutDown'}
      duration={300}
      style={[styles.container, style]}
    >
      <CleanCard style={styles.card} contentStyle={styles.cardContent}>
        <View style={styles.header}>
          <Icon name="search" size={20} color={colors.accent} />
          <Text style={styles.headerText}>
            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${suggestions.length} kết quả`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Đang tìm kiếm địa điểm...</Text>
          </View>
        ) : suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) =>
              item.place_id || item.locationId || item.description || Math.random().toString()
            }
            style={styles.list}
            scrollEnabled={suggestions.length > 3}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
          </View>
        )}
      </CleanCard>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    zIndex: 1000,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: spacing.md,
    maxHeight: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)',
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
  list: {
    maxHeight: 240,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.1)',
    marginVertical: spacing.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: 'transparent',
  },
  suggestedItem: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  invalidItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconContainerCurrent: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconContainerPOI: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  suggestionContent: {
    flex: 1,
    gap: 2,
  },
  suggestionMain: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.textPrimary,
  },
  suggestedText: {
    color: '#F97316',
    fontFamily: 'Inter_600SemiBold',
  },
  suggestionSecondary: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgePOI: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  badgeGPS: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  badgeSuggested: {
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
});

export default SearchResultsCard;

