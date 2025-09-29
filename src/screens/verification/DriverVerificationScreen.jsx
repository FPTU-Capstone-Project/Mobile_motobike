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
  TextInput,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';

const DriverVerificationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
  });
  
  const [documents, setDocuments] = useState({
    driverLicense: null,
    vehicleRegistration: null,
    vehicleInsurance: null,
  });
  
  const [uploading, setUploading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickDocument = async (documentType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result.assets[0]
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async (documentType) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result.assets[0]
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showDocumentPicker = (documentType, documentName) => {
    Alert.alert(
      'Chọn ảnh',
      `Chọn cách thức để tải ảnh ${documentName}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: () => takePhoto(documentType) },
        { text: 'Chọn từ thư viện', onPress: () => pickDocument(documentType) },
      ]
    );
  };

  const validateForm = () => {
    const requiredFields = ['licenseNumber', 'vehicleBrand', 'vehicleModel', 'vehicleYear', 'vehicleColor', 'licensePlate'];
    const requiredDocs = ['driverLicense', 'vehicleRegistration'];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
        return false;
      }
    }

    for (const doc of requiredDocs) {
      if (!documents[doc]) {
        Alert.alert('Lỗi', 'Vui lòng tải lên đầy đủ giấy tờ bắt buộc');
        return false;
      }
    }

    // Validate license plate format (basic)
    const licensePlateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/;
    if (!licensePlateRegex.test(formData.licensePlate)) {
      Alert.alert('Lỗi', 'Biển số xe không đúng định dạng (VD: 29A-12345)');
      return false;
    }

    return true;
  };

  const submitVerification = async () => {
    if (!validateForm()) return;

    setUploading(true);

    try {
      const submissionData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        submissionData.append(key, formData[key]);
      });

      // Add documents
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          submissionData.append(key, {
            uri: documents[key].uri,
            type: 'image/jpeg',
            name: `${key}.jpg`,
          });
        }
      });

      await authService.submitDriverVerification(submissionData);

      Alert.alert(
        'Gửi thành công!',
        'Hồ sơ tài xế đã được gửi để xác minh. Admin sẽ duyệt trong 2-3 ngày làm việc.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Driver verification error:', error);
      
      let errorMessage = 'Không thể gửi hồ sơ tài xế';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 409:
            errorMessage = 'Bạn đã gửi hồ sơ tài xế rồi';
            break;
          case 400:
            errorMessage = 'Thông tin hoặc giấy tờ không hợp lệ';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const DocumentUploadCard = ({ documentType, title, description, required = false }) => {
    const document = documents[documentType];
    
    return (
      <View style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>
            {title}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
          <Text style={styles.documentDescription}>{description}</Text>
        </View>
        
        {document ? (
          <View style={styles.selectedDocumentContainer}>
            <Image source={{ uri: document.uri }} style={styles.selectedDocument} />
            <TouchableOpacity 
              style={styles.changeDocumentButton}
              onPress={() => showDocumentPicker(documentType, title)}
            >
              <Icon name="edit" size={16} color="#4CAF50" />
              <Text style={styles.changeDocumentText}>Đổi ảnh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadDocumentButton}
            onPress={() => showDocumentPicker(documentType, title)}
          >
            <Icon name="cloud-upload" size={24} color="#666" />
            <Text style={styles.uploadDocumentText}>Tải lên ảnh</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#FF9800', '#F57C00']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Xác minh tài xế</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <Animatable.View animation="fadeInUp" style={styles.instructionsCard}>
            <Icon name="directions-car" size={48} color="#FF9800" />
            <Text style={styles.instructionsTitle}>Đăng ký làm tài xế</Text>
            <Text style={styles.instructionsText}>
              Để trở thành tài xế, bạn cần cung cấp thông tin xe và giấy tờ liên quan. 
              Tất cả thông tin sẽ được bảo mật và chỉ dùng để xác minh.
            </Text>
          </Animatable.View>

          {/* Personal Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin bằng lái</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="credit-card" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số bằng lái xe *"
                value={formData.licenseNumber}
                onChangeText={(value) => updateFormData('licenseNumber', value)}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin xe</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="build" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Hãng xe (Honda, Yamaha...) *"
                value={formData.vehicleBrand}
                onChangeText={(value) => updateFormData('vehicleBrand', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="motorcycle" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dòng xe (Wave, Exciter...) *"
                value={formData.vehicleModel}
                onChangeText={(value) => updateFormData('vehicleModel', value)}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Icon name="calendar-today" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Năm sản xuất *"
                  value={formData.vehicleYear}
                  onChangeText={(value) => updateFormData('vehicleYear', value)}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={[styles.inputContainer, styles.inputHalf]}>
                <Icon name="palette" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Màu xe *"
                  value={formData.vehicleColor}
                  onChangeText={(value) => updateFormData('vehicleColor', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="confirmation-number" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Biển số xe (29A-12345) *"
                value={formData.licensePlate}
                onChangeText={(value) => updateFormData('licensePlate', value.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Document Upload */}
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Giấy tờ xe</Text>
            
            <DocumentUploadCard
              documentType="driverLicense"
              title="Bằng lái xe"
              description="Ảnh 2 mặt bằng lái xe còn hiệu lực"
              required={true}
            />

            <DocumentUploadCard
              documentType="vehicleRegistration"
              title="Đăng ký xe"
              description="Giấy đăng ký xe (cavet xe)"
              required={true}
            />

            <DocumentUploadCard
              documentType="vehicleInsurance"
              title="Bảo hiểm xe"
              description="Giấy bảo hiểm xe (không bắt buộc)"
              required={false}
            />
          </View>

          {/* Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.cardTitle}>Yêu cầu</Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.requirementText}>Có bằng lái xe hạng A1 trở lên</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.requirementText}>Xe máy đời 2010 trở lên</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.requirementText}>Giấy tờ xe đầy đủ, hợp lệ</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.requirementText}>Tuân thủ quy định an toàn giao thông</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <ModernButton
            title={uploading ? "Đang gửi..." : "Gửi hồ sơ tài xế"}
            onPress={submitVerification}
            disabled={uploading}
            icon={uploading ? null : "send"}
            style={styles.submitButton}
          />

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#FF9800" />
              <Text style={styles.uploadingText}>Đang tải lên và xử lý hồ sơ...</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoCard}>
            <Icon name="info" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Hồ sơ tài xế sẽ được admin xem xét trong 2-3 ngày làm việc. 
              Sau khi được duyệt, bạn có thể chuyển sang chế độ tài xế để bắt đầu kiếm tiền.
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
  formSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1a1a1a',
  },
  requiredAsterisk: {
    color: '#F44336',
  },
  documentsSection: {
    marginBottom: 20,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
  },
  uploadDocumentButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadDocumentText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  selectedDocumentContainer: {
    alignItems: 'center',
  },
  selectedDocument: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  changeDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
  },
  changeDocumentText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
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
    color: '#FF9800',
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

export default DriverVerificationScreen;
