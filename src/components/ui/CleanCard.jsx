import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const CleanCard = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)', // subtle neutral border
    ...Platform.select({
      ios: {
        shadowColor: '#121826',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default CleanCard;


