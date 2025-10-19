import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import mockData from '../../data/mockData.json';

const DriverProfileScreen = ({ navigation }) => {
  const [showVehicleInfo, setShowVehicleInfo] = useState(true);

  const driver = mockData.users[1]; // Driver user
  const vehicleInfo = driver.vehicleInfo;

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản tài xế?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: () => navigation.replace('Login') }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Chỉnh sửa hồ sơ', 'Chức năng đang được phát triển');
  };

  const handleVehicleEdit = () => {
    Alert.alert('Cập nhật thông tin xe', 'Chức năng đang được phát triển');
  };

  const menuSections = [
    {
      title: 'Tài khoản',
      items: [
        { icon: 'edit', title: 'Chỉnh sửa thông tin', onPress: handleEditProfile },
        { icon: 'security', title: 'Đổi mật khẩu', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'verified', title: 'Xác minh tài khoản', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'account-balance', title: 'Thông tin ngân hàng', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') }
      ]
    },
    {
      title: 'Hỗ trợ',
      items: [
        { icon: 'help', title: 'Trung tâm trợ giúp', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'phone', title: 'Liên hệ hỗ trợ', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'feedback', title: 'Góp ý', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') }
      ]
    },
    {
      title: 'Cài đặt',
      items: [
        { icon: 'notifications', title: 'Thông báo', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'language', title: 'Ngôn ngữ', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'policy', title: 'Chính sách bảo mật', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
        { icon: 'info', title: 'Về ứng dụng', onPress: () => Alert.alert('MSSUS', 'Phiên bản 1.0.0\nHệ thống chia sẻ xe máy cho sinh viên') }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#10412F', '#000000']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hồ sơ tài xế</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Profile Card */}
          <Animatable.View animation="fadeInUp" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image 
                source={{ uri: driver.avatar }} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverEmail}>{driver.email}</Text>
                <Text style={styles.studentId}>MSSV: {driver.studentId}</Text>
                <View style={styles.verificationStatus}>
                  <Icon 
                    name={driver.isVerified ? 'verified' : 'pending'} 
                    size={16} 
                    color={driver.isVerified ? '#4CAF50' : '#FF9800'} 
                  />
                  <Text style={[
                    styles.verificationText,
                    { color: driver.isVerified ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {driver.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Icon name="edit" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Thống kê tài xế</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.statIcon}
                >
                  <Icon name="star" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{driver.rating}</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.statIcon}
                >
                  <Icon name="directions-car" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>{driver.totalRides}</Text>
                <Text style={styles.statLabel}>Chuyến đi</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#10412F', '#000000']}
                  style={styles.statIcon}
                >
                  <Icon name="schedule" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>6 tháng</Text>
                <Text style={styles.statLabel}>Kinh nghiệm</Text>
              </View>

              <View style={styles.statItem}>
                <LinearGradient
                  colors={['#9C27B0', '#7B1FA2']}
                  style={styles.statIcon}
                >
                  <Icon name="trending-up" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.statValue}>96%</Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info Card */}
          <View style={styles.vehicleCard}>
            <TouchableOpacity 
              style={styles.vehicleHeader}
              onPress={() => setShowVehicleInfo(!showVehicleInfo)}
            >
              <Text style={styles.cardTitle}>Thông tin xe</Text>
              <Icon 
                name={showVehicleInfo ? 'expand-less' : 'expand-more'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showVehicleInfo && (
              <Animatable.View animation="fadeInDown" style={styles.vehicleDetails}>
                <View style={styles.vehicleRow}>
                  <Icon name="motorcycle" size={20} color="#666" />
                  <Text style={styles.vehicleLabel}>Loại xe:</Text>
                  <Text style={styles.vehicleValue}>{vehicleInfo.type}</Text>
                </View>
                
                <View style={styles.vehicleRow}>
                  <Icon name="build" size={20} color="#666" />
                  <Text style={styles.vehicleLabel}>Hãng:</Text>
                  <Text style={styles.vehicleValue}>{vehicleInfo.brand}</Text>
                </View>
                
                <View style={styles.vehicleRow}>
                  <Icon name="category" size={20} color="#666" />
                  <Text style={styles.vehicleLabel}>Dòng xe:</Text>
                  <Text style={styles.vehicleValue}>{vehicleInfo.model}</Text>
                </View>
                
                <View style={styles.vehicleRow}>
                  <Icon name="confirmation-number" size={20} color="#666" />
                  <Text style={styles.vehicleLabel}>Biển số:</Text>
                  <Text style={styles.vehicleValue}>{vehicleInfo.licensePlate}</Text>
                </View>
                
                <View style={styles.vehicleRow}>
                  <Icon name="palette" size={20} color="#666" />
                  <Text style={styles.vehicleLabel}>Màu sắc:</Text>
                  <Text style={styles.vehicleValue}>{vehicleInfo.color}</Text>
                </View>
                
                <ModernButton
                  title="Cập nhật thông tin xe"
                  variant="outline"
                  size="small"
                  icon="edit"
                  onPress={handleVehicleEdit}
                  style={styles.vehicleEditButton}
                />
              </Animatable.View>
            )}
          </View>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuContainer}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity 
                    key={itemIndex} 
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && styles.lastMenuItem
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <Icon name={item.icon} size={24} color="#666" />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <ModernButton
            title="Đăng xuất"
            variant="outline"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
          />

          {/* App Version */}
          <Text style={styles.versionText}>MSSUS Driver v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginTop: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    width: 80,
  },
  vehicleValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  vehicleEditButton: {
    marginTop: 16,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
  },
  logoutButton: {
    marginBottom: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
});

export default DriverProfileScreen;