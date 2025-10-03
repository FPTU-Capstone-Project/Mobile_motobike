import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

import ModernButton from '../../components/ModernButton.jsx';
import paymentService from '../../services/paymentService';
import authService from '../../services/authService';
import { ApiError } from '../../services/api';

const WalletScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    accountHolderName: ''
  });

  const quickTopUpAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      
      // Load fresh wallet data from API (new API uses authentication)
      const walletResponse = await paymentService.getWalletInfo();
      setWalletData(walletResponse);

      // Load transaction history (new API uses authentication)
      await loadTransactions();
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (showLoading = false) => {
    if (showLoading) setLoadingTransactions(true);
    
    try {
      // New API uses authentication, no user_id needed
      const response = await paymentService.getTransactionHistory(0, 10);
      if (response && response.content) {
        setTransactions(response.content);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Don't show error alert for transactions, just log it
    } finally {
      if (showLoading) setLoadingTransactions(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user profile to get latest wallet data
      await authService.getCurrentUserProfile();
      await loadWalletData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickTopUp = (amount) => {
    navigation.navigate('QRPayment', { amount, type: 'topup' });
  };

  const handleCustomTopUp = () => {
    const amount = parseInt(topUpAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      paymentService.validateAmount(amount);
      setShowTopUpModal(false);
      setTopUpAmount('');
      navigation.navigate('QRPayment', { amount, type: 'topup' });
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  };

  const handleWithdraw = async () => {
    const { amount, bankName, bankAccountNumber, accountHolderName } = withdrawData;
    
    // Validation
    if (!amount || !bankName || !bankAccountNumber || !accountHolderName) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const withdrawAmount = parseInt(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (withdrawAmount < 50000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50.000 VNĐ');
      return;
    }

    if (withdrawAmount > (walletData?.availableBalance || 0)) {
      Alert.alert('Lỗi', 'Số dư không đủ để thực hiện giao dịch');
      return;
    }

    // Validate bank account number
    if (!/^\d{9,16}$/.test(bankAccountNumber)) {
      Alert.alert('Lỗi', 'Số tài khoản ngân hàng không hợp lệ (9-16 chữ số)');
      return;
    }

    // Validate account holder name
    if (accountHolderName.length < 2) {
      Alert.alert('Lỗi', 'Tên chủ tài khoản phải có ít nhất 2 ký tự');
      return;
    }

    try {
      setLoading(true);
      const result = await paymentService.initiatePayout(
        withdrawAmount,
        bankName,
        bankAccountNumber,
        accountHolderName
      );

      if (result.success) {
        Alert.alert(
          'Thành công', 
          result.message || 'Đã gửi yêu cầu rút tiền. Giao dịch sẽ được xử lý trong 1-3 ngày làm việc.',
          [{ text: 'OK', onPress: () => {
            setShowWithdrawModal(false);
            setWithdrawData({
              amount: '',
              bankName: '',
              bankAccountNumber: '',
              accountHolderName: ''
            });
            loadWalletData(); // Refresh wallet data
          }}]
        );
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      let errorMessage = 'Không thể thực hiện giao dịch rút tiền';
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            errorMessage = 'Thông tin không hợp lệ';
            break;
          case 403:
            errorMessage = 'Chỉ tài xế mới có thể rút tiền';
            break;
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawInputChange = (field, value) => {
    setWithdrawData(prev => ({ ...prev, [field]: value }));
  };

  const getTransactionIcon = (type, direction) => {
    const icon = paymentService.getTransactionIcon(type, direction);
    let color = '#666';
    
    switch (type) {
      case 'TOP_UP':
        color = '#4CAF50';
        break;
      case 'WITHDRAW':
        color = '#FF9800';
        break;
      case 'RIDE_PAYMENT':
        color = direction === 'OUTBOUND' ? '#F44336' : '#4CAF50';
        break;
      case 'RIDE_EARNING':
        color = '#2196F3';
        break;
      case 'COMMISSION':
        color = '#9C27B0';
        break;
      case 'REFUND':
        color = '#00BCD4';
        break;
      default:
        color = '#666';
    }
    
    return { name: icon, color };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTransactionAmount = (amount, direction) => {
    const sign = direction === 'INBOUND' ? '+' : '-';
    return `${sign}${paymentService.formatCurrency(Math.abs(amount))}`;
  };

  const getTransactionAmountColor = (direction) => {
    return direction === 'INBOUND' ? '#4CAF50' : '#F44336';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải thông tin ví...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Ví của tôi</Text>
        </LinearGradient>

        {/* Balance Card */}
        <Animatable.View animation="fadeInUp" style={styles.balanceCard}>
          <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <Icon name="account-balance-wallet" size={32} color="#fff" />
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                <Text style={styles.balanceAmount}>
                  {paymentService.formatCurrency(walletData?.availableBalance)}
                </Text>
              </View>
            </View>
            
            {walletData?.pendingBalance > 0 && (
              <View style={styles.pendingBalance}>
                <Icon name="hourglass-empty" size={16} color="#FF9800" />
                <Text style={styles.pendingBalanceText}>
                  Đang chờ: {paymentService.formatCurrency(walletData.pendingBalance || walletData.pending_balance)}
                </Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowTopUpModal(true)}
              >
                <Icon name="add" size={20} color="#1a1a1a" />
                <Text style={styles.actionButtonText}>Nạp tiền</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowWithdrawModal(true)}
              >
                <Icon name="send" size={20} color="#1a1a1a" />
                <Text style={styles.actionButtonText}>Rút tiền</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Quick Top-up */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Nạp nhanh</Text>
          <View style={styles.quickAmountsList}>
            {quickTopUpAmounts.map((amount, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAmountItem}
                onPress={() => handleQuickTopUp(amount)}
              >
                <Text style={styles.quickAmountText}>
                  {paymentService.formatCurrency(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        {/* Wallet Stats */}
        {(walletData?.totalToppedUp > 0 || walletData?.totalSpent > 0) && (
          <Animatable.View animation="fadeInUp" delay={400} style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Thống kê</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="trending-up" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>
                  {paymentService.formatCurrency(walletData?.total_topped_up || 0)}
                </Text>
                <Text style={styles.statLabel}>Tổng nạp</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="trending-down" size={24} color="#F44336" />
                <Text style={styles.statValue}>
                  {paymentService.formatCurrency(walletData?.totalSpent || walletData?.total_spent || 0)}
                </Text>
                <Text style={styles.statLabel}>Tổng chi</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Transaction History */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
            {loadingTransactions && <ActivityIndicator size="small" color="#4CAF50" />}
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Icon name="receipt" size={48} color="#ccc" />
              <Text style={styles.emptyTransactionsText}>Chưa có giao dịch nào</Text>
            </View>
          ) : (
            <>
              {transactions.slice(0, 5).map((transaction) => {
                const icon = getTransactionIcon(transaction.type, transaction.direction);
                return (
                  <View key={transaction.txnId || transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: icon.color + '20' }]}>
                        <Icon name={icon.name} size={20} color={icon.color} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>
                          {paymentService.getTransactionTypeText(transaction.type)}
                        </Text>
                        <Text style={styles.transactionNote}>
                          {transaction.note || 'Giao dịch ví'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.createdAt || transaction.created_at || new Date())}
                        </Text>
                        <Text style={[
                          styles.transactionStatus,
                          { color: paymentService.getPaymentStatusColor(transaction.status) }
                        ]}>
                          {paymentService.getPaymentStatusText(transaction.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: getTransactionAmountColor(transaction.direction) }
                    ]}>
                      {formatTransactionAmount(transaction.amount, transaction.direction)}
                    </Text>
                  </View>
                );
              })}
              
              {transactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => Alert.alert('Thông báo', 'Chức năng xem tất cả giao dịch đang phát triển')}
                >
                  <Text style={styles.viewAllText}>Xem tất cả giao dịch</Text>
                  <Icon name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </>
          )}
        </Animatable.View>

        {/* Payment Methods */}
        <Animatable.View animation="fadeInUp" delay={800} style={styles.paymentMethodsCard}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          <TouchableOpacity style={styles.paymentMethodItem}>
            <View style={styles.paymentMethodLeft}>
              <Icon name="qr-code" size={24} color="#4CAF50" />
              <Text style={styles.paymentMethodText}>PayOS - Thanh toán QR</Text>
            </View>
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.paymentMethodBadgeText}>Khuyên dùng</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.paymentMethodItem}>
            <View style={styles.paymentMethodLeft}>
              <Icon name="account-balance" size={24} color="#666" />
              <Text style={styles.paymentMethodText}>Chuyển khoản ngân hàng</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.paymentMethodItem}>
            <View style={styles.paymentMethodLeft}>
              <Icon name="credit-card" size={24} color="#666" />
              <Text style={styles.paymentMethodText}>Thẻ tín dụng/ghi nợ</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

      {/* Top Up Modal */}
      <Modal
        visible={showTopUpModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nạp tiền vào ví</Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nhập số tiền</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.currencyText}>VNĐ</Text>
              </View>
              
              <Text style={styles.inputHelper}>
                Tối thiểu: 10,000 VNĐ - Tối đa: 50,000,000 VNĐ
              </Text>
              
              <View style={styles.modalQuickAmounts}>
                {quickTopUpAmounts.map((amount, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalQuickAmount}
                    onPress={() => setTopUpAmount(amount.toString())}
                  >
                    <Text style={styles.modalQuickAmountText}>
                      {paymentService.formatCurrency(amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <ModernButton
                title="Xác nhận nạp tiền"
                onPress={handleCustomTopUp}
                icon="payment"
                size="large"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền từ ví</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.withdrawModalBody} keyboardShouldPersistTaps="handled">
              {/* Available Balance Info */}
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceInfoLabel}>Số dư khả dụng</Text>
                <Text style={styles.balanceInfoAmount}>
                  {paymentService.formatCurrency(walletData?.availableBalance || 0)}
                </Text>
              </View>

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số tiền rút</Text>
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    value={withdrawData.amount}
                    onChangeText={(value) => handleWithdrawInputChange('amount', value)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencyText}>VNĐ</Text>
                </View>
                <Text style={styles.inputHelper}>
                  Tối thiểu: 50,000 VNĐ - Tối đa: {paymentService.formatCurrency(walletData?.availableBalance || 0)}
                </Text>
              </View>

              {/* Bank Information */}
              <Text style={styles.sectionTitle}>Thông tin ngân hàng</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên ngân hàng *</Text>
                <View style={styles.textInputContainer}>
                  <Icon name="account-balance" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="VD: Vietcombank, Techcombank, BIDV..."
                    value={withdrawData.bankName}
                    onChangeText={(value) => handleWithdrawInputChange('bankName', value)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số tài khoản *</Text>
                <View style={styles.textInputContainer}>
                  <Icon name="credit-card" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập số tài khoản (9-16 chữ số)"
                    value={withdrawData.bankAccountNumber}
                    onChangeText={(value) => handleWithdrawInputChange('bankAccountNumber', value)}
                    keyboardType="numeric"
                    maxLength={16}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên chủ tài khoản *</Text>
                <View style={styles.textInputContainer}>
                  <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="VD: NGUYEN VAN A"
                    value={withdrawData.accountHolderName}
                    onChangeText={(value) => handleWithdrawInputChange('accountHolderName', value.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={styles.inputHelper}>
                  Tên phải khớp với tên trên tài khoản ngân hàng
                </Text>
              </View>

              {/* Warning */}
              <View style={styles.warningBox}>
                <Icon name="warning" size={20} color="#FF9800" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
                  <Text style={styles.warningText}>
                    • Giao dịch rút tiền sẽ được xử lý trong 1-3 ngày làm việc{'\n'}
                    • Vui lòng kiểm tra kỹ thông tin ngân hàng trước khi xác nhận{'\n'}
                    • Chỉ tài xế mới có thể thực hiện rút tiền{'\n'}
                    • Phí rút tiền có thể được áp dụng
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <ModernButton
                title="Xác nhận rút tiền"
                onPress={handleWithdraw}
                icon="send"
                size="large"
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 25,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pendingBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingBalanceText: {
    color: '#FF9800',
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
    marginLeft: 5,
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
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
  quickAmountsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  viewAllText: {
    color: '#666',
    fontSize: 14,
    marginRight: 5,
  },
  paymentMethodsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  paymentMethodBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentMethodBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  currencyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  inputHelper: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  modalQuickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalQuickAmount: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalQuickAmountText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
  },
  
  // Withdraw Modal Styles
  withdrawModalBody: {
    maxHeight: '70%',
  },
  balanceInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceInfoAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  inputGroup: {
    marginBottom: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#1a1a1a',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
  },
});

export default WalletScreen;