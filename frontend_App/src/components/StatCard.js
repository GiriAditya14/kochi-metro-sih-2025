import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function StatCard({ icon, label, value, subValue, color = 'blue', alert = false }) {
  const { colors } = useTheme();
  
  const colorMap = {
    blue: colors.primary,
    green: colors.success,
    orange: colors.warning,
    red: colors.danger,
    purple: colors.purple,
  };
  
  const iconColor = colorMap[color] || colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: alert ? colors.danger : colors.border }]}>
      {alert && <View style={[styles.alertDot, { backgroundColor: colors.danger }]} />}
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {subValue && <Text style={[styles.subValue, { color: colors.textTertiary }]}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '45%',
    marginBottom: 12,
  },
  alertDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    marginTop: 4,
  },
  subValue: {
    fontSize: 11,
    marginTop: 2,
  },
});
