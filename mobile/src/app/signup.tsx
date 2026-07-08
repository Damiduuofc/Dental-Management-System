import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/auth';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nic, setNic] = useState(''); // Added
const [dob, setDob] = useState(new Date()); // Use Date object
  const [showDatePicker, setShowDatePicker] = useState(false);
const [gender, setGender] = useState(''); // Added (Male, Female, Other)
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { registerPatient } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    // Validate all fields including new requirements
    if (!name || !email || !password || !phoneNumber || !nic || !dob || !gender) {
      setError('Please fill in all fields, including NIC, DOB, and Gender.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await registerPatient({ 
        name, email, password, phoneNumber, nic, dob, gender 
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign Up</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Form Inputs */}
          <View style={styles.inputContainer}><Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} /></View>
          <View style={styles.inputContainer}><Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" /></View>
          <View style={styles.inputContainer}><Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" /></View>
          
          {/* New Fields */}
          <View style={styles.inputContainer}><Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="NIC Number" value={nic} onChangeText={setNic} /></View>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.icon} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{dob.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDob(selectedDate);
                }
              }}
            />
          )}
          
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.activeGender]} onPress={() => setGender(g)}>
                <Text style={gender === g ? {color: '#FFF'} : {}}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} /></View>
          <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.icon} /><TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} /></View>

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  backButton: { marginBottom: 15, padding: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 30, paddingHorizontal: 20, height: 60, marginBottom: 12 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  dateText: { fontSize: 16, color: '#111827', paddingVertical: 10 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 10, marginBottom: 5 },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  genderBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 30, backgroundColor: '#F9FAFB', marginHorizontal: 5 },
  activeGender: { backgroundColor: '#0EA5E9' },
  button: { backgroundColor: '#0EA5E9', borderRadius: 30, height: 60, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 }
});