import apiService, { ApiError } from './api';
import { ENDPOINTS } from '../config/api';

class PaymentService {
  constructor() {
    this.apiService = apiService;
  }

  // Create PayOS top-up payment link
  async createTopUpPaymentLink(user_id, amount, description = 'Nạp tiền ví MSSUS') {
    try {
      const params = new URLSearchParams({
        userId: user_id.toString(),
        amount: amount.toString(),
        description: description
      });

      const response = await this.apiService.post(
        `${ENDPOINTS.PAYOS.CREATE_TOPUP_LINK}?${params}`
      );

      return {
        success: true,
        data: response,
        paymentUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        orderCode: response.orderCode,  
        amount: response.amount,
        status: response.status
      };
    } catch (error) {
      console.error('Create payment link error:', error);
      throw error;
    }
  }

  // Test PayOS payment (for development)
  async testPayment() {
    try {
      const response = await this.apiService.post(ENDPOINTS.PAYOS.TEST_PAYMENT);
      
      return {
        success: true,
        data: response,
        paymentUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        orderCode: response.orderCode,
        amount: response.amount
      };
    } catch (error) {
      console.error('Test payment error:', error);
      throw error;
    }
  }

  // Get wallet balance and transactions
  async getWalletInfo(user_id) {
    try {
      const response = await this.apiService.get(`${ENDPOINTS.WALLET.BALANCE}?userId=${user_id}`);
      console.log('response', response);
      return response;
    } catch (error) {
      console.error('Get wallet info error:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(user_id, page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        userId: user_id.toString(),
        page: page.toString(),
        size: size.toString()
      });

      const response = await this.apiService.get(
        `${ENDPOINTS.WALLET.TRANSACTIONS}?${params.toString()}`
      );
      
      return response;
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  }

  // Format currency for display
  formatCurrency(amount) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Validate payment amount
  validateAmount(amount) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Số tiền phải lớn hơn 0');
    }
    
    if (numAmount < 10000) {
      throw new Error('Số tiền nạp tối thiểu là 10,000 VNĐ');
    }
    
    if (numAmount > 50000000) {
      throw new Error('Số tiền nạp tối đa là 50,000,000 VNĐ');
    }
    
    return numAmount;
  }

  // Get payment status text
  getPaymentStatusText(status) {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ thanh toán';
      case 'PAID':
      case 'COMPLETED':
        return 'Thành công';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'FAILED':
        return 'Thất bại';
      default:
        return 'Không xác định';
    }
  }

  // Get payment status color
  getPaymentStatusColor(status) {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'PAID':
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
      case 'EXPIRED':
      case 'FAILED':
        return '#F44336';
      default:
        return '#666';
    }
  }

  // Format transaction type
  getTransactionTypeText(type) {
    switch (type) {
      case 'TOP_UP':
        return 'Nạp tiền';
      case 'WITHDRAW':
        return 'Rút tiền';
      case 'RIDE_PAYMENT':
        return 'Thanh toán chuyến đi';
      case 'RIDE_EARNING':
        return 'Thu nhập chuyến đi';
      case 'COMMISSION':
        return 'Hoa hồng';
      case 'REFUND':
        return 'Hoàn tiền';
      default:
        return type;
    }
  }

  // Get transaction icon
  getTransactionIcon(type, direction) {
    switch (type) {
      case 'TOP_UP':
        return 'add-circle';
      case 'WITHDRAW':
        return 'remove-circle';
      case 'RIDE_PAYMENT':
        return direction === 'OUTBOUND' ? 'payment' : 'monetization-on';
      case 'RIDE_EARNING':
        return 'trending-up';
      case 'COMMISSION':
        return 'percent';
      case 'REFUND':
        return 'undo';
      default:
        return 'account-balance-wallet';
    }
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();
export default paymentService;
