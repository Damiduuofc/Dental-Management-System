import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const treatments = ['Regular Checkup', 'Root Canal', 'Consultation', 'Orthodontics', 'Teeth Cleaning', 'Teeth Whitening'];
const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'];

export default function AppointmentsScreen() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');

  // Booking states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const fetchAppointments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentists = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/dentists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDentists(data);
      }
    } catch (error) {
      console.error("Error fetching dentists:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
      fetchDentists();
    }
  }, [token]);

  const handleCancelAppointment = async (id: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/appointments/${id}/cancel`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (res.ok) {
                Alert.alert("Success", "Appointment cancelled successfully.");
                fetchAppointments();
              } else {
                const data = await res.json();
                Alert.alert("Error", data.message || "Failed to cancel appointment.");
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Network error cancelling appointment.");
            }
          } 
        }
      ]
    );
  };

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedTreatment || !date || !time) {
      Alert.alert("Validation Error", "Please select a dentist, treatment, date and time slot.");
      return;
    }

    try {
      const formattedDate = date.toISOString().split('T')[0];
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dentistId: selectedDentist,
          treatment: selectedTreatment,
          date: formattedDate,
          time,
          notes
        })
      });

      if (res.ok) {
        Alert.alert("Success", "Appointment booked successfully!");
        setIsBookingOpen(false);
        // Reset states
        setSelectedDentist('');
        setSelectedTreatment('');
        setDate(new Date());
        setTime('');
        setNotes('');
        fetchAppointments();
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Booking failed.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error booking appointment.");
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === 'Upcoming') {
      return app.status === 'Pending' || app.status === 'Confirmed' || app.status === 'In Progress';
    }
    return app.status === 'Completed' || app.status === 'Cancelled';
  });

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#E6F4F1', text: '#0D9488' };
      case 'Completed':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default: // Pending / In Progress
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const colors = getStatusColor(item.status);
    const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.treatmentText}>{item.treatment}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#64748B" style={styles.infoIcon} />
            <Text style={styles.infoText}>Dr. {item.dentist?.fullName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.infoIcon} />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
          {item.notes ? (
            <View style={[styles.infoRow, { alignItems: 'flex-start', marginTop: 4 }]}>
              <Ionicons name="document-text-outline" size={16} color="#64748B" style={[styles.infoIcon, { marginTop: 2 }]} />
              <Text style={[styles.infoText, { flex: 1, fontStyle: 'italic' }]}>{item.notes}</Text>
            </View>
          ) : null}
        </View>

        {item.status !== 'Cancelled' && item.status !== 'Completed' && (
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelAppointment(item._id)}>
              <Text style={styles.cancelText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Upcoming' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.tabTextActive]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Past' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Past')}
          >
            <Text style={[styles.tabText, activeTab === 'Past' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredAppointments}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0D9488"]}
                tintColor="#0D9488"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No appointments found</Text>
              </View>
            }
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={() => setIsBookingOpen(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Appointment Booking Modal */}
      <Modal visible={isBookingOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setIsBookingOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Doctor Select */}
              <Text style={styles.sectionLabel}>Select Doctor</Text>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.dentistList}>
                {dentists.map((d) => {
                  const isSelected = selectedDentist === d._id;
                  const initials = d.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <TouchableOpacity 
                      key={d._id} 
                      style={[styles.dentistCard, isSelected && styles.activeDentistCard]}
                      onPress={() => setSelectedDentist(d._id)}
                    >
                      <View style={[styles.avatar, isSelected && styles.activeAvatar]}>
                        <Text style={[styles.avatarText, isSelected && styles.activeAvatarText]}>{initials}</Text>
                      </View>
                      <Text style={[styles.dentistName, isSelected && styles.activeDentistName]}>Dr. {d.fullName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Treatment Select */}
              <Text style={styles.sectionLabel}>Select Treatment</Text>
              <View style={styles.treatmentRow}>
                {treatments.map((t) => {
                  const isSelected = selectedTreatment === t;
                  return (
                    <TouchableOpacity 
                      key={t} 
                      style={[styles.treatmentBtn, isSelected && styles.activeTreatmentBtn]}
                      onPress={() => setSelectedTreatment(t)}
                    >
                      <Text style={[styles.treatmentBtnText, isSelected && styles.activeTreatmentBtnText]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Selector */}
              <Text style={styles.sectionLabel}>Select Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.dateSelectorText}>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              {/* Time Selection */}
              <Text style={styles.sectionLabel}>Select Time Slot</Text>
              <View style={styles.timeRow}>
                {timeSlots.map((slot) => {
                  const isSelected = time === slot;
                  return (
                    <TouchableOpacity 
                      key={slot} 
                      style={[styles.timeBtn, isSelected && styles.activeTimeBtn]}
                      onPress={() => setTime(slot)}
                    >
                      <Text style={[styles.timeBtnText, isSelected && styles.activeTimeBtnText]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes (Optional)</Text>
              <TextInput 
                style={styles.notesInput} 
                multiline={true} 
                numberOfLines={3} 
                value={notes} 
                onChangeText={setNotes}
                placeholder="Any special requests or symptoms..."
                placeholderTextColor="#94A3B8"
              />

              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleBookAppointment}>
                <Text style={styles.submitBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treatmentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 10,
  },
  dentistList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dentistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 110,
  },
  activeDentistCard: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeAvatar: {
    backgroundColor: '#0D9488',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  activeAvatarText: {
    color: '#FFFFFF',
  },
  dentistName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  activeDentistName: {
    color: '#0D9488',
    fontWeight: '700',
  },
  treatmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  treatmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTreatmentBtn: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  treatmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activeTreatmentBtnText: {
    color: '#0D9488',
    fontWeight: '700',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTimeBtn: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activeTimeBtnText: {
    color: '#0D9488',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
