import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export function Card({ children, style, onPress }) {
  const { colors } = useTheme();
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Container>
  );
}

export function CardHeader({ title, subtitle, right, style }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }, style]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

export function CardBody({ children, style }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
});
