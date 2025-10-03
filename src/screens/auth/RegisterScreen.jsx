import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons'; // khuyên dùng với Expo
import authService from '../../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  // All users register as riders by default, can upgrade to driver later
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check password strength if password field is being updated
    if (field === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setPasswordChecks(checks);
    
    // Calculate strength (0-5)
    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#F44336'; // Red
    if (passwordStrength <= 2) return '#FF9800'; // Orange
    if (passwordStrength <= 3) return '#FFEB3B'; // Yellow
    if (passwordStrength <= 4) return '#8BC34A'; // Light Green
    return '#4CAF50'; // Green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Rất yếu';
    if (passwordStrength <= 2) return 'Yếu';
    if (passwordStrength <= 3) return 'Trung bình';
    if (passwordStrength <= 4) return 'Mạnh';
    return 'Rất mạnh';
  };

  const validate = () => {
    const { studentId, name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return false;
    }
    // studentId có thể để optional theo API của bạn:
    // if (!studentId) { Alert.alert('Lỗi', 'Vui lòng nhập MSSV'); return false; }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }
    
    // Enhanced password validation
    if (password.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }
    
    if (passwordStrength < 4) {
      Alert.alert('Lỗi', 'Mật khẩu chưa đủ mạnh. Vui lòng đáp ứng tất cả các yêu cầu bảo mật.');
      return false;
    }
    // check email đơn giản
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return false;
    }
    // check phone đơn giản
    if (!/^[0-9]{9,11}$/.test(phone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // Map sang body API - All users register as riders
      const payload = {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      const res = await authService.register(payload);

      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập và xác minh thông tin sinh viên để sử dụng đầy đủ dịch vụ.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      Alert.alert('Đăng ký thất bại', err?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Đăng ký tài khoản</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới để sử dụng dịch vụ</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={formData.name}
                onChangeText={(v) => handleInputChange('name', v)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email sinh viên"
                value={formData.email}
                onChangeText={(v) => handleInputChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={formData.phone}
                onChangeText={(v) => handleInputChange('phone', v)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={formData.password}
                onChangeText={(v) => handleInputChange('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthBarContainer}>
                  <View 
                    style={[
                      styles.strengthBar, 
                      { 
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                  {getPasswordStrengthText()}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            {formData.password.length > 0 && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <Icon 
                      name={passwordChecks.length ? 'check-circle' : 'radio-button-unchecked'} 
                      size={16} 
                      color={passwordChecks.length ? '#4CAF50' : '#ccc'} 
                    />
                    <Text style={[styles.requirementText, { color: passwordChecks.length ? '#4CAF50' : '#666' }]}>
                      Ít nhất 8 ký tự
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Icon 
                      name={passwordChecks.lowercase ? 'check-circle' : 'radio-button-unchecked'} 
                      size={16} 
                      color={passwordChecks.lowercase ? '#4CAF50' : '#ccc'} 
                    />
                    <Text style={[styles.requirementText, { color: passwordChecks.lowercase ? '#4CAF50' : '#666' }]}>
                      Chữ cái thường (a-z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Icon 
                      name={passwordChecks.uppercase ? 'check-circle' : 'radio-button-unchecked'} 
                      size={16} 
                      color={passwordChecks.uppercase ? '#4CAF50' : '#ccc'} 
                    />
                    <Text style={[styles.requirementText, { color: passwordChecks.uppercase ? '#4CAF50' : '#666' }]}>
                      Chữ cái in hoa (A-Z)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Icon 
                      name={passwordChecks.number ? 'check-circle' : 'radio-button-unchecked'} 
                      size={16} 
                      color={passwordChecks.number ? '#4CAF50' : '#ccc'} 
                    />
                    <Text style={[styles.requirementText, { color: passwordChecks.number ? '#4CAF50' : '#666' }]}>
                      Số (0-9)
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Icon 
                      name={passwordChecks.special ? 'check-circle' : 'radio-button-unchecked'} 
                      size={16} 
                      color={passwordChecks.special ? '#4CAF50' : '#ccc'} 
                    />
                    <Text style={[styles.requirementText, { color: passwordChecks.special ? '#4CAF50' : '#666' }]}>
                      Ký tự đặc biệt (!@#$%...)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChangeText={(v) => handleInputChange('confirmPassword', v)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 40 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 10, marginTop: 30 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  form: { marginBottom: 30 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    marginBottom: 15, paddingHorizontal: 15, height: 50
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  eyeIcon: { padding: 5 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 5 },
  roleLabel: { marginRight: 10, color: '#000', fontWeight: '600' },
  roleGroup: { flexDirection: 'row', gap: 8 },
  roleBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6' },
  roleBtnActive: { backgroundColor: '#000' },
  roleText: { color: '#374151', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  registerButton: {
    backgroundColor: '#000', borderRadius: 8, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 20
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 14 },
  loginLink: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  
  // Password Strength Styles
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Password Requirements Styles
  passwordRequirements: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
});

export default RegisterScreen;
