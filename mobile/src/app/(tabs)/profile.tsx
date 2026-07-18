import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/auth';
import { Ionicons } from '@expo/vector-icons';

interface PatientProfile {
  name: string;
  email: string;
  phoneNumber: string;
  nic: string;
  dob: string;
  gender: string;
  createdAt: string;
  homeAddress?: string;
  allergies?: string;
}

export default function ProfileScreen() {
  const { token, signOut } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNic, setEditNic] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError('');
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to retrieve profile data.');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const calculateAgeInYears = (dobString: string) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : "";
  };

  const handleSaveProfile = async () => {
    if (!editName || !editPhone || !editNic || !editDob || !editGender || !editAddress) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          phoneNumber: editPhone,
          nic: editNic,
          dob: editDob,
          gender: editGender,
          homeAddress: editAddress,
          allergies: editAllergies,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update profile.');
      }

      const data = await response.json();
      setProfile(data.patient);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || 'Could not update profile. Please try again.');
      Alert.alert("Error", err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'P'}</Text>
          </View>
          <Text style={styles.nameText}>{profile?.name || 'Patient User'}</Text>
          <Text style={styles.roleBadge}>Patient Member</Text>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => {
                setEditName(profile?.name || '');
                setEditPhone(profile?.phoneNumber || '');
                setEditNic(profile?.nic || '');
                setEditDob(profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : '');
                setEditGender(profile?.gender || '');
                setEditAddress(profile?.homeAddress || '');
                setEditAllergies(profile?.allergies || '');
                setIsEditing(true);
              }}
            >
              <Ionicons name="create-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Profile Information List */}
        <Text style={styles.sectionTitle}>{isEditing ? "Edit Personal Details" : "Personal Details"}</Text>
        <View style={styles.detailsList}>
          {!isEditing ? (
            <>
              {/* Email */}
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{profile?.email || 'N/A'}</Text>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{profile?.phoneNumber || 'N/A'}</Text>
                </View>
              </View>

              {/* NIC Number */}
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>National Identity Card (NIC)</Text>
                  <Text style={styles.detailValue}>{profile?.nic || 'N/A'}</Text>
                </View>
              </View>

              {/* DOB & Age */}
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.detailLabel}>Date of Birth</Text>
                    {profile?.dob && (
                      <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>{calculateAgeInYears(profile.dob)} Years</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.detailValue}>{profile?.dob ? formatDate(profile.dob) : 'N/A'}</Text>
                </View>
              </View>

              {/* Gender */}
              <View style={styles.detailRow}>
                <Ionicons name="transgender-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>{profile?.gender || 'N/A'}</Text>
                </View>
              </View>

              {/* Home Address */}
              <View style={styles.detailRow}>
                <Ionicons name="home-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Home Address</Text>
                  <Text style={styles.detailValue}>{profile?.homeAddress || 'N/A'}</Text>
                </View>
              </View>

              {/* Allergies */}
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="warning-outline" size={20} color="#64748B" style={styles.detailIcon} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Allergies</Text>
                  <Text style={[styles.detailValue, profile?.allergies ? styles.allergiesValueText : {}]}>
                    {profile?.allergies || 'None declared'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ paddingVertical: 8 }}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter full name"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={(text) => setEditPhone(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                />
              </View>

              {/* NIC */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NIC Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editNic}
                  onChangeText={setEditNic}
                  placeholder="Enter NIC number"
                />
              </View>

              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.inputLabel}>Date of Birth * (YYYY-MM-DD)</Text>
                  {editDob ? (
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageBadgeText}>{calculateAgeInYears(editDob)} Years</Text>
                    </View>
                  ) : null}
                </View>
                <TextInput
                  style={styles.textInput}
                  value={editDob}
                  onChangeText={setEditDob}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setEditGender(g)}
                      style={[
                        styles.genderOption,
                        editGender === g ? styles.genderOptionActive : {}
                      ]}
                    >
                      <Text style={[
                        styles.genderOptionText,
                        editGender === g ? styles.genderOptionTextActive : {}
                      ]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Home Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Home Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Enter home address"
                />
              </View>

              {/* Allergies */}
              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.inputLabel}>Allergies</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  multiline
                  value={editAllergies}
                  onChangeText={setEditAllergies}
                  placeholder="List drug or food allergies"
                />
              </View>
            </View>
          )}
        </View>

        {isEditing && (
          <View style={styles.editActionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => setIsEditing(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]} 
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Member since */}
        {!isEditing && profile?.createdAt ? (
          <Text style={styles.memberSinceText}>
            Joined DentCare on {formatDate(profile.createdAt)}
          </Text>
        ) : null}

        {/* Sign Out Button */}
        {!isEditing && (
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out Account</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 32,
    fontWeight: '800',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleBadge: {
    fontSize: 12,
    color: '#2563eb',
    backgroundColor: '#EFF6FF',
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginLeft: 4,
  },
  detailsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ageBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ageBadgeText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  allergiesValueText: {
    color: '#B45309',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563eb',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  genderOptionTextActive: {
    color: '#2563eb',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
