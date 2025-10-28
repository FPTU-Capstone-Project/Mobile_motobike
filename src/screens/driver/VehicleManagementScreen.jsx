import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

import vehicleService from '../../services/vehicleService';

const VehicleManagementScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await vehicleService.getDriverVehicles({
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });

      if (response && response.data) {
        const formattedVehicles = vehicleService.formatVehicles(response.data);
        setVehicles(formattedVehicles);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phương tiện');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicles(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      'Xóa phương tiện',
      `Bạn có chắc chắn muốn xóa ${vehicle.displayName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleService.deleteVehicle(vehicle.id);
              Alert.alert('Thành công', 'Đã xóa phương tiện');
              loadVehicles();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Lỗi', 'Không thể xóa phương tiện');
            }
          }
        }
      ]
    );
  };

  const renderVehicleItem = ({ item: vehicle }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <Icon name="motorcycle" size={24} color="#4CAF50" />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicle.model}</Text>
          <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
          <Text style={styles.vehicleDetails}>
            {vehicle.color} • {vehicle.year} • {vehicle.capacity} chỗ
          </Text>
        </View>
        <View style={styles.vehicleStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: vehicle.isActive ? '#E8F5E8' : '#FFF3E0' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: vehicle.isActive ? '#4CAF50' : '#FF9800' }
            ]}>
              {vehicle.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Text>
          </View>
          {vehicle.isVerified && (
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={16} color="#2196F3" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.vehicleActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // TODO: Navigate to edit vehicle screen
            Alert.alert('Thông báo', 'Chức năng chỉnh sửa sẽ được cập nhật sớm');
          }}
        >
          <Icon name="edit" size={18} color="#2196F3" />
          <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVehicle(vehicle)}
        >
          <Icon name="delete" size={18} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="directions-car" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có phương tiện nào</Text>
      <Text style={styles.emptyDescription}>
        Thêm phương tiện để bắt đầu tạo chuyến đi chia sẻ
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // TODO: Navigate to add vehicle screen
          Alert.alert('Thông báo', 'Chức năng thêm phương tiện sẽ được cập nhật sớm');
        }}
      >
        <Icon name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Thêm phương tiện</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý phương tiện</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải phương tiện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý phương tiện</Text>
        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() => {
            // TODO: Navigate to add vehicle screen
            Alert.alert('Thông báo', 'Chức năng thêm phương tiện sẽ được cập nhật sớm');
          }}
        >
          <Icon name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Vehicle List */}
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addHeaderButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 12,
    color: '#666',
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#2196F3',
    marginLeft: 2,
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default VehicleManagementScreen;
