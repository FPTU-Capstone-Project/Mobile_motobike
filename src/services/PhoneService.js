import { Linking, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';

class PhoneService {
  constructor() {
    this.contacts = [];
    this.hasContactsPermission = false;
  }

  // Yêu cầu quyền truy cập danh bạ
  async requestContactsPermission() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      this.hasContactsPermission = status === 'granted';
      
      if (!this.hasContactsPermission) {
        throw new Error('Quyền truy cập danh bạ bị từ chối');
      }

      return true;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      throw error;
    }
  }

  // Gọi điện thoại trực tiếp
  async makePhoneCall(phoneNumber, contactName = null) {
    try {
      if (!phoneNumber) {
        throw new Error('Số điện thoại không hợp lệ');
      }

      // Làm sạch số điện thoại (xóa khoảng trắng, dấu gạch ngang, v.v.)
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

      // Hiển thị dialog xác nhận
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Xác nhận cuộc gọi',
          `Bạn có muốn gọi ${contactName || 'số điện thoại'} (${cleanNumber})?`,
          [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Gọi',
              onPress: async () => {
                try {
                  const phoneUrl = `tel:${cleanNumber}`;
                  const supported = await Linking.canOpenURL(phoneUrl);
                  
                  if (supported) {
                    await Linking.openURL(phoneUrl);
                    resolve(true);
                  } else {
                    throw new Error('Thiết bị không hỗ trợ gọi điện');
                  }
                } catch (error) {
                  reject(error);
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error making phone call:', error);
      throw error;
    }
  }

  // Gọi điện khẩn cấp (không cần xác nhận)
  async makeEmergencyCall(phoneNumber) {
    try {
      if (!phoneNumber) {
        throw new Error('Số điện thoại khẩn cấp không hợp lệ');
      }

      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      const phoneUrl = `tel:${cleanNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
        return true;
      } else {
        throw new Error('Thiết bị không hỗ trợ gọi điện');
      }
    } catch (error) {
      console.error('Error making emergency call:', error);
      throw error;
    }
  }

  // Lấy danh sách liên hệ từ điện thoại
  async getContacts(searchQuery = '') {
    try {
      const hasPermission = this.hasContactsPermission || await this.requestContactsPermission();
      
      if (!hasPermission) {
        throw new Error('Không có quyền truy cập danh bạ');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image
        ],
        sort: Contacts.SortTypes.LastName,
      });

      // Lọc và format contacts
      let filteredContacts = data
        .filter(contact => {
          // Chỉ lấy contacts có số điện thoại
          return contact.phoneNumbers && contact.phoneNumbers.length > 0;
        })
        .map(contact => ({
          id: contact.id,
          name: contact.name || 'Không có tên',
          phoneNumbers: contact.phoneNumbers.map(phone => ({
            number: phone.number,
            label: phone.label || 'Mobile'
          })),
          image: contact.image
        }));

      // Tìm kiếm nếu có query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredContacts = filteredContacts.filter(contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumbers.some(phone => 
            phone.number.includes(query)
          )
        );
      }

      this.contacts = filteredContacts;
      return filteredContacts;
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  // Tìm contact theo số điện thoại
  async findContactByPhoneNumber(phoneNumber) {
    try {
      if (!this.contacts.length) {
        await this.getContacts();
      }

      const cleanSearchNumber = phoneNumber.replace(/[^\d]/g, '');

      const contact = this.contacts.find(contact =>
        contact.phoneNumbers.some(phone => {
          const cleanPhoneNumber = phone.number.replace(/[^\d]/g, '');
          return cleanPhoneNumber.includes(cleanSearchNumber) || 
                 cleanSearchNumber.includes(cleanPhoneNumber);
        })
      );

      return contact || null;
    } catch (error) {
      console.error('Error finding contact:', error);
      return null;
    }
  }

  // Gửi SMS
  async sendSMS(phoneNumber, message, contactName = null) {
    try {
      if (!phoneNumber) {
        throw new Error('Số điện thoại không hợp lệ');
      }

      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      const smsUrl = `sms:${cleanNumber}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
      
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Gửi tin nhắn',
          `Gửi tin nhắn đến ${contactName || 'số điện thoại'} (${cleanNumber})?`,
          [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Gửi',
              onPress: async () => {
                try {
                  const supported = await Linking.canOpenURL(smsUrl);
                  
                  if (supported) {
                    await Linking.openURL(smsUrl);
                    resolve(true);
                  } else {
                    throw new Error('Thiết bị không hỗ trợ gửi tin nhắn');
                  }
                } catch (error) {
                  reject(error);
                }
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Format số điện thoại đẹp
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Xóa tất cả ký tự không phải số
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format cho số Việt Nam
    if (cleaned.startsWith('84')) {
      // +84 xxx xxx xxx
      const match = cleaned.match(/^84(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `+84 ${match[1]} ${match[2]} ${match[3]}`;
      }
    } else if (cleaned.startsWith('0')) {
      // 0xxx xxx xxx
      const match = cleaned.match(/^0(\d{3})(\d{3})(\d{3})$/);
      if (match) {
        return `0${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    
    // Fallback: thêm khoảng cách mỗi 3 số
    return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
  }

  // Validate số điện thoại Việt Nam
  isValidVietnamesePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Số di động VN: 09x, 08x, 07x, 05x, 03x (10 số)
    // Hoặc +84 9x, +84 8x, +84 7x, +84 5x, +84 3x (11 số với 84)
    const mobileRegex = /^(0[3579]\d{8}|84[3579]\d{8})$/;
    
    return mobileRegex.test(cleaned);
  }

  // Lấy thông tin chi tiết contact
  async getContactDetails(contactId) {
    try {
      const hasPermission = this.hasContactsPermission || await this.requestContactsPermission();
      
      if (!hasPermission) {
        throw new Error('Không có quyền truy cập danh bạ');
      }

      const contact = await Contacts.getContactByIdAsync(contactId, {
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Image,
          Contacts.Fields.Birthday,
          Contacts.Fields.Addresses
        ]
      });

      return contact;
    } catch (error) {
      console.error('Error getting contact details:', error);
      throw error;
    }
  }
}

export default new PhoneService();
