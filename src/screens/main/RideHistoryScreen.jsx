import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import mockData from '../../data/mockData.json';
import AppBackground from '../../components/layout/AppBackground.jsx';
import GlassHeader from '../../components/ui/GlassHeader.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import { colors } from '../../theme/designTokens';

const filterOptions = [
  { key: 'all', label: 'Tất cả' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const statusSettings = {
  completed: { color: '#22C55E', label: 'Hoàn thành' },
  cancelled: { color: '#EF4444', label: 'Đã hủy' },
  ongoing: { color: '#F97316', label: 'Đang diễn ra' },
};

const RideHistoryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const rides = mockData.rides || [];

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      ride.dropoffLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && ride.status === selectedFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerSpacing}>
            <GlassHeader title="Lịch sử chuyến đi" subtitle="Theo dõi các chuyến đã thực hiện" />
          </View>

          <Animatable.View animation="fadeInUp" duration={480} delay={40}>
            <CleanCard style={styles.cardSpacing} contentStyle={styles.searchSection}>
              <View style={styles.searchBar}>
                <Icon name="search" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm theo địa điểm..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="clear" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {filterOptions.map((option) => {
                  const active = selectedFilter === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setSelectedFilter(option.key)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </CleanCard>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={520} delay={120}>
            {filteredRides.length === 0 ? (
              <CleanCard style={styles.cardSpacing} contentStyle={styles.emptyState}>
                <Icon name="history" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Không có chuyến đi nào</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Bạn chưa có chuyến đi nào'}
                </Text>
              </CleanCard>
            ) : (
              filteredRides.map((ride) => {
                const status = statusSettings[ride.status] || statusSettings.completed;
                return (
                  <CleanCard key={ride.id} style={styles.cardSpacing} contentStyle={styles.rideCard}>
                    <View style={styles.rideHeader}>
                      <View style={styles.rideStatus}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                      <Text style={styles.rideDate}>{formatDate(ride.date)}</Text>
                    </View>

                    <View style={styles.route}>
                      <View style={styles.routePoint}>
                        <View style={styles.pickupDot} />
                        <Text style={styles.locationText}>{ride.pickupLocation}</Text>
                      </View>
                      <View style={styles.routeLine} />
                      <View style={styles.routePoint}>
                        <View style={styles.dropoffDot} />
                        <Text style={styles.locationText}>{ride.dropoffLocation}</Text>
                      </View>
                    </View>

                    <View style={styles.rideFooter}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                          <Icon name="schedule" size={16} color={colors.textMuted} />
                          <Text style={styles.infoText}>{ride.duration} phút</Text>
                        </View>
                        <View style={styles.infoSeparator} />
                        <View style={styles.infoItem}>
                          <Icon name="motorcycle" size={16} color={colors.textMuted} />
                          <Text style={styles.infoText}>Xe máy</Text>
                        </View>
                      </View>
                      <Text style={styles.fareText}>{ride.fare.toLocaleString()} VNĐ</Text>
                    </View>

                    <TouchableOpacity style={styles.detailsButton}>
                      <Text style={styles.detailsText}>Xem chi tiết</Text>
                      <Icon name="chevron-right" size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </CleanCard>
                );
              })
            )}
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingBottom: 140,
    paddingTop: 24,
  },
  headerSpacing: {
    marginBottom: 24,
  },
  cardSpacing: {
    marginHorizontal: 20,
    marginBottom: 18,
  },
  searchSection: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassLight,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterRow: {
    marginTop: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rideCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  rideDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  routeLine: {
    width: 2,
    height: 42,
    backgroundColor: 'rgba(148,163,184,0.25)',
    alignSelf: 'center',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoSeparator: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(148,163,184,0.25)',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
  },
  fareText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  detailsText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.accent,
  },
});

export default RideHistoryScreen;
