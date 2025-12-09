import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  loading = false, 
  disabled = false,
  size = 'medium',
  style 
}) {
  const { colors } = useTheme();
  
  const variants = {
    primary: { bg: colors.primary, text: '#fff' },
    secondary: { bg: colors.card, text: colors.text, border: colors.border },
    success: { bg: colors.success, text: '#fff' },
    danger: { bg: colors.danger, text: '#fff' },
    ghost: { bg: 'transparent', text: colors.textSecondary },
  };
  
  const v = variants[variant] || variants.primary;
  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        isSmall && styles.buttonSmall,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={isSmall ? 16 : 20} color={v.text} style={styles.icon} />}
          <Text style={[styles.text, { color: v.text }, isSmall && styles.textSmall]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
});
