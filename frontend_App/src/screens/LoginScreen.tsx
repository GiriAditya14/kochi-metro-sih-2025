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
  ScrollView,
} from 'react-native';
import { colors } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type AuthStep = 'phone' | 'otp' | 'role_select';
type UserRole = 'admin' | 'supervisor' | 'worker';

const ROLES: { id: UserRole; label: string; icon: string; description: string }[] = [
  { id: 'admin', label: 'Administrator', icon: '👑', description: 'Full system access' },
  { id: 'supervisor', label: 'Supervisor', icon: '👔', description: 'Manage operations' },
  { id: 'worker', label: 'Worker', icon: '🔧', description: 'View & basic tasks' },
];

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');
  const [isLoading, setIsLoading] = useState(false);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  
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
      console.log('[Auth] Sending OTP to:', phoneNumber);
      const response = await api.post('/auth/send-otp', {
        phone_number: phoneNumber,
      });

      console.log('[Auth] OTP Response:', response.data);
      
      if (response.data.success) {
        // Store dev OTP for display (remove in production)
        if (response.data.dev_otp) {
          setServerOtp(response.data.dev_otp);
        }
        setStep('otp');
        Alert.alert(
          'OTP Sent ✅',
          `OTP sent to +91${phoneNumber}\n\nCheck backend terminal for OTP code.`
        );
      }
    } catch (error: any) {
      console.error('[Auth] Send OTP Error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP');
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
      console.log('[Auth] Verifying OTP:', otpCode);
      const response = await api.post('/auth/verify-otp', {
        phone_number: phoneNumber,
        otp: otpCode,
      });

      console.log('[Auth] Verify Response:', response.data);

      if (response.data.success && response.data.user) {
        const user = response.data.user;
        const token = response.data.token;
        
        await login(token, user);
        
        Alert.alert(
          'Login Successful ✅',
          `Welcome!\n\nRole: ${user.role.toUpperCase()}\nPhone: ${user.phone_number}`
        );
      }
    } catch (error: any) {
      console.error('[Auth] Verify OTP Error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };


  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setServerOtp(null);
    handleSendOTP();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              <>
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
                
                {/* Show OTP hint in dev mode */}
                {serverOtp && (
                  <View style={styles.otpHint}>
                    <Text style={styles.otpHintText}>
                      🔑 Dev OTP: {serverOtp}
                    </Text>
                  </View>
                )}
              </>
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
                  {step === 'phone' ? 'Send OTP' : 'Verify & Login'}
                </Text>
              )}
            </TouchableOpacity>

            {step === 'otp' && (
              <View style={styles.otpActions}>
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                    setServerOtp(null);
                  }}
                >
                  <Text style={styles.changeText}>Change Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Role Info */}
          <View style={styles.roleInfo}>
            <Text style={styles.roleInfoTitle}>📋 Role-Based Access</Text>
            {ROLES.map((role) => (
              <View key={role.id} style={styles.roleItem}>
                <Text style={styles.roleIcon}>{role.icon}</Text>
                <View>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
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
    marginBottom: 16,
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
  otpHint: {
    backgroundColor: colors.green[500] + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  otpHintText: {
    color: colors.green[400],
    fontSize: 16,
    fontWeight: '600',
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
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: colors.primary[400],
  },
  changeText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  roleInfo: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 16,
  },
  roleInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  roleIcon: {
    fontSize: 20,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: colors.text.muted,
  },
});

export default LoginScreen;
