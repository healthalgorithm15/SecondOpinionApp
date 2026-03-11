import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/authService';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!passwords.current) return Alert.alert("Error", "Enter your current password");
    if (passwords.new.length < 8) return Alert.alert("Error", "New password too short");
    if (passwords.new !== passwords.confirm) return Alert.alert("Error", "Passwords do not match");

    setLoading(true);
    try {
      await authService.updatePassword(passwords.current, passwords.new);
      Alert.alert("Success", "Password updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert("Failed", error.response?.data?.message || "Invalid current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('@/assets/images/medical-bg.webp')} style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#0D9488" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputTile}><TextInput style={styles.input} placeholder="Current Password" secureTextEntry onChangeText={(t) => setPasswords({...passwords, current: t})} /></View>
          <View style={styles.inputTile}><TextInput style={styles.input} placeholder="New Password" secureTextEntry onChangeText={(t) => setPasswords({...passwords, new: t})} /></View>
          <View style={styles.inputTile}><TextInput style={styles.input} placeholder="Confirm New Password" secureTextEntry onChangeText={(t) => setPasswords({...passwords, confirm: t})} /></View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleUpdate}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Password</Text>}</TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0D9488', marginLeft: 10 },
  formContainer: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  inputTile: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 15, height: 60, justifyContent: 'center', paddingHorizontal: 15, marginBottom: 15 },
  input: { fontSize: 16 },
  submitBtn: { backgroundColor: '#0D9488', padding: 18, borderRadius: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold' }
});