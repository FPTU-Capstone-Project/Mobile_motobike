import React, { useEffect, useRef, useState } from 'react';
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
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import AppBackground from '../../components/layout/AppBackground.jsx';
import CleanCard from '../../components/ui/CleanCard.jsx';
import { SoftBackHeader } from '../../components/ui/GlassHeader.jsx';
import authService from '../../services/authService';
import { colors } from '../../theme/designTokens';

const OTP_LENGTH = 6;

const OTPVerificationScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { email, purpose = 'VERIFY_EMAIL' } = route.params || {};

  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    requestOtp();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const requestOtp = async () => {
    try {
      setLoading(true);
      await authService.requestOtp(purpose, email);
      setCountdown(60);
    } catch (error) {
      Alert.alert('Không thể gửi mã OTP', error?.message || 'Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Thiếu mã', 'Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }

    try {
      setVerifying(true);
      await authService.verifyOtp(code, purpose, email);

      if (purpose === 'password_reset') {
        Alert.alert(
          'Xác minh thành công',
          'Mã OTP hợp lệ. Vui lòng đặt lại mật khẩu theo hướng dẫn gửi tới email của bạn.',
          [{ text: 'Quay lại đăng nhập', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert(
          'Xác minh thành công',
          'Email đã được xác minh. Bạn có thể đăng nhập và tiếp tục sử dụng ứng dụng.',
          [{ text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert('Mã OTP không hợp lệ', error?.message || 'Vui lòng kiểm tra lại và thử lại.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      await authService.requestOtp(purpose, email);
      setCountdown(60);
      Alert.alert('Đã gửi', 'Mã OTP mới đã được gửi tới email của bạn.');
    } catch (error) {
      Alert.alert('Không thể gửi lại OTP', error?.message || 'Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <SoftBackHeader
          floating
          topOffset={insets.top + 12}
          title=""
          subtitle=""
          onBackPress={() => navigation.goBack()}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 126 }]}
          >
            <CleanCard contentStyle={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Feather name="mail" size={22} color={colors.accent} />
              </View>
              <View style={{ gap: 6 }}>
                <Text style={styles.heroTitle}>Xác minh OTP</Text>
                <Text style={styles.heroSubtitle}>
                  Nhập mã OTP gồm 6 chữ số đã được gửi tới email {email}.
                </Text>
              </View>
            </CleanCard>

            <CleanCard contentStyle={styles.cardContent}>
              <View style={styles.otpRow}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, verifying && { opacity: 0.7 }]}
                disabled={verifying}
                onPress={handleVerify}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Xác minh</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Không nhận được mã?</Text>
                <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
                  <Text style={styles.resendButton}>
                    {resending ? 'Đang gửi...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </CleanCard>

            <View style={styles.noteCard}>
              <Feather name="info" size={16} color={colors.textSecondary} />
              <Text style={styles.noteText}>
                Nếu không thấy email, hãy kiểm tra thêm hộp thư spam hoặc quảng cáo.
              </Text>
            </View>

            {loading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#000000" />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 24,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardContent: {
    padding: 24,
    gap: 24,
  },
});

export default OTPVerificationScreen;
