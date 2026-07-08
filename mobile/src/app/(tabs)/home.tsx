import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  // Menu items based on your image
  const menuItems = [
    { name: 'Treatment\nPlan', icon: 'document-text-outline' },
    { name: 'Prescrptions', icon: 'document-outline' },
    { name: 'X-rays & Docs', icon: 'folder-open-outline' },
    { name: 'Payments', icon: 'card-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/100' }} // Replace with user profile image
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.greeting}>Hi, Welcome Back!</Text>
              <Text style={styles.name}>Damidu Abeysignhe</Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </View>

        {/* 4-Icon Grid */}
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold' }
});