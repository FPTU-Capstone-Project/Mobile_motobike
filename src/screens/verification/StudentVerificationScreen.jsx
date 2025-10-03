import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import verificationService from '../../services/verificationService';
import { ApiError } from '../../services/api';

const StudentVerificationScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.9,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Chọn ảnh',
      'Chọn cách thức để tải ảnh thẻ sinh viên',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage },
      ]
    );
  };

  const submitVerification = async () => {
    if (!selectedImage) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh thẻ sinh viên');
      return;
    }

    setUploading(true);

    try {
      // Validate file first
      verificationService.validateDocumentFile(selectedImage);

      // Create document file object
      const documentFile = {
        uri: selectedImage.uri,
        mimeType: selectedImage.mimeType || 'image/jpeg',
        fileName: selectedImage.fileName || 'student_id.jpg',
        fileSize: selectedImage.fileSize,
      };

      const result = await verificationService.submitStudentVerification(documentFile);

      Alert.alert(
        'Gửi thành công!',
        result.message || 'Thẻ sinh viên đã được gửi để xác minh. Admin sẽ duyệt trong 1-2 ngày làm việc.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Student verification error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể gửi thẻ sinh viên');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Xác minh sinh viên</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <Animatable.View animation="fadeInUp" style={styles.instructionsCard}>
            <Icon name="school" size={48} color="#2196F3" />
            <Text style={styles.instructionsTitle}>Xác minh tài khoản sinh viên</Text>
            <Text style={styles.instructionsText}>
              Để sử dụng dịch vụ, bạn cần xác minh là sinh viên của trường. 
              Vui lòng chụp ảnh thẻ sinh viên rõ nét.
            </Text>
          </Animatable.View>

          {/* Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.cardTitle}>Yêu cầu ảnh thẻ sinh viên</Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>Ảnh rõ nét, không bị mờ</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>Hiển thị đầy đủ thông tin trên thẻ</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>Thẻ còn hiệu lực</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.requirementText}>Định dạng JPG, PNG (tối đa 5MB)</Text>
              </View>
            </View>
          </View>

          {/* Image Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.cardTitle}>Tải ảnh thẻ sinh viên</Text>
            
            {selectedImage ? (
              <Animatable.View animation="fadeIn" style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={showImagePicker}
                >
                  <Icon name="edit" size={20} color="#4CAF50" />
                  <Text style={styles.changeImageText}>Đổi ảnh</Text>
                </TouchableOpacity>
              </Animatable.View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={showImagePicker}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.uploadButtonGradient}
                >
                  <Icon name="cloud-upload" size={48} color="#fff" />
                  <Text style={styles.uploadButtonText}>Chọn ảnh thẻ sinh viên</Text>
                  <Text style={styles.uploadButtonSubtext}>Chụp ảnh hoặc chọn từ thư viện</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Sample Image */}
          <View style={styles.sampleSection}>
            <Text style={styles.cardTitle}>Ảnh mẫu</Text>
            <View style={styles.sampleImageContainer}>
              <View style={styles.sampleImagePlaceholder}>
                <Icon name="credit-card" size={64} color="#ccc" />
                <Text style={styles.sampleImageText}>Mẫu thẻ sinh viên</Text>
              </View>
              <Text style={styles.sampleDescription}>
                Chụp ảnh thẻ sinh viên như mẫu trên, đảm bảo thông tin rõ ràng và đầy đủ
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <ModernButton
            title={uploading ? "Đang gửi..." : "Gửi để xác minh"}
            onPress={submitVerification}
            disabled={!selectedImage || uploading}
            icon={uploading ? null : "send"}
            style={styles.submitButton}
          />

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.uploadingText}>Đang tải lên và xử lý...</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <Icon name="info" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Quá trình xác minh có thể mất 1-2 ngày làm việc. 
              Chúng tôi sẽ thông báo kết quả qua email.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3F2FD',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  changeImageText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  sampleSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sampleImageContainer: {
    alignItems: 'center',
  },
  sampleImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sampleImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  sampleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 16,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadingText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default StudentVerificationScreen;
