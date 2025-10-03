import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Lỗi', 'Email không đúng định dạng');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      
      Alert.alert(
        'Đã gửi yêu cầu!',
        'Chúng tôi sẽ gửi mã OTP đến email của bạn để đặt lại mật khẩu.',
        [
          {
            text: 'Tiếp tục',
            onPress: () => {
              navigation.navigate('OTPVerification', {
                email: email,
                purpose: 'password_reset'
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Không thể gửi yêu cầu đặt lại mật khẩu';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            errorMessage = 'Không tìm thấy tài khoản với email này';
            break;
          case 429:
            errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
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
            <Text style={styles.headerTitle}>Quên mật khẩu</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <Animatable.View animation="fadeInUp" style={styles.instructionsContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.iconGradient}
              >
                <Icon name="lock-reset" size={48} color="#fff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu
            </Text>
          </Animatable.View>

          {/* Email Input */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </Animatable.View>

          {/* Reset Button */}
          <Animatable.View animation="fadeInUp" delay={400}>
            <ModernButton
              title={loading ? "Đang gửi..." : "Gửi mã OTP"}
              onPress={handleResetPassword}
              disabled={loading || !email.trim()}
              icon={loading ? null : "send"}
              style={styles.resetButton}
            />
          </Animatable.View>

          {/* Help Text */}
          <Animatable.View animation="fadeInUp" delay={600} style={styles.helpContainer}>
            <Icon name="info-outline" size={16} color="#666" />
            <Text style={styles.helpText}>
              Bạn sẽ nhận được email chứa mã OTP để xác minh và đặt lại mật khẩu mới
            </Text>
          </Animatable.View>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon name="arrow-back" size={16} color="#666" />
            <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
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
    justifyContent: 'center',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  resetButton: {
    marginBottom: 24,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    lineHeight: 20,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;
