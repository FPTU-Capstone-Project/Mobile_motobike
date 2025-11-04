import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import mockData from '../../data/mockData.json';

const RideHistoryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, completed, cancelled

  const rides = mockData.rides;

  const filteredRides = rides.filter(ride => {
    const matchesSearch = ride.dropoffLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && ride.status === selectedFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'ongoing':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'ongoing':
        return 'Đang diễn ra';
      default:
        return 'Không xác định';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filterOptions = [
    { key: 'all', label: 'Tất cả' },
    { key: 'completed', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã hủy' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử chuyến đi</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo địa điểm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                selectedFilter === option.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(option.key)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === option.key && styles.filterTabTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rides List */}
      <ScrollView style={styles.ridesList} showsVerticalScrollIndicator={false}>
        {filteredRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Không có chuyến đi nào</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Bạn chưa có chuyến đi nào'}
            </Text>
          </View>
        ) : (
          filteredRides.map((ride) => (
            <TouchableOpacity key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View style={styles.rideStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(ride.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(ride.status) }
                  ]}>
                    {getStatusText(ride.status)}
                  </Text>
                </View>
                <Text style={styles.rideDate}>
                  {formatDate(ride.date)}
                </Text>
              </View>

              <View style={styles.rideRoute}>
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
                <View style={styles.rideInfo}>
                  <View style={styles.infoItem}>
                    <Icon name="schedule" size={16} color="#666" />
                    <Text style={styles.infoText}>{ride.duration} phút</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Icon name="motorcycle" size={16} color="#666" />
                    <Text style={styles.infoText}>Xe máy</Text>
                  </View>
                </View>
                <Text style={styles.fareText}>
                  {ride.fare.toLocaleString()} VNĐ
                </Text>
              </View>

              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
                <Icon name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  filterTabActive: {
    backgroundColor: '#000',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  ridesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rideDate: {
    fontSize: 12,
    color: '#666',
  },
  rideRoute: {
    marginBottom: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 2,
  },
  locationText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideInfo: {
    flexDirection: 'row',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
});

export default RideHistoryScreen;
