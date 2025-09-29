import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [loading, setLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return false;
    }

    if (!formData.newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return false;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Mật khẩu không hợp lệ', 
        'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'
      );
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return false;
    }

    return true;
  };

  const changePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.updatePassword(formData.currentPassword, formData.newPassword);
      
      Alert.alert(
        'Thành công', 
        'Mật khẩu đã được thay đổi thành công',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Không thể thay đổi mật khẩu';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            errorMessage = 'Mật khẩu hiện tại không chính xác';
            break;
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <Animatable.View animation="fadeInUp" style={styles.instructionsCard}>
            <Icon name="security" size={48} color="#FF9800" />
            <Text style={styles.instructionsTitle}>Bảo mật tài khoản</Text>
            <Text style={styles.instructionsText}>
              Để bảo vệ tài khoản của bạn, hãy sử dụng mật khẩu mạnh và không chia sẻ với người khác.
            </Text>
          </Animatable.View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thay đổi mật khẩu</Text>
            
            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu hiện tại"
                value={formData.currentPassword}
                onChangeText={(value) => updateFormData('currentPassword', value)}
                secureTextEntry={!showPasswords.current}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('current')}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPasswords.current ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                value={formData.newPassword}
                onChangeText={(value) => updateFormData('newPassword', value)}
                secureTextEntry={!showPasswords.new}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('new')}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPasswords.new ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu mới"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showPasswords.confirm}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('confirm')}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPasswords.confirm ? 'visibility' : 'visibility-off'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          {formData.newPassword.length > 0 && (
            <Animatable.View animation="slideInUp" style={styles.requirementsCard}>
              <Text style={styles.cardTitle}>Yêu cầu mật khẩu</Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Icon 
                    name={passwordValidation.minLength ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={passwordValidation.minLength ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.minLength ? '#4CAF50' : '#F44336' }
                  ]}>
                    Ít nhất 8 ký tự
                  </Text>
                </View>
                
                <View style={styles.requirementItem}>
                  <Icon 
                    name={passwordValidation.hasUpperCase ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={passwordValidation.hasUpperCase ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasUpperCase ? '#4CAF50' : '#F44336' }
                  ]}>
                    Có chữ hoa
                  </Text>
                </View>
                
                <View style={styles.requirementItem}>
                  <Icon 
                    name={passwordValidation.hasLowerCase ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={passwordValidation.hasLowerCase ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasLowerCase ? '#4CAF50' : '#F44336' }
                  ]}>
                    Có chữ thường
                  </Text>
                </View>
                
                <View style={styles.requirementItem}>
                  <Icon 
                    name={passwordValidation.hasNumbers ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={passwordValidation.hasNumbers ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[
                    styles.requirementText,
                    { color: passwordValidation.hasNumbers ? '#4CAF50' : '#F44336' }
                  ]}>
                    Có số
                  </Text>
                </View>
              </View>
            </Animatable.View>
          )}

          {/* Password Match Indicator */}
          {formData.confirmPassword.length > 0 && (
            <Animatable.View animation="slideInUp" style={styles.matchCard}>
              <Icon 
                name={formData.newPassword === formData.confirmPassword ? 'check-circle' : 'cancel'} 
                size={20} 
                color={formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[
                styles.matchText,
                { color: formData.newPassword === formData.confirmPassword ? '#4CAF50' : '#F44336' }
              ]}>
                {formData.newPassword === formData.confirmPassword 
                  ? 'Mật khẩu khớp' 
                  : 'Mật khẩu không khớp'
                }
              </Text>
            </Animatable.View>
          )}

          {/* Change Password Button */}
          <ModernButton
            title={loading ? "Đang thay đổi..." : "Đổi mật khẩu"}
            onPress={changePassword}
            disabled={loading || !passwordValidation.isValid}
            icon={loading ? null : "security"}
            style={styles.changeButton}
          />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF9800" />
              <Text style={styles.loadingText}>Đang xử lý...</Text>
            </View>
          )}

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ResetPassword')}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu hiện tại?</Text>
          </TouchableOpacity>

          {/* Security Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.cardTitle}>Mẹo bảo mật</Text>
            <View style={styles.tip}>
              <Icon name="lightbulb" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Sử dụng mật khẩu khác nhau cho các tài khoản khác nhau
              </Text>
            </View>
            <View style={styles.tip}>
              <Icon name="lightbulb" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Không chia sẻ mật khẩu với bất kỳ ai
              </Text>
            </View>
            <View style={styles.tip}>
              <Icon name="lightbulb" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>
                Thay đổi mật khẩu định kỳ để tăng cường bảo mật
              </Text>
            </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  eyeIcon: {
    padding: 5,
  },
  requirementsCard: {
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
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  matchText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  changeButton: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  tipsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default ChangePasswordScreen;
