import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from './context/auth';

interface BillItem {
  name: string;
  cost: number;
}

interface Bill {
  _id: string;
  amount: number;
  treatment: string;
  status: 'Paid' | 'Unpaid' | 'Pending' | 'Partially Paid';
  paymentMethod?: 'Cash' | 'Card' | 'N/A';
  date: string;
  dentist?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  items?: BillItem[];
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  const fetchBills = async (showLoadingIndicator = true) => {
    if (!token) return;
    try {
      if (showLoadingIndicator) setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/billing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(true);
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills(false);
    setRefreshing(false);
  };

  const outstandingBalance = bills
    .filter(b => ['Unpaid', 'Pending', 'Partially Paid'].includes(b.status))
    .reduce((sum, b) => sum + b.amount, 0);

  const toggleExpand = (id: string) => {
    setExpandedBillId(expandedBillId === id ? null : id);
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'Paid':
        return { bg: '#E2FBE9', text: '#0E6228', border: '#B2F1C5' };
      case 'Unpaid':
        return { bg: '#FFEBEA', text: '#B91C1C', border: '#FCA5A5' };
      default:
        return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' };
    }
  };

  const renderBillItem = ({ item }: { item: Bill }) => {
    const isExpanded = expandedBillId === item._id;
    const colors = getStatusColor(item.status);
    const dateFormatted = new Date(item.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.cardContainer}>
        {/* Main Header (Pressable) */}
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleExpand(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
            </View>
            <Text style={styles.treatmentName}>{item.treatment}</Text>
            <Text style={styles.invoiceMeta}>Date: {dateFormatted} | Method: {item.paymentMethod || 'N/A'}</Text>
          </View>
          
          <View style={styles.cardHeaderRight}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>Rs. {item.amount.toLocaleString()}</Text>
            </View>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color="#64748B" 
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {/* Collapsible Details */}
        {isExpanded && (
          <View style={styles.detailsContainer}>
            {/* Treating Dentist Info */}
            {item.dentist && (
              <View style={styles.dentistSection}>
                <Text style={styles.sectionLabel}>Treating Dentist</Text>
                <View style={styles.dentistRow}>
                  <Image
                    source={{ uri: `https://ui-avatars.com/api/?name=${item.dentist.fullName}&background=0ea5e9&color=fff` }}
                    style={styles.dentistAvatar}
                  />
                  <View>
                    <Text style={styles.dentistName}>Dr. {item.dentist.fullName}</Text>
                    <Text style={styles.dentistContact}>{item.dentist.email} • {item.dentist.phoneNumber}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Itemized Services breakdown */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionLabel}>Itemized Breakdown</Text>
              <View style={styles.itemBox}>
                {item.items && item.items.length > 0 ? (
                  item.items.map((srv, idx) => (
                    <View key={idx} style={[styles.srvRow, idx === item.items!.length - 1 && styles.noBorder]}>
                      <Text style={styles.srvName}>{srv.name}</Text>
                      <Text style={styles.srvCost}>Rs. {srv.cost.toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <View style={[styles.srvRow, styles.noBorder]}>
                    <Text style={styles.srvName}>{item.treatment}</Text>
                    <Text style={styles.srvCost}>Rs. {item.amount.toLocaleString()}</Text>
                  </View>
                )}
                
                {/* Total Invoice amount row */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>Rs. {item.amount.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Invoices</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => item._id}
        renderItem={renderBillItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListHeaderComponent={
          <>
            {/* Outstanding Balance card */}
            <View style={styles.balanceCard}>
              <View>
                <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
                <Text style={styles.balanceValue}>Rs. {outstandingBalance.toLocaleString()}</Text>
              </View>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="card" size={24} color="#2563eb" />
              </View>
            </View>

            {/* List Header Label */}
            <Text style={styles.listHeaderLabel}>Billing History</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Billing Invoices</Text>
              <Text style={styles.emptySubtitle}>You do not have any invoices registered. All future invoice statements will be listed here.</Text>
            </View>
          )
        }
        ListFooterComponent={
          bills.length > 0 ? (
            <View style={styles.securityBox}>
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" style={{ marginBottom: 8 }} />
              <Text style={styles.securityTitle}>Secure Transactions</Text>
              <Text style={styles.securityDescription}>
                All clinic transactions are secured with standard encryption mechanisms. You can settle unpaid balances at the clinic reception or check out through the Web Portal.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    height: 56,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  balanceIconContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 14,
  },
  listHeaderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceMeta: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  dentistSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dentistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  dentistAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  dentistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dentistContact: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  itemsSection: {},
  itemBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  srvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  srvName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  srvCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 20,
  },
  securityBox: {
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  securityDescription: {
    fontSize: 12,
    color: '#0284C7',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 4,
  },
});
