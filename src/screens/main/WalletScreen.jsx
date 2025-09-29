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

  const quickTopUpAmounts = [50000, 100000, 200000, 500000, 1000000];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser?.user?.user_id) {
        Alert.alert('Lỗi', 'Không thể xác định thông tin người dùng');
        return;
      }

      setUser(currentUser);
      
      // Load wallet info from user profile (cached data)
      if (currentUser.wallet) {
        setWalletData(currentUser.wallet);
      }

      // Load transaction history
      await loadTransactions(currentUser.user.user_id);
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (user_id, showLoading = false) => {
    if (showLoading) setLoadingTransactions(true);
    
    try {
      const response = await paymentService.getTransactionHistory(user_id, 0, 10);
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
                  {paymentService.formatCurrency(walletData?.cachedBalance || walletData?.cached_balance || 0)}
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
                onPress={() => Alert.alert('Thông báo', 'Chức năng rút tiền đang phát triển')}
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
                  {paymentService.formatCurrency(walletData?.totalToppedUp || walletData?.total_topped_up || 0)}
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
});

export default WalletScreen;