import React, { useState, useEffect } from 'react';
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
import * as ImageManipulator from 'expo-image-manipulator';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import verificationService from '../../services/verificationService';
import { ApiError } from '../../services/api';

const StudentVerificationScreen = ({ navigation }) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentSide, setCurrentSide] = useState('front'); // 'front' or 'back'
  const [currentVerification, setCurrentVerification] = useState(null);

  // Load current verification status
  useEffect(() => {
    loadCurrentVerification();
  }, []);

  const loadCurrentVerification = async () => {
    try {
      const verification = await verificationService.getCurrentStudentVerification();
      setCurrentVerification(verification);
      
      // If user already has pending verification, show alert and go back
      if (verification && verification.status?.toLowerCase() === 'pending') {
        Alert.alert(
          'Đang chờ duyệt',
          'Bạn đã gửi yêu cầu xác minh và đang chờ admin duyệt. Vui lòng chờ kết quả.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // If user already verified, show alert and go back
      if (verification && (verification.status?.toLowerCase() === 'verified' || verification.status?.toLowerCase() === 'approved' || verification.status?.toLowerCase() === 'active')) {
        Alert.alert(
          'Đã xác minh',
          'Tài khoản của bạn đã được xác minh.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // If user's verification was rejected, just log it (don't show alert again)
      // The alert was already shown in ProfileSwitchScreen
      if (verification && verification.status?.toLowerCase() === 'rejected') {
        console.log('User has rejected verification, allowing resubmission');
        // Continue with the form to allow resubmission
        return;
      }
    } catch (error) {
      console.log('No current verification found or error:', error);
      setCurrentVerification(null);
    }
  };

  // Convert and compress image to JPEG format
  const compressImage = async (imageUri) => {
    try {
      console.log('Converting and compressing image:', imageUri);
      
      // Convert to JPEG and resize to reduce file size
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Resize to reasonable size
        ],
        { 
          compress: 0.7, // Good quality (70%)
          format: ImageManipulator.SaveFormat.JPEG, // Force JPEG format
          base64: false // Don't include base64 to reduce memory usage
        }
      );
      
      console.log('Image converted to JPEG:', {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        fileSize: manipResult.fileSize
      });
      
      // If still too large, compress more aggressively
      if (manipResult.fileSize && manipResult.fileSize > 5 * 1024 * 1024) { // 5MB limit
        console.log('Still too large, compressing more aggressively...');
        const secondPass = await ImageManipulator.manipulateAsync(
          manipResult.uri,
          [{ resize: { width: 800 } }],
          { 
            compress: 0.5, // Lower quality (50%)
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false
          }
        );
        console.log('Second compression result:', {
          uri: secondPass.uri,
          fileSize: secondPass.fileSize
        });
        return secondPass;
      }
      
      return manipResult;
    } catch (error) {
      console.error('Error converting image to JPEG:', error);
      throw new Error('Không thể xử lý ảnh. Vui lòng chọn ảnh khác.');
    }
  };

  const pickImage = async (side) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Only images
        allowsEditing: false,
        quality: 1, // Use full quality first, we'll convert to JPEG later
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        const originalImage = result.assets[0];
        console.log('Original image info:', {
          uri: originalImage.uri,
          type: originalImage.type,
          fileSize: originalImage.fileSize,
          width: originalImage.width,
          height: originalImage.height
        });
        
        try {
          // Convert to JPEG format (handles HEIC, PNG, etc.)
          console.log('Converting image to JPEG format...');
          const compressedImage = await compressImage(originalImage.uri);
          
          const processedImage = {
            uri: compressedImage.uri,
            type: 'image/jpeg', // Force JPEG type
            fileName: `student_id_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed image info:', processedImage);
          
          if (side === 'front') {
            setFrontImage(processedImage);
          } else {
            setBackImage(processedImage);
          }
          
        } catch (compressError) {
          console.error('Error converting image:', compressError);
          Alert.alert('Lỗi', compressError.message || 'Không thể xử lý ảnh. Vui lòng chọn ảnh khác.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
    }
  };

  const takePhoto = async (side) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Only images
        allowsEditing: false,
        quality: 1, // Use full quality first, we'll convert to JPEG later
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        const originalImage = result.assets[0];
        console.log('Original photo info:', {
          uri: originalImage.uri,
          type: originalImage.type,
          fileSize: originalImage.fileSize,
          width: originalImage.width,
          height: originalImage.height
        });
        
        try {
          // Convert to JPEG format
          console.log('Converting photo to JPEG format...');
          const compressedImage = await compressImage(originalImage.uri);
          
          const processedImage = {
            uri: compressedImage.uri,
            type: 'image/jpeg', // Force JPEG type
            fileName: `student_id_${side}_${Date.now()}.jpg`,
            fileSize: compressedImage.fileSize,
            width: compressedImage.width,
            height: compressedImage.height,
          };
          
          console.log('Processed photo info:', processedImage);
          
          if (side === 'front') {
            setFrontImage(processedImage);
          } else {
            setBackImage(processedImage);
          }
          
        } catch (compressError) {
          console.error('Error converting photo:', compressError);
          Alert.alert('Lỗi', compressError.message || 'Không thể xử lý ảnh. Vui lòng chụp lại.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showImagePicker = (side) => {
    setCurrentSide(side);
    Alert.alert(
      `Chọn ảnh mặt ${side === 'front' ? 'trước' : 'sau'}`,
      'Chọn cách thức để tải ảnh thẻ sinh viên',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto(side) },
        { text: 'Chọn từ thư viện', onPress: () => pickImage(side) },
      ]
    );
  };

  const submitVerification = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('Lỗi', 'Vui lòng chụp đầy đủ 2 mặt thẻ sinh viên');
      return;
    }

    setUploading(true);

    try {
      // Validate files first
      verificationService.validateDocumentFile(frontImage);
      verificationService.validateDocumentFile(backImage);

      // Create document files array
      const documentFiles = [
        {
          uri: frontImage.uri,
          mimeType: frontImage.mimeType || 'image/jpeg',
          fileName: frontImage.fileName || 'student_id_front.jpg',
          fileSize: frontImage.fileSize,
        },
        {
          uri: backImage.uri,
          mimeType: backImage.mimeType || 'image/jpeg',
          fileName: backImage.fileName || 'student_id_back.jpg',
          fileSize: backImage.fileSize,
        }
      ];

      const result = await verificationService.submitStudentVerification(documentFiles);

      // After successful submission, refresh verification status
      try {
        const updatedVerification = await verificationService.getCurrentStudentVerification();
        setCurrentVerification(updatedVerification);
        console.log('Updated verification status:', updatedVerification);
      } catch (error) {
        console.log('Could not refresh verification status:', error);
      }

      Alert.alert(
        'Gửi thành công!',
        result.message || 'Thẻ sinh viên đã được gửi để xác minh. Admin sẽ duyệt trong 1-2 ngày làm việc.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to Main screen after successful submission
              navigation.replace('Main');
            }
          }
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
              onPress={() => {
                // If user came from login, go to Main screen
                // Otherwise, go back normally
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.replace('Main');
                }
              }}
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

          {/* Front Image Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.cardTitle}>Mặt trước thẻ sinh viên</Text>
            
            {frontImage ? (
              <Animatable.View animation="fadeIn" style={styles.selectedImageContainer}>
                <Image source={{ uri: frontImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={() => showImagePicker('front')}
                >
                  <Icon name="edit" size={20} color="#4CAF50" />
                  <Text style={styles.changeImageText}>Đổi ảnh</Text>
                </TouchableOpacity>
              </Animatable.View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => showImagePicker('front')}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.uploadButtonGradient}
                >
                  <Icon name="camera-alt" size={48} color="#fff" />
                  <Text style={styles.uploadButtonText}>Chụp mặt trước</Text>
                  <Text style={styles.uploadButtonSubtext}>Chụp ảnh hoặc chọn từ thư viện</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Back Image Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.cardTitle}>Mặt sau thẻ sinh viên</Text>
            
            {backImage ? (
              <Animatable.View animation="fadeIn" style={styles.selectedImageContainer}>
                <Image source={{ uri: backImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={() => showImagePicker('back')}
                >
                  <Icon name="edit" size={20} color="#4CAF50" />
                  <Text style={styles.changeImageText}>Đổi ảnh</Text>
                </TouchableOpacity>
              </Animatable.View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => showImagePicker('back')}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.uploadButtonGradient}
                >
                  <Icon name="camera-alt" size={48} color="#fff" />
                  <Text style={styles.uploadButtonText}>Chụp mặt sau</Text>
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
            disabled={!frontImage || !backImage || uploading}
            icon={uploading ? null : "send"}
            style={styles.submitButton}
          />

          {/* Skip Button for Testing */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                Alert.alert(
                  'Bỏ qua xác minh',
                  'Bạn có chắc chắn muốn bỏ qua xác minh? (Chỉ để test)',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                      text: 'Bỏ qua', 
                      onPress: () => navigation.replace('Main')
                    }
                  ]
                );
              }}
            >
              <Text style={styles.skipButtonText}>Bỏ qua tạm thời (Test)</Text>
            </TouchableOpacity>
          )}

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
  skipButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default StudentVerificationScreen;
