import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';

const ProfileSwitchScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
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

  const handleSwitchProfile = async (targetRole) => {
    if (!user) return;

    // Check if user can switch to driver
    if (targetRole === 'driver' && !user.driver_profile) {
      Alert.alert(
        'Chưa thể chuyển đổi',
        'Bạn cần xác minh tài khoản tài xế trước. Vui lòng gửi giấy tờ để admin duyệt.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Gửi giấy tờ', onPress: () => navigation.navigate('DriverVerification') }
        ]
      );
      return;
    }

    setSwitchLoading(true);
    
    try {
      await authService.switchProfile(targetRole);
      
      Alert.alert(
        'Thành công',
        `Đã chuyển sang chế độ ${targetRole === 'driver' ? 'Tài xế' : 'Hành khách'}`,
        [
          { text: 'OK', onPress: () => {
            // Navigate to appropriate main screen
            if (targetRole === 'driver') {
              navigation.replace('DriverMain');
            } else {
              navigation.replace('Main');
            }
          }}
        ]
      );
    } catch (error) {
      console.error('Switch profile error:', error);
      
      let errorMessage = 'Không thể chuyển đổi chế độ';
      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSwitchLoading(false);
    }
  };

  const getVerificationStatus = (profile) => {
    if (!profile) return { status: 'not_verified', text: 'Chưa xác minh', color: '#999' };
    
    // This would depend on your backend verification status field
    // Assuming there's a status field in profile
    if (profile.status === 'verified' || profile.status === 'active') {
      return { status: 'verified', text: 'Đã xác minh', color: '#4CAF50' };
    } else if (profile.status === 'pending') {
      return { status: 'pending', text: 'Đang chờ duyệt', color: '#FF9800' };
    } else {
      return { status: 'not_verified', text: 'Chưa xác minh', color: '#F44336' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
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
          <ModernButton
            title="Thử lại"
            onPress={loadUserProfile}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentUserType = user.user?.user_type;
  const riderStatus = getVerificationStatus(user.rider_profile);
  const driverStatus = getVerificationStatus(user.driver_profile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chuyển đổi chế độ</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Current Mode */}
          <Animatable.View animation="fadeInUp" style={styles.currentModeCard}>
            <Text style={styles.cardTitle}>Chế độ hiện tại</Text>
            <View style={styles.currentModeInfo}>
              <LinearGradient
                colors={currentUserType === 'driver' ? ['#FF9800', '#F57C00'] : ['#2196F3', '#1976D2']}
                style={styles.currentModeIcon}
              >
                <Icon 
                  name={currentUserType === 'driver' ? 'directions-car' : 'person'} 
                  size={32} 
                  color="#fff" 
                />
              </LinearGradient>
              <View style={styles.currentModeDetails}>
                <Text style={styles.currentModeTitle}>
                  {currentUserType === 'driver' ? 'Tài xế' : 'Hành khách'}
                </Text>
                <Text style={styles.currentModeSubtitle}>
                  {currentUserType === 'driver' 
                    ? 'Bạn có thể chia sẻ chuyến đi và kiếm tiền' 
                    : 'Bạn có thể đặt chuyến đi với tài xế'}
                </Text>
              </View>
            </View>
          </Animatable.View>

          {/* Available Modes */}
          <View style={styles.modesSection}>
            <Text style={styles.sectionTitle}>Chế độ có thể chuyển</Text>

            {/* Rider Mode */}
            <TouchableOpacity
              style={[
                styles.modeCard,
                currentUserType === 'rider' && styles.modeCardActive
              ]}
              onPress={() => handleSwitchProfile('rider')}
              disabled={currentUserType === 'rider' || switchLoading}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.modeIcon}
              >
                <Icon name="person" size={24} color="#fff" />
              </LinearGradient>
              
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Hành khách</Text>
                <Text style={styles.modeDescription}>
                  Đặt chuyến đi, tìm tài xế chia sẻ
                </Text>
                <View style={styles.statusContainer}>
                  <Icon 
                    name={riderStatus.status === 'verified' ? 'check-circle' : 
                          riderStatus.status === 'pending' ? 'schedule' : 'cancel'} 
                    size={16} 
                    color={riderStatus.color} 
                  />
                  <Text style={[styles.statusText, { color: riderStatus.color }]}>
                    {riderStatus.text}
                  </Text>
                </View>
              </View>

              {currentUserType === 'rider' ? (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>Đang sử dụng</Text>
                </View>
              ) : (
                <Icon name="chevron-right" size={24} color="#666" />
              )}
            </TouchableOpacity>

            {/* Driver Mode */}
            <TouchableOpacity
              style={[
                styles.modeCard,
                currentUserType === 'driver' && styles.modeCardActive,
                !user.driver_profile && styles.modeCardDisabled
              ]}
              onPress={() => handleSwitchProfile('driver')}
              disabled={currentUserType === 'driver' || switchLoading || !user.driver_profile}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.modeIcon}
              >
                <Icon name="directions-car" size={24} color="#fff" />
              </LinearGradient>
              
              <View style={styles.modeInfo}>
                <Text style={styles.modeTitle}>Tài xế</Text>
                <Text style={styles.modeDescription}>
                  Chia sẻ chuyến đi, kiếm tiền từ việc chở khách
                </Text>
                <View style={styles.statusContainer}>
                  <Icon 
                    name={driverStatus.status === 'verified' ? 'check-circle' : 
                          driverStatus.status === 'pending' ? 'schedule' : 'cancel'} 
                    size={16} 
                    color={driverStatus.color} 
                  />
                  <Text style={[styles.statusText, { color: driverStatus.color }]}>
                    {driverStatus.text}
                  </Text>
                </View>
              </View>

              {currentUserType === 'driver' ? (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>Đang sử dụng</Text>
                </View>
              ) : user.driver_profile ? (
                <Icon name="chevron-right" size={24} color="#666" />
              ) : (
                <Icon name="lock" size={24} color="#ccc" />
              )}
            </TouchableOpacity>
          </View>

          {/* Verification Section */}
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Xác minh tài khoản</Text>
            
            {/* Student Verification */}
            <View style={styles.verificationCard}>
              <Icon name="school" size={24} color="#2196F3" />
              <View style={styles.verificationInfo}>
                <Text style={styles.verificationTitle}>Xác minh sinh viên</Text>
                <Text style={styles.verificationDescription}>
                  Gửi thẻ sinh viên để xác minh bạn là sinh viên trường
                </Text>
              </View>
              <ModernButton
                title={user.user?.email_verified ? "Đã xác minh" : "Xác minh"}
                size="small"
                variant={user.user?.email_verified ? "outline" : "primary"}
                disabled={user.user?.email_verified}
                onPress={() => navigation.navigate('StudentVerification')}
              />
            </View>

            {/* Driver Verification */}
            <View style={styles.verificationCard}>
              <Icon name="directions-car" size={24} color="#FF9800" />
              <View style={styles.verificationInfo}>
                <Text style={styles.verificationTitle}>Xác minh tài xế</Text>
                <Text style={styles.verificationDescription}>
                  Gửi giấy tờ xe và bằng lái để trở thành tài xế
                </Text>
              </View>
              <ModernButton
                title={user.driver_profile ? "Đã gửi" : "Gửi giấy tờ"}
                size="small"
                variant={user.driver_profile ? "outline" : "primary"}
                disabled={user.driver_profile}
                onPress={() => navigation.navigate('DriverVerification')}
              />
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Icon name="info" size={24} color="#4CAF50" />
              <Text style={styles.infoText}>
                Bạn có thể chuyển đổi giữa chế độ Hành khách và Tài xế bất cứ lúc nào sau khi đã được xác minh.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {switchLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingOverlayText}>Đang chuyển đổi...</Text>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentModeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  currentModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentModeIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentModeDetails: {
    flex: 1,
  },
  currentModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  currentModeSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modeCardActive: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  verificationSection: {
    marginBottom: 24,
  },
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  verificationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  verificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 12,
    lineHeight: 20,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default ProfileSwitchScreen;
