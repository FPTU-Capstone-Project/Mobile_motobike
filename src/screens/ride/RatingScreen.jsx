import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

import ratingService from '../../services/ratingService';
import activeRideService from '../../services/activeRideService';

const RatingScreen = ({ navigation, route }) => {
  const {
    rideId,
    requestId,
    driverId,
    driverName,
    totalFare,
    actualDistance,
    actualDuration,
  } = route.params || {};

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick rating suggestions
  const quickComments = [
    'Tài xế rất thân thiện!',
    'Lái xe an toàn',
    'Đúng giờ',
    'Xe sạch sẽ',
    'Chuyên nghiệp',
  ];

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Vui lòng chọn đánh giá', 'Hãy chọn số sao từ 1 đến 5 để đánh giá tài xế.');
      return;
    }

    try {
      setSubmitting(true);
      console.log(`📝 Submitting rating: ${rating} stars for request ${requestId}`);
      
      await ratingService.submitRating(requestId, rating, comment);
      
      // Clear active ride
      await activeRideService.clearActiveRide();
      
      Alert.alert(
        'Cảm ơn bạn!',
        'Đánh giá của bạn đã được ghi nhận.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to RideHistory (Main tab)
              navigation.navigate('Main', { 
                screen: 'History' 
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert(
        'Lỗi',
        'Không thể gửi đánh giá. Vui lòng thử lại sau.',
        [
          { text: 'Thử lại', onPress: handleSubmitRating },
          { text: 'Để sau', onPress: handleSkip },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Bỏ qua đánh giá?',
      'Bạn có thể đánh giá tài xế sau trong lịch sử chuyến đi.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ qua',
          style: 'destructive',
          onPress: async () => {
            await activeRideService.clearActiveRide();
            navigation.navigate('Main', { 
              screen: 'History' 
            });
          },
        },
      ]
    );
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= (hoveredRating || rating);
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          onPressIn={() => setHoveredRating(i)}
          onPressOut={() => setHoveredRating(0)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <Icon
            name={isActive ? 'star' : 'star-border'}
            size={56}
            color={isActive ? '#FFD700' : '#CCCCCC'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1:
        return 'Rất tệ';
      case 2:
        return 'Tệ';
      case 3:
        return 'Bình thường';
      case 4:
        return 'Tốt';
      case 5:
        return 'Xuất sắc';
      default:
        return 'Chọn đánh giá của bạn';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <Animatable.View animation="bounceIn" delay={200} style={styles.iconContainer}>
            <View style={styles.successCircle}>
              <Icon name="check" size={80} color="#4CAF50" />
            </View>
          </Animatable.View>

          {/* Title */}
          <Animatable.Text animation="fadeInUp" delay={400} style={styles.title}>
            Chuyến đi hoàn thành!
          </Animatable.Text>

          {/* Trip Summary */}
          <Animatable.View animation="fadeInUp" delay={500} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Icon name="person" size={20} color="#666" />
              <Text style={styles.summaryLabel}>Tài xế</Text>
              <Text style={styles.summaryValue}>{driverName || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="attach-money" size={20} color="#666" />
              <Text style={styles.summaryLabel}>Tổng chi phí</Text>
              <Text style={styles.summaryValue}>
                {totalFare ? `${Number(totalFare).toLocaleString('vi-VN')} ₫` : 'N/A'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="place" size={20} color="#666" />
              <Text style={styles.summaryLabel}>Quãng đường</Text>
              <Text style={styles.summaryValue}>
                {actualDistance ? `${Number(actualDistance).toFixed(2)} km` : 'N/A'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="schedule" size={20} color="#666" />
              <Text style={styles.summaryLabel}>Thời gian</Text>
              <Text style={styles.summaryValue}>
                {actualDuration ? `${Number(actualDuration)} phút` : 'N/A'}
              </Text>
            </View>
          </Animatable.View>

          {/* Rating Section */}
          <Animatable.View animation="fadeInUp" delay={600} style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Đánh giá tài xế</Text>
            <Text style={styles.ratingSubtitle}>{getRatingText()}</Text>
            
            <View style={styles.starsContainer}>{renderStars()}</View>
          </Animatable.View>

          {/* Quick Comments */}
          {rating > 0 && (
            <Animatable.View animation="fadeInUp" delay={700} style={styles.quickCommentsSection}>
              <Text style={styles.quickCommentsTitle}>Nhận xét nhanh</Text>
              <View style={styles.quickCommentsContainer}>
                {quickComments.map((text, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickCommentChip,
                      comment === text && styles.quickCommentChipActive,
                    ]}
                    onPress={() => setComment(comment === text ? '' : text)}
                  >
                    <Text
                      style={[
                        styles.quickCommentText,
                        comment === text && styles.quickCommentTextActive,
                      ]}
                    >
                      {text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          )}

          {/* Comment Input */}
          {rating > 0 && (
            <Animatable.View animation="fadeInUp" delay={800} style={styles.commentSection}>
              <Text style={styles.commentLabel}>Nhận xét thêm (không bắt buộc)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={500}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{comment.length}/500</Text>
            </Animatable.View>
          )}

          {/* Action Buttons */}
          <Animatable.View animation="fadeInUp" delay={900} style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmitRating}
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={submitting}
            >
              <Text style={styles.skipButtonText}>Để sau</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  ratingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  quickCommentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCommentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  quickCommentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCommentChip: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  quickCommentChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  quickCommentText: {
    fontSize: 14,
    color: '#495057',
  },
  quickCommentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#212529',
    minHeight: 100,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default RatingScreen;

