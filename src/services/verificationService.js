import apiService, { ApiError } from './api';
import { ENDPOINTS } from '../config/api';

class VerificationService {
  constructor() {
    this.apiService = apiService;
  }

  // ========== USER VERIFICATION ENDPOINTS ==========

  // Submit student verification
  async submitStudentVerification(documentFile) {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentFile.uri,
        type: documentFile.mimeType || 'image/jpeg',
        name: documentFile.fileName || 'student_id.jpg',
      });

      const response = await this.apiService.uploadFile(
        ENDPOINTS.VERIFICATION.STUDENT, 
        null, 
        formData
      );

      return {
        success: true,
        data: response,
        message: 'Đã gửi yêu cầu xác minh sinh viên thành công'
      };
    } catch (error) {
      console.error('Submit student verification error:', error);
      throw this.handleVerificationError(error, 'Không thể gửi yêu cầu xác minh sinh viên');
    }
  }

  // Submit driver verification
  async submitDriverVerification(verificationData) {
    try {
      const response = await this.apiService.uploadFile(
        ENDPOINTS.VERIFICATION.DRIVER, 
        null, 
        verificationData
      );

      return {
        success: true,
        data: response,
        message: response.message || 'Đã gửi yêu cầu xác minh tài xế thành công'
      };
    } catch (error) {
      console.error('Driver verification error:', error);
      
      let errorMessage = 'Không thể gửi yêu cầu xác minh tài xế';
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error types
      if (error.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin và tài liệu.';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.status === 403) {
        errorMessage = 'Không có quyền truy cập. Vui lòng liên hệ admin.';
      } else if (error.status === 404) {
        errorMessage = 'API endpoint không tồn tại. Vui lòng liên hệ admin.';
      } else if (error.status === 413) {
        errorMessage = 'File tải lên quá lớn. Vui lòng chọn file nhỏ hơn 5MB.';
      } else if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      }
      
      throw new Error(errorMessage);
    }
  }

  // ========== ADMIN VERIFICATION ENDPOINTS ==========

  // Get pending student verifications (Admin only)
  async getPendingStudentVerifications(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir
      });

      const response = await this.apiService.get(
        `${ENDPOINTS.VERIFICATION_ADMIN.STUDENTS_PENDING}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Get pending student verifications error:', error);
      throw error;
    }
  }

  // Get student verification details (Admin only)
  async getStudentVerificationById(id) {
    try {
      const response = await this.apiService.get(
        `${ENDPOINTS.VERIFICATION_ADMIN.STUDENT_DETAILS}/${id}`
      );
      return response;
    } catch (error) {
      console.error('Get student verification details error:', error);
      throw error;
    }
  }

  // Approve student verification (Admin only)
  async approveStudentVerification(id, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.STUDENT_APPROVE.replace('{id}', id),
        { notes }
      );
      return response;
    } catch (error) {
      console.error('Approve student verification error:', error);
      throw error;
    }
  }

  // Reject student verification (Admin only)
  async rejectStudentVerification(id, rejectionReason, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.STUDENT_REJECT.replace('{id}', id),
        { rejectionReason, notes }
      );
      return response;
    } catch (error) {
      console.error('Reject student verification error:', error);
      throw error;
    }
  }

  // Get pending driver verifications (Admin only)
  async getPendingDriverVerifications(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir
      });

      const response = await this.apiService.get(
        `${ENDPOINTS.VERIFICATION_ADMIN.DRIVERS_PENDING}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Get pending driver verifications error:', error);
      throw error;
    }
  }

  // Get driver KYC details (Admin only)
  async getDriverKycById(id) {
    try {
      const response = await this.apiService.get(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_KYC.replace('{id}', id)
      );
      return response;
    } catch (error) {
      console.error('Get driver KYC details error:', error);
      throw error;
    }
  }

  // Approve driver documents (Admin only)
  async approveDriverDocuments(id, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_APPROVE_DOCS.replace('{id}', id),
        { notes }
      );
      return response;
    } catch (error) {
      console.error('Approve driver documents error:', error);
      throw error;
    }
  }

  // Approve driver license (Admin only)
  async approveDriverLicense(id, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_APPROVE_LICENSE.replace('{id}', id),
        { notes }
      );
      return response;
    } catch (error) {
      console.error('Approve driver license error:', error);
      throw error;
    }
  }

  // Approve driver vehicle (Admin only)
  async approveDriverVehicle(id, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_APPROVE_VEHICLE.replace('{id}', id),
        { notes }
      );
      return response;
    } catch (error) {
      console.error('Approve driver vehicle error:', error);
      throw error;
    }
  }

  // Reject driver verification (Admin only)
  async rejectDriverVerification(id, rejectionReason, notes = '') {
    try {
      const response = await this.apiService.post(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_REJECT.replace('{id}', id),
        { rejectionReason, notes }
      );
      return response;
    } catch (error) {
      console.error('Reject driver verification error:', error);
      throw error;
    }
  }

  // Update background check (Admin only)
  async updateBackgroundCheck(id, result, details = '', conductedBy = '') {
    try {
      const response = await this.apiService.put(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_BACKGROUND_CHECK.replace('{id}', id),
        { result, details, conductedBy }
      );
      return response;
    } catch (error) {
      console.error('Update background check error:', error);
      throw error;
    }
  }

  // Get driver verification statistics (Admin only)
  async getDriverVerificationStats() {
    try {
      const response = await this.apiService.get(
        ENDPOINTS.VERIFICATION_ADMIN.DRIVER_STATS
      );
      return response;
    } catch (error) {
      console.error('Get driver verification stats error:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  // Get verification status text in Vietnamese
  getVerificationStatusText(status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Đang chờ xét duyệt';
      case 'approved':
        return 'Đã được duyệt';
      case 'rejected':
        return 'Bị từ chối';
      case 'submitted':
        return 'Đã nộp hồ sơ';
      case 'in_review':
        return 'Đang xem xét';
      case 'completed':
        return 'Hoàn thành';
      default:
        return 'Chưa xác định';
    }
  }

  // Get verification status color
  getVerificationStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'submitted':
      case 'in_review':
        return '#FF9800';
      case 'approved':
      case 'completed':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#666';
    }
  }

  // Get verification type text
  getVerificationTypeText(type) {
    switch (type?.toLowerCase()) {
      case 'student_id':
        return 'Thẻ sinh viên';
      case 'driver_license':
        return 'Bằng lái xe';
      case 'vehicle_registration':
        return 'Đăng ký xe';
      case 'identity_card':
        return 'CCCD/CMND';
      default:
        return type || 'Không xác định';
    }
  }

  // Check if user can submit verification
  canSubmitVerification(currentStatus) {
    const allowedStatuses = ['', null, undefined, 'rejected'];
    return allowedStatuses.includes(currentStatus?.toLowerCase());
  }

  // Validate document file
  validateDocumentFile(file) {
    if (!file) {
      throw new Error('Vui lòng chọn tài liệu để tải lên');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.fileSize && file.fileSize > maxSize) {
      throw new Error('Kích thước file không được vượt quá 10MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (file.mimeType && !allowedTypes.includes(file.mimeType.toLowerCase())) {
      throw new Error('Chỉ chấp nhận file JPG, PNG hoặc PDF');
    }

    return true;
  }

  // Handle verification errors
  handleVerificationError(error, defaultMessage) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return new Error(error.message || 'Thông tin không hợp lệ');
        case 401:
          return new Error('Vui lòng đăng nhập lại');
        case 403:
          return new Error('Bạn không có quyền thực hiện thao tác này');
        case 409:
          return new Error('Bạn đã gửi yêu cầu xác minh trước đó');
        case 413:
          return new Error('File tải lên quá lớn');
        case 415:
          return new Error('Định dạng file không được hỗ trợ');
        case 0:
          return new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        default:
          return new Error(error.message || defaultMessage);
      }
    }
    return new Error(defaultMessage);
  }

  // Format verification data for display
  formatVerificationData(verification) {
    if (!verification) return null;

    return {
      ...verification,
      statusText: this.getVerificationStatusText(verification.status),
      statusColor: this.getVerificationStatusColor(verification.status),
      typeText: this.getVerificationTypeText(verification.type),
      createdAtFormatted: this.formatDate(verification.createdAt || verification.created_at),
      verifiedAtFormatted: verification.verifiedAt || verification.verified_at 
        ? this.formatDate(verification.verifiedAt || verification.verified_at)
        : null,
    };
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Create and export singleton instance
const verificationService = new VerificationService();
export default verificationService;
