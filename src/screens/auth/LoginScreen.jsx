import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontAwesome } from '@expo/vector-icons'; // icon cho Google/Facebook
import authService from '../../services/authService';
import { ApiError } from '../../services/api';
import GlassButton from '../../components/ui/GlassButton.jsx';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetProfile, setTargetProfile] = useState('rider'); // Default to rider

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(email, password, targetProfile);
      if (result.success) {
        // Always go to Main screen first, verification check will be done in Main screen
        navigation.replace(targetProfile === 'driver' ? 'DriverMain' : 'Main');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check for email verification pending
      if (error.message === "Email verification is pending" || 
          error.data?.error?.id === "auth.unauthorized.email-verification-pending") {
        Alert.alert(
          'Cần xác minh email',
          'Email của bạn chưa được xác minh. Chúng tôi sẽ gửi mã OTP để xác minh.',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác minh ngay', 
              onPress: () => {
                navigation.navigate('OTPVerification', {
                  email: email,
                  purpose: 'VERIFY_EMAIL'
                });
              }
            }
          ]
        );
        return;
      }
      
      let errorMessage = 'Đã có lỗi xảy ra';
      if (error instanceof ApiError) {
        // Handle session expired from auto token refresh
        if (error.data?.requiresLogin) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else {
          switch (error.status) {
            case 401:
              errorMessage = 'Email hoặc mật khẩu không chính xác'; 
              break;
            case 400:
              errorMessage = error.message || 'Thông tin không hợp lệ'; 
              break;
            case 0:
              errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'; 
              break;
            default:
              errorMessage = error.message || errorMessage;
          }
        }
      }
      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Stub – chỉ UI
  const handleLoginGoogle = () => Alert.alert('Google', 'Login with Google (UI only)');
  const handleLoginFacebook = () => Alert.alert('Facebook', 'Login with Facebook (UI only)');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.inner}>
          {/* Illustration */}
          <Image
            source={require('../../../assets/login_image.png')}
            style={styles.illustration}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.welcome}>Welcome Back</Text>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
              <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Target Profile Selector */}
          <View style={styles.profileSelector}>
            <Text style={styles.profileLabel}>Đăng nhập với tư cách:</Text>
            <View style={styles.profileButtons}>
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  targetProfile === 'rider' && styles.profileButtonActive
                ]}
                onPress={() => setTargetProfile('rider')}
              >
                <Icon 
                  name="person" 
                  size={18} 
                  color={targetProfile === 'rider' ? '#fff' : '#666'} 
                  style={styles.profileIcon}
                />
                <Text style={[
                  styles.profileButtonText,
                  targetProfile === 'rider' && styles.profileButtonTextActive
                ]}>
                  Rider
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  targetProfile === 'driver' && styles.profileButtonActive
                ]}
                onPress={() => setTargetProfile('driver')}
              >
                <Icon 
                  name="directions-car" 
                  size={18} 
                  color={targetProfile === 'driver' ? '#fff' : '#666'} 
                  style={styles.profileIcon}
                />
                <Text style={[
                  styles.profileButtonText,
                  targetProfile === 'driver' && styles.profileButtonTextActive
                ]}>
                  Driver
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Sign In */}
          <GlassButton title={loading ? '...' : 'Sign In'} onPress={handleLogin} />

          {/* Divider: Or With */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or With</Text>
            <View style={styles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleLoginGoogle} activeOpacity={0.9}>
              <FontAwesome name="google" size={18} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} onPress={handleLoginFacebook} activeOpacity={0.9}>
              <FontAwesome name="facebook" size={18} color="#1877F2" style={styles.socialIcon} />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: '#fff' },
  kav: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },

  // Illustration
  illustration: {
    width: '100%',
    height: 320,
    alignSelf: 'center',
    marginTop: -100
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 12
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14
  },

  // Title
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: -30
  },

  // Inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#000' },
  eye: { padding: 5 },

  // Button
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  buttonDisabled: { backgroundColor: '#333', opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500'
  },

  // Social buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18
  },
  socialBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  socialIcon: { marginRight: 8 },
  socialText: { fontSize: 14, color: '#111827', fontWeight: '600' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  registerLink: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  // Profile Selector Styles
  profileSelector: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  profileButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  profileButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  profileIcon: {
    // No additional styles needed, color is set dynamically
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  profileButtonTextActive: {
    color: '#fff',
  },
});

export default LoginScreen;
