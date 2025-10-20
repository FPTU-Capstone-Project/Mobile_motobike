import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import CleanCard from './ui/CleanCard.jsx';
import { colors } from '../theme/designTokens';

const ModeSelector = ({ mode, onModeChange, userType = 'user' }) => {
  const modes = [
    {
      key: 'manual',
      title: userType === 'driver' ? 'Tìm thủ công' : 'Tìm tài xế',
      subtitle: userType === 'driver' ? 'Tự chọn khách hàng' : 'Chọn tài xế xung quanh',
      icon: 'search',
      color: colors.primary
    },
    {
      key: 'auto',
      title: 'Tự động',
      subtitle: userType === 'driver' ? 'Hệ thống tìm khách' : 'Hệ thống tìm xe',
      icon: 'auto-fix-high',
      color: colors.accent
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chế độ tìm kiếm</Text>
      <View style={styles.modesContainer}>
        {modes.map((modeOption, index) => (
          <TouchableOpacity
            key={modeOption.key}
            style={[styles.touchWrapper, index === modes.length - 1 && styles.touchWrapperLast]}
            onPress={() => onModeChange(modeOption.key)}
            activeOpacity={0.8}
          >
            <CleanCard
              style={[styles.modeCard, mode === modeOption.key && styles.selectedMode]}
              contentStyle={styles.modeContent}
            >
              <Animatable.View
                animation={mode === modeOption.key ? 'pulse' : undefined}
                iterationCount={mode === modeOption.key ? 'infinite' : 1}
                direction="alternate"
                style={[
                  styles.iconContainer,
                  { backgroundColor: mode === modeOption.key ? modeOption.color : 'rgba(248,250,252,0.95)' }
                ]}
              >
                <Icon 
                  name={modeOption.icon} 
                  size={24} 
                  color={mode === modeOption.key ? '#fff' : colors.textSecondary} 
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
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
  },
  modesContainer: {
    flexDirection: 'row',
  },
  touchWrapper: { flex: 1, marginRight: 12 },
  touchWrapperLast: { marginRight: 0 },
  modeCard: {
    flex: 1,
    borderRadius: 24,
  },
  modeContent: {
    padding: 20,
  },
  selectedMode: {
    borderColor: 'rgba(59,130,246,0.35)',
    borderWidth: 1.4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
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
