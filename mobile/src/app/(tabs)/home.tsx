import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/auth';

interface Appointment {
  _id: string;
  treatment: string;
  dentist: {
    _id: string;
    fullName: string;
  };
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'reschedule' | 'cancel' | 'billing' | 'general';
  read: boolean;
  createdAt: string;
}

interface PatientProfile {
  name: string;
  email: string;
  phoneNumber: string;
  nic: string;
  dob: string;
  gender: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Menu items based on your image
  const menuItems = [
    { name: 'Treatment\nPlan', icon: 'document-text-outline' },
    { name: 'Prescrptions', icon: 'document-outline' },
    { name: 'X-rays & Docs', icon: 'folder-open-outline' },
    { name: 'Payments', icon: 'card-outline' },
  ];

  const fetchDashboardData = async (showLoadingIndicator = true) => {
    if (!token) return;
    try {
      if (showLoadingIndicator) setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const [profileRes, appointmentsRes, notificationsRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/profile`, { headers }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/appointments`, { headers }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/notifications`, { headers })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData(true);
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchDashboardData(false);
      }
    }, [token])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/notifications/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const upcomingAppointments = appointments.filter(
    (app) => ['Pending', 'Confirmed', 'In Progress', 'Upcoming'].includes(app.status)
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#EFF6FF', text: '#2563eb' };
      case 'Completed':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default: // Pending / In Progress / Upcoming
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar-outline';
      case 'reschedule': return 'sync-outline';
      case 'cancel': return 'close-circle-outline';
      case 'billing': return 'card-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'booking': return '#2563eb';
      case 'reschedule': return '#3B82F6';
      case 'cancel': return '#EF4444';
      case 'billing': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const patientName = profile?.name || user?.name || 'Valued Patient';
  const initial = patientName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hi, Welcome Back!</Text>
              <Text style={styles.name}>{patientName}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => setIsNotificationsOpen(true)} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 4-Icon Grid */}
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                if (item.name === 'Payments') {
                  router.push('/payments' as any);
                } else {
                  Alert.alert('Info', `${item.name.replace('\n', ' ')} feature is available in the Web Portal.`);
                }
              }}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={28} color="#0EA5E9" />
              </View>
              <Text style={[styles.menuText, { textAlign: 'center' }]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Early protection for your dental health</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Learn more</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://img.freepik.com/free-photo/friendly-female-dentist-looking-camera_23-2148750170.jpg' }} 
            style={styles.bannerImage} 
          />
        </View>

        {/* Upcoming Appointments */}
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color="#2563eb" style={styles.loader} />
        ) : (
          <View style={styles.appointmentsContainer}>
            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyAppointments}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyAppointmentsText}>No upcoming appointments</Text>
                <TouchableOpacity 
                  style={styles.bookNowButton} 
                  onPress={() => router.push('/(tabs)/appointments' as any)}
                >
                  <Text style={styles.bookNowButtonText}>Book Appointment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingAppointments.map((item) => {
                const colors = getStatusColor(item.status);
                const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <View key={item._id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTreatment}>{item.treatment}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.appointmentDivider} />
                    
                    <View style={styles.appointmentBody}>
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={14} color="#64748B" style={styles.infoIcon} />
                        <Text style={styles.infoText}>Dr. {item.dentist?.fullName || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" style={styles.infoIcon} />
                        <Text style={styles.infoText}>{formattedDate} at {item.time}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Notifications Drawer Modal */}
      <Modal
        visible={isNotificationsOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setIsNotificationsOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {notifications.length > 0 && unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllReadBtn} onPress={handleMarkAllAsRead}>
                <Ionicons name="checkmark-done" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={styles.markAllReadText}>Mark all as read</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                </View>
              }
              renderItem={({ item }) => {
                const iconName = getNotificationIcon(item.type);
                const iconColor = getNotificationIconColor(item.type);
                const formattedTime = formatNotificationTime(item.createdAt);

                return (
                  <View style={[styles.notificationCard, !item.read && styles.unreadNotificationCard]}>
                    <View style={[styles.notificationIconContainer, { backgroundColor: iconColor + '15' }]}>
                      <Ionicons name={iconName as any} size={20} color={iconColor} />
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <View style={styles.notificationCardHeader}>
                        <Text style={styles.notificationCardTitle}>{item.title}</Text>
                        {!item.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationCardMsg}>{item.message}</Text>
                      <Text style={styles.notificationCardTime}>{formattedTime}</Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 20,
    fontWeight: '800',
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  name: { fontSize: 18, fontWeight: 'bold' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  menuItem: { alignItems: 'center', width: '22%' },
  iconBox: { width: 60, height: 60, backgroundColor: '#F0F9FF', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  banner: { backgroundColor: '#F3F4F6', borderRadius: 20, flexDirection: 'row', padding: 20, alignItems: 'center', marginBottom: 30 },
  bannerTextContainer: { flex: 1, paddingRight: 10 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#0EA5E9' },
  bannerButton: { backgroundColor: '#0EA5E9', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  bannerButtonText: { color: '#FFF', fontWeight: '600' },
  bannerImage: { width: 100, height: 100, borderRadius: 50 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  loader: {
    marginVertical: 40,
  },
  appointmentsContainer: {
    marginTop: 15,
    marginBottom: 30,
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentTreatment: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appointmentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  appointmentBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  emptyAppointments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyAppointmentsText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bookNowButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadNotificationCard: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
  notificationCardMsg: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationCardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
  },
});