import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import CleanCard from './ui/CleanCard.jsx';

const ModeSelector = ({ mode, onModeChange, userType = 'user' }) => {
  const modes = [
    {
      key: 'manual',
      title: userType === 'driver' ? 'Tìm thủ công' : 'Tìm tài xế',
      subtitle: userType === 'driver' ? 'Tự chọn khách hàng' : 'Chọn tài xế xung quanh',
      icon: 'search',
      color: '#2196F3'
    },
    {
      key: 'auto',
      title: 'Tự động',
      subtitle: userType === 'driver' ? 'Hệ thống tìm khách' : 'Hệ thống tìm xe',
      icon: 'auto-fix-high',
      color: '#4CAF50'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chế độ tìm kiếm</Text>
      <View style={styles.modesContainer}>
        {modes.map((modeOption) => (
          <TouchableOpacity
            key={modeOption.key}
            style={[styles.touchWrapper]}
            onPress={() => onModeChange(modeOption.key)}
            activeOpacity={0.8}
          >
            <CleanCard style={[styles.modeCard, mode === modeOption.key && styles.selectedMode]}>
              <Animatable.View
                animation={mode === modeOption.key ? 'pulse' : undefined}
                iterationCount={mode === modeOption.key ? 'infinite' : 1}
                direction="alternate"
                style={[
                  styles.iconContainer,
                  { backgroundColor: mode === modeOption.key ? modeOption.color : '#f5f5f5' }
                ]}
              >
                <Icon 
                  name={modeOption.icon} 
                  size={24} 
                  color={mode === modeOption.key ? '#fff' : modeOption.color} 
                />
              </Animatable.View>
              
              <View style={styles.textContainer}>
                <Text style={[
                  styles.modeTitle,
                  mode === modeOption.key && { color: modeOption.color }
                ]}>
                  {modeOption.title}
                </Text>
                <Text style={styles.modeSubtitle}>
                  {modeOption.subtitle}
                </Text>
              </View>
              
              {mode === modeOption.key && (
                <View style={[styles.selectedIndicator, { backgroundColor: modeOption.color }]}> 
                  <Icon name="check" size={16} color="#fff" />
                </View>
              )}
            </CleanCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    marginLeft: 4,
  },
  modesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  touchWrapper: { flex: 1 },
  modeCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  selectedMode: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModeSelector;
