import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CleanHeader = ({ title, subtitle, onBellPress }) => {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onBellPress && (
        <TouchableOpacity onPress={onBellPress} style={styles.bell}>
          <Icon name="notifications" size={22} color="#111827" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  subtitle: { color: '#6B7280', fontSize: 14 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700', marginTop: 6 },
  bell: { padding: 8 },
});

export default CleanHeader;



