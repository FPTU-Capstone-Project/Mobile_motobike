import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';
import { runImagePickerTests } from '../../utils/imagePickerTest';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Refresh profile when screen comes into focus (e.g., returning from EditProfile)
  useFocusEffect(
    React.useCallback(() => {
      // Force refresh from API when screen is focused
      const refreshProfile = async () => {
        try {
          const freshProfile = await authService.getCurrentUserProfile();
          if (freshProfile) {
            setUser(freshProfile);
          }
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      };
      
      refreshProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Try to fetch from API
        const profile = await authService.getCurrentUserProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          onPress: async () => {
            try {
              await authService.logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate to login even if API call fails
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: 'swap-horiz', title: 'Chuyển đổi chế độ', onPress: () => navigation.navigate('ProfileSwitch') },
    { icon: 'edit', title: 'Chỉnh sửa thông tin', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'security', title: 'Đổi mật khẩu', onPress: () => navigation.navigate('ChangePassword') },
    { 
      icon: 'verified', 
      title: 'Xác minh tài khoản', 
      onPress: () => {
        navigation.navigate('ProfileSwitch');
      }
    },
    { icon: 'help', title: 'Trợ giúp & Hỗ trợ', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
    { icon: 'policy', title: 'Điều khoản sử dụng', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
    { icon: 'info', title: 'Về chúng tôi', onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển') },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={48} color="#ccc" />
          <Text style={styles.errorText}>Không thể tải thông tin hồ sơ</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Image 
              source={{ 
                uri: user.user?.profile_photo_url ? `${user.user.profile_photo_url}?t=${Date.now()}` : 'https://via.placeholder.com/100'
              }} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.user?.full_name || 'Chưa cập nhật'}</Text>
              <Text style={styles.userEmail}>{user.user?.email || 'Chưa cập nhật'}</Text>
              <Text style={styles.studentId}>MSSV: {user.user?.student_id || 'Chưa cập nhật'}</Text>
              <View style={styles.verificationStatus}>
                <Icon 
                  name={authService.isRiderVerified() ? 'verified' : 'pending'} 
                  size={16} 
                  color={authService.isRiderVerified() ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={[
                  styles.verificationText,
                  { color: authService.isRiderVerified() ? '#4CAF50' : '#FF9800' }
                ]}>
                  {authService.isRiderVerified() ? 'Đã xác minh' : 'Chưa xác minh'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Thống kê</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.rider_profile?.total_rides || user.driver_profile?.total_shared_rides || 0}
              </Text>
              <Text style={styles.statLabel}>Chuyến đi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.wallet?.cached_balance ? 
                  `${parseFloat(user.wallet.cached_balance).toLocaleString()}đ` : '0đ'
                }
              </Text>
              <Text style={styles.statLabel}>Số dư ví</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user.rider_profile?.rating_avg || user.driver_profile?.rating_avg || '0.0'}
              </Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem,
                item.testOnly && __DEV__ && styles.testMenuItem,
                item.disabled && styles.disabledMenuItem
              ]}
              onPress={item.disabled ? null : item.onPress}
              disabled={item.disabled}
            >
              <View style={styles.menuItemLeft}>
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color={
                    item.disabled ? "#ccc" : 
                    item.testOnly && __DEV__ ? "#FF9800" : "#666"
                  } 
                />
                <Text 
                  style={[
                    styles.menuItemText,
                    item.testOnly && __DEV__ && styles.testMenuItemText,
                    item.disabled && styles.disabledMenuItemText
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              {!item.disabled && <Icon name="chevron-right" size={24} color="#ccc" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
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
  userCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
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
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    marginLeft: 8,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testMenuItem: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  testMenuItemText: {
    color: '#E65100',
    fontWeight: '600',
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledMenuItemText: {
    color: '#ccc',
  },
});

export default ProfileScreen;
