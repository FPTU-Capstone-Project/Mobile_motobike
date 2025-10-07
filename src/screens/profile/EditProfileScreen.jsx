import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';
import profileService from '../../services/profileService.js';

const EditProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    emergencyContact: '',
  });

  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          fullName: currentUser.user?.full_name || '',
          email: currentUser.user?.email || '',
          phone: currentUser.user?.phone || '',
          studentId: currentUser.user?.student_id || '',
          emergencyContact: currentUser.rider_profile?.emergency_contact || '',
        });
      } else {
        const profile = await profileService.getCurrentUserProfile();
        setUser(profile);
        setFormData({
          fullName: profile.user?.full_name || '',
          email: profile.user?.email || '',
          phone: profile.user?.phone || '',
          studentId: profile.user?.student_id || '',
          emergencyContact: profile.rider_profile?.emergency_contact || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Lower quality for avatar to reduce file size
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Lower quality for avatar to reduce file size
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showAvatarPicker = () => {
    Alert.alert(
      'Cập nhật ảnh đại diện',
      'Chọn cách thức để cập nhật ảnh đại diện',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickAvatar },
      ]
    );
  };

  const uploadAvatar = async () => {
    if (!selectedAvatar) return;

    setUploadingAvatar(true);
    try {
      const avatarFile = {
        uri: selectedAvatar.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      };

      await profileService.updateAvatar(avatarFile);
      
      // Force refresh profile from API after upload
      const freshProfile = await profileService.getCurrentUserProfile();
      if (freshProfile) {
        setUser(freshProfile);
        setFormData({
          fullName: freshProfile.user?.full_name || '',
          email: freshProfile.user?.email || '',
          phone: freshProfile.user?.phone || '',
          studentId: freshProfile.user?.student_id || '',
          emergencyContact: freshProfile.rider_profile?.emergency_contact || '',
        });
      }
      
      setSelectedAvatar(null);
      
      Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
    } catch (error) {
      console.error('Upload avatar error:', error);
      
      let errorMessage = 'Không thể cập nhật ảnh đại diện';
      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Lỗi', 'Email không đúng định dạng');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return false;
    }

    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const updateData = {
        fullName: formData.fullName,
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
      };

      await profileService.updateProfile(updateData);
      
      Alert.alert(
        'Thành công', 
        'Thông tin hồ sơ đã được cập nhật',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Update profile error:', error);
      
      let errorMessage = 'Không thể cập nhật thông tin';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 409:
            errorMessage = 'Email hoặc số điện thoại đã được sử dụng';
            break;
          case 400:
            errorMessage = 'Thông tin không hợp lệ';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSaving(false);
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
            <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="check" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Avatar Section */}
          <Animatable.View animation="fadeInUp" style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: selectedAvatar?.uri || (user.user?.profile_photo_url ? `${user.user.profile_photo_url}?t=${Date.now()}` : 'https://via.placeholder.com/120')
                }} 
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.avatarEditButton}
                onPress={showAvatarPicker}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.avatarEditIcon}
                >
                  <Icon name="camera-alt" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {selectedAvatar && (
              <Animatable.View animation="slideInUp" style={styles.avatarActions}>
                <ModernButton
                  title={uploadingAvatar ? "Đang tải..." : "Cập nhật ảnh"}
                  size="small"
                  onPress={uploadAvatar}
                  disabled={uploadingAvatar}
                  style={styles.uploadButton}
                />
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setSelectedAvatar(null)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
              </Animatable.View>
            )}
          </Animatable.View>

          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên *"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại *"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="school" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mã số sinh viên"
                value={formData.studentId}
                onChangeText={(value) => updateFormData('studentId', value)}
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Liên hệ khẩn cấp</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="emergency" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại người thân"
                value={formData.emergencyContact}
                onChangeText={(value) => updateFormData('emergencyContact', value)}
                keyboardType="phone-pad"
              />
            </View>
            
            <Text style={styles.helperText}>
              Số này sẽ được sử dụng trong trường hợp khẩn cấp
            </Text>
          </View>

          {/* Account Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Tài khoản</Text>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Icon name="lock" size={24} color="#666" />
              <Text style={styles.actionText}>Đổi mật khẩu</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => navigation.navigate('ProfileSwitch')}
            >
              <Icon name="swap-horiz" size={24} color="#666" />
              <Text style={styles.actionText}>Chuyển đổi chế độ</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <ModernButton
            title={saving ? "Đang lưu..." : "Lưu thay đổi"}
            onPress={saveProfile}
            disabled={saving}
            icon={saving ? null : "save"}
            style={styles.saveButtonBottom}
          />

          {/* Info */}
          <View style={styles.infoCard}>
            <Icon name="info" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Một số thông tin có thể cần xác minh lại sau khi thay đổi. 
              Bạn sẽ nhận được email thông báo nếu cần thiết.
            </Text>
          </View>
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
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  avatarEditIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  uploadButton: {
    minWidth: 120,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  formSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1a1a1a',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -8,
  },
  actionsSection: {
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
  },
  saveButtonBottom: {
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
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
});

export default EditProfileScreen;
