import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Badge({ text, type = 'info', size = 'medium' }) {
  const { colors } = useTheme();
  
  const typeColors = {
    success: { bg: colors.success + '20', text: colors.success },
    warning: { bg: colors.warning + '20', text: colors.warning },
    danger: { bg: colors.danger + '20', text: colors.danger },
    info: { bg: colors.info + '20', text: colors.info },
    purple: { bg: colors.purple + '20', text: colors.purple },
  };
  
  const colorSet = typeColors[type] || typeColors.info;
  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: colorSet.text }, isSmall && styles.textSmall]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 10,
  },
});
