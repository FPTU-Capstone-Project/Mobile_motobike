import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * Utility class for testing image picker functionality
 * Helps debug camera and gallery access on real devices
 */
export class ImagePickerTest {
  
  /**
   * Test camera permissions and functionality
   */
  static async testCamera() {
    console.log('🧪 Testing Camera Functionality...');
    
    try {
      // Check camera permission
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      console.log('📷 Camera Permission Status:', cameraPermission.status);
      
      if (cameraPermission.status !== 'granted') {
        console.log('📷 Requesting Camera Permission...');
        const requestResult = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📷 Camera Permission Request Result:', requestResult.status);
        
        if (requestResult.status !== 'granted') {
          Alert.alert(
            'Camera Test Failed',
            'Camera permission denied. Please enable camera access in device settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      
      // Test camera functionality
      console.log('📷 Launching Camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        mediaTypes: ['images'],
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📷 Camera Test Success:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        
        Alert.alert(
          'Camera Test Success! ✅',
          `Image captured successfully!\nSize: ${Math.round(asset.fileSize / 1024)}KB\nDimensions: ${asset.width}x${asset.height}`,
          [{ text: 'OK' }]
        );
        
        return asset;
      } else {
        console.log('📷 Camera Test Cancelled');
        return null;
      }
      
    } catch (error) {
      console.error('📷 Camera Test Error:', error);
      Alert.alert(
        'Camera Test Failed ❌',
        `Error: ${error.message}\n\nThis might happen on emulator. Try on real device.`,
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  
  /**
   * Test gallery/media library permissions and functionality
   */
  static async testGallery() {
    console.log('🧪 Testing Gallery Functionality...');
    
    try {
      // Check media library permission
      const libraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('🖼️ Media Library Permission Status:', libraryPermission.status);
      
      if (libraryPermission.status !== 'granted') {
        console.log('🖼️ Requesting Media Library Permission...');
        const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('🖼️ Media Library Permission Request Result:', requestResult.status);
        
        if (requestResult.status !== 'granted') {
          Alert.alert(
            'Gallery Test Failed',
            'Media library permission denied. Please enable photo access in device settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      
      // Test gallery functionality
      console.log('🖼️ Launching Image Library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        mediaTypes: ['images'],
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('🖼️ Gallery Test Success:', {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        
        Alert.alert(
          'Gallery Test Success! ✅',
          `Image selected successfully!\nSize: ${Math.round(asset.fileSize / 1024)}KB\nDimensions: ${asset.width}x${asset.height}`,
          [{ text: 'OK' }]
        );
        
        return asset;
      } else {
        console.log('🖼️ Gallery Test Cancelled');
        return null;
      }
      
    } catch (error) {
      console.error('🖼️ Gallery Test Error:', error);
      Alert.alert(
        'Gallery Test Failed ❌',
        `Error: ${error.message}`,
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  
  /**
   * Run comprehensive image picker tests
   */
  static async runAllTests() {
    console.log('🧪 Starting Comprehensive Image Picker Tests...');
    
    Alert.alert(
      'Image Picker Test',
      'This will test camera and gallery functionality. Make sure you have images in your gallery for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test Camera', onPress: () => this.testCamera() },
        { text: 'Test Gallery', onPress: () => this.testGallery() },
        { text: 'Test Both', onPress: () => this.runBothTests() }
      ]
    );
  }
  
  /**
   * Run both camera and gallery tests sequentially
   */
  static async runBothTests() {
    console.log('🧪 Running Both Camera and Gallery Tests...');
    
    // Test Gallery first (less intrusive)
    const galleryResult = await this.testGallery();
    
    if (galleryResult) {
      // If gallery works, test camera
      setTimeout(() => {
        Alert.alert(
          'Gallery Test Completed',
          'Now testing camera functionality...',
          [{ text: 'Continue', onPress: () => this.testCamera() }]
        );
      }, 1000);
    }
  }
  
  /**
   * Get device and platform info for debugging
   */
  static getDeviceInfo() {
    const info = {
      platform: Platform.OS,
      version: Platform.Version,
      isEmulator: __DEV__ && Platform.OS === 'ios' ? 'Unknown' : 'Check device settings',
    };
    
    console.log('📱 Device Info:', info);
    return info;
  }
  
  /**
   * Test file validation (simulate what verificationService does)
   */
  static validateImageFile(asset) {
    console.log('🧪 Testing File Validation...');
    
    const errors = [];
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > maxSize) {
      errors.push(`File too large: ${Math.round(asset.fileSize / 1024 / 1024)}MB (max 10MB)`);
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (asset.mimeType && !allowedTypes.includes(asset.mimeType.toLowerCase())) {
      errors.push(`Invalid file type: ${asset.mimeType} (allowed: JPG, PNG)`);
    }
    
    // Check dimensions (reasonable limits)
    if (asset.width && asset.height) {
      if (asset.width < 200 || asset.height < 200) {
        errors.push(`Image too small: ${asset.width}x${asset.height} (min 200x200)`);
      }
      if (asset.width > 4000 || asset.height > 4000) {
        errors.push(`Image too large: ${asset.width}x${asset.height} (max 4000x4000)`);
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ File Validation Errors:', errors);
      Alert.alert(
        'File Validation Failed',
        errors.join('\n'),
        [{ text: 'OK' }]
      );
      return false;
    } else {
      console.log('✅ File Validation Passed');
      Alert.alert(
        'File Validation Passed ✅',
        'Image meets all requirements for upload.',
        [{ text: 'OK' }]
      );
      return true;
    }
  }
}

// Export individual functions for convenience
export const testCamera = ImagePickerTest.testCamera;
export const testGallery = ImagePickerTest.testGallery;
export const runImagePickerTests = ImagePickerTest.runAllTests;

export default ImagePickerTest;
