import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';

class PermissionService {
  constructor() {
    this.permissionStatus = {
      location: null,
      camera: null,
      mediaLibrary: null,
      contacts: null,
    };
  }

  // ========== LOCATION PERMISSIONS ==========

  async requestLocationPermission(showAlert = true) {
    try {
      console.log('🔐 Requesting location permission...');
      
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('Current location permission status:', currentStatus);

      if (currentStatus === 'granted') {
        this.permissionStatus.location = 'granted';
        return { granted: true, status: currentStatus };
      }

      if (currentStatus === 'denied' && showAlert) {
        const userWantsToEnable = await this.showPermissionAlert(
          'Quyền truy cập vị trí',
          'Ứng dụng cần truy cập vị trí để xác định điểm đón và điểm đến của bạn. Bạn có muốn cấp quyền không?',
          'Cài đặt'
        );

        if (!userWantsToEnable) {
          return { granted: false, status: 'denied' };
        }

        // Open settings if user wants to enable
        await Linking.openSettings();
        return { granted: false, status: 'denied', openedSettings: true };
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission request result:', status);

      this.permissionStatus.location = status;

      if (status !== 'granted' && showAlert) {
        Alert.alert(
          'Quyền truy cập vị trí bị từ chối',
          'Để sử dụng tính năng định vị, vui lòng vào Cài đặt > MSSUS > Vị trí và cho phép truy cập.',
          [
            { text: 'Bỏ qua', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return { granted: status === 'granted', status };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false, status: 'error', error };
    }
  }

  async requestBackgroundLocationPermission(showAlert = true) {
    try {
      console.log('🔐 Requesting background location permission...');

      // First ensure foreground permission
      const foregroundResult = await this.requestLocationPermission(false);
      if (!foregroundResult.granted) {
        return foregroundResult;
      }

      // Check current background permission status
      const { status: currentStatus } = await Location.getBackgroundPermissionsAsync();
      console.log('Current background location permission status:', currentStatus);

      if (currentStatus === 'granted') {
        return { granted: true, status: currentStatus };
      }

      if (currentStatus === 'denied' && showAlert) {
        const userWantsToEnable = await this.showPermissionAlert(
          'Quyền truy cập vị trí nền',
          'Để theo dõi chuyến đi khi ứng dụng chạy nền, chúng tôi cần quyền truy cập vị trí nền. Bạn có muốn cấp quyền không?',
          'Cài đặt'
        );

        if (!userWantsToEnable) {
          return { granted: false, status: 'denied' };
        }

        await Linking.openSettings();
        return { granted: false, status: 'denied', openedSettings: true };
      }

      // Request background permission
      const { status } = await Location.requestBackgroundPermissionsAsync();
      console.log('Background location permission request result:', status);

      if (status !== 'granted' && showAlert) {
        Alert.alert(
          'Quyền truy cập vị trí nền bị từ chối',
          'Để theo dõi chuyến đi khi ứng dụng chạy nền, vui lòng vào Cài đặt > MSSUS > Vị trí và chọn "Luôn luôn".',
          [
            { text: 'Bỏ qua', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return { granted: status === 'granted', status };
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      return { granted: false, status: 'error', error };
    }
  }

  // ========== CAMERA PERMISSIONS ==========

  async requestCameraPermission(showAlert = true) {
    try {
      console.log('🔐 Requesting camera permission...');

      const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();
      console.log('Current camera permission status:', currentStatus);

      if (currentStatus === 'granted') {
        this.permissionStatus.camera = 'granted';
        return { granted: true, status: currentStatus };
      }

      if (currentStatus === 'denied' && showAlert) {
        const userWantsToEnable = await this.showPermissionAlert(
          'Quyền truy cập camera',
          'Ứng dụng cần truy cập camera để chụp ảnh tài liệu xác minh. Bạn có muốn cấp quyền không?',
          'Cài đặt'
        );

        if (!userWantsToEnable) {
          return { granted: false, status: 'denied' };
        }

        await Linking.openSettings();
        return { granted: false, status: 'denied', openedSettings: true };
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission request result:', status);

      this.permissionStatus.camera = status;

      if (status !== 'granted' && showAlert) {
        Alert.alert(
          'Quyền truy cập camera bị từ chối',
          'Để chụp ảnh tài liệu, vui lòng vào Cài đặt > MSSUS > Camera và cho phép truy cập.',
          [
            { text: 'Bỏ qua', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return { granted: status === 'granted', status };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { granted: false, status: 'error', error };
    }
  }

  // ========== MEDIA LIBRARY PERMISSIONS ==========

  async requestMediaLibraryPermission(showAlert = true) {
    try {
      console.log('🔐 Requesting media library permission...');

      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('Current media library permission status:', currentStatus);

      if (currentStatus === 'granted') {
        this.permissionStatus.mediaLibrary = 'granted';
        return { granted: true, status: currentStatus };
      }

      if (currentStatus === 'denied' && showAlert) {
        const userWantsToEnable = await this.showPermissionAlert(
          'Quyền truy cập thư viện ảnh',
          'Ứng dụng cần truy cập thư viện ảnh để chọn hình ảnh tài liệu xác minh. Bạn có muốn cấp quyền không?',
          'Cài đặt'
        );

        if (!userWantsToEnable) {
          return { granted: false, status: 'denied' };
        }

        await Linking.openSettings();
        return { granted: false, status: 'denied', openedSettings: true };
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission request result:', status);

      this.permissionStatus.mediaLibrary = status;

      if (status !== 'granted' && showAlert) {
        Alert.alert(
          'Quyền truy cập thư viện ảnh bị từ chối',
          'Để chọn ảnh từ thư viện, vui lòng vào Cài đặt > MSSUS > Ảnh và cho phép truy cập.',
          [
            { text: 'Bỏ qua', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return { granted: status === 'granted', status };
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return { granted: false, status: 'error', error };
    }
  }

  // ========== CONTACTS PERMISSIONS ==========

  async requestContactsPermission(showAlert = true) {
    try {
      console.log('🔐 Requesting contacts permission...');

      const { status: currentStatus } = await Contacts.getPermissionsAsync();
      console.log('Current contacts permission status:', currentStatus);

      if (currentStatus === 'granted') {
        this.permissionStatus.contacts = 'granted';
        return { granted: true, status: currentStatus };
      }

      if (currentStatus === 'denied' && showAlert) {
        const userWantsToEnable = await this.showPermissionAlert(
          'Quyền truy cập danh bạ',
          'Ứng dụng cần truy cập danh bạ để tìm liên hệ khẩn cấp. Bạn có muốn cấp quyền không?',
          'Cài đặt'
        );

        if (!userWantsToEnable) {
          return { granted: false, status: 'denied' };
        }

        await Linking.openSettings();
        return { granted: false, status: 'denied', openedSettings: true };
      }

      const { status } = await Contacts.requestPermissionsAsync();
      console.log('Contacts permission request result:', status);

      this.permissionStatus.contacts = status;

      if (status !== 'granted' && showAlert) {
        Alert.alert(
          'Quyền truy cập danh bạ bị từ chối',
          'Để truy cập danh bạ, vui lòng vào Cài đặt > MSSUS > Danh bạ và cho phép truy cập.',
          [
            { text: 'Bỏ qua', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return { granted: status === 'granted', status };
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return { granted: false, status: 'error', error };
    }
  }

  // ========== UTILITY METHODS ==========

  showPermissionAlert(title, message, confirmText = 'Đồng ý') {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: 'Bỏ qua', style: 'cancel', onPress: () => resolve(false) },
          { text: confirmText, onPress: () => resolve(true) }
        ]
      );
    });
  }

  async checkAllPermissions() {
    try {
      const results = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
        Contacts.getPermissionsAsync(),
      ]);

      return {
        location: results[0].status,
        camera: results[1].status,
        mediaLibrary: results[2].status,
        contacts: results[3].status,
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return null;
    }
  }

  async requestAllPermissions() {
    console.log('🔐 Requesting all permissions...');
    
    const results = {
      location: await this.requestLocationPermission(true),
      camera: await this.requestCameraPermission(true),
      mediaLibrary: await this.requestMediaLibraryPermission(true),
      contacts: await this.requestContactsPermission(true),
    };

    console.log('All permissions request results:', results);
    return results;
  }

  getPermissionStatus() {
    return { ...this.permissionStatus };
  }
}

export default new PermissionService();
