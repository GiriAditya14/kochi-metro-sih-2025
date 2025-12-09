import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

type AuthStep = 'phone' | 'otp';

/**
 * Login Screen with OTP Authentication
 * 
 * DEV MODE: Simulates OTP for testing (any 6-digit code works)
 * PRODUCTION: Will use Firebase Phone Auth (requires native build)
 */
const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  
  const otpInputs = useRef<(TextInput | null)[]>([]);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      // DEV MODE: Simulate OTP sent
      // In production, integrate Firebase Phone Auth here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('otp');
      Alert.alert('OTP Sent', `OTP sent to +91${phoneNumber}\n\n(Dev mode: Enter any 6 digits)`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      // DEV MODE: Generate mock token
      // In production, verify with Firebase and get real ID token
      const mockIdToken = `dev_token_${Date.now()}_${phoneNumber}`;
      
      // Verify with backend
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: mockIdToken,
          phone_number: `+91${phoneNumber}`,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        await login(mockIdToken, data.user);
        Alert.alert('Success', `Welcome ${data.user.name || 'User'}!\nRole: ${data.user.role}`);
      } else {
        throw new Error(data.detail || 'Verification failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🚇</Text>
          </View>
          <Text style={styles.logoTitle}>KMRL</Text>
          <Text style={styles.logoSubtitle}>Induction Planner</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {step === 'phone' ? 'Login with Phone' : 'Enter OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Enter your phone number to receive OTP'
              : `OTP sent to +91${phoneNumber}`}
          </Text>

          {step === 'phone' ? (
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                maxLength={10}
              />
            </View>
          ) : (
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpInputs.current[index] = ref)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(nativeEvent.key, index)
                  }
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 'phone' ? 'Send OTP' : 'Verify OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {step === 'otp' && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setStep('phone');
                setOtp(['', '', '', '', '', '']);
              }}
            >
              <Text style={styles.resendText}>Change phone number</Text>
            </TouchableOpacity>
          )}

          {/* Dev mode indicator */}
          <View style={styles.devBadge}>
            <Text style={styles.devText}>🔧 Dev Mode - Any OTP works</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  logoSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  countryCode: {
    backgroundColor: colors.slate[700],
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.slate[800],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: colors.slate[800],
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 40,
  },
  button: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: colors.primary[400],
  },
  devBadge: {
    marginTop: 20,
    padding: 8,
    backgroundColor: colors.amber[500] + '20',
    borderRadius: 8,
    alignItems: 'center',
  },
  devText: {
    fontSize: 12,
    color: colors.amber[400],
  },
});

export default LoginScreen;
