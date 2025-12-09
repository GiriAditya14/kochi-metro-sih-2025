import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, borderColor }) => {
  return (
    <View style={[
      styles.card, 
      style,
      borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : {}
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
