import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';

export default function DoctorActivationScreen() {
  const router = useRouter();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    console.log("inside handleActive");
  if (passwords.new.length < 8) return Alert.alert("Security", "Password must be at least 8 characters.");
  if (passwords.new !== passwords.confirm) return Alert.alert("Error", "Passwords do not match.");

  setLoading(true);
  try {
    await authService.completeOnboarding(passwords.new);
    console.log("account active");
    router.replace('../(tabs)/doctor-home');
    /*Alert.alert(
      "Welcome!", 
      "Your account is now active.", 
      [
        { 
          text: "Enter Dashboard", 
          // 🟢 Use Absolute Path to ensure correct redirection
          onPress: () => router.replace('../(tabs)/doctor-home') 
        }
      ]
    );*/
  } catch (error: any) {
    // 🟢 Specifically handle the error if the session expired during the screen stay
    Alert.alert("Activation Failed", error.response?.data?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
};
  return (
    <ImageBackground source={require('@/assets/images/medical-bg.png')} style={styles.fullScreen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Activate Account</Text>
          <Text style={styles.subtitle}>Set your permanent password to begin reviewing cases.</Text>
          
          <View style={styles.inputTile}><TextInput style={styles.input} placeholder="New Password" secureTextEntry onChangeText={(t) => setPasswords({...passwords, new: t})} /></View>
          <View style={styles.inputTile}><TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry onChangeText={(t) => setPasswords({...passwords, confirm: t})} /></View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleActivate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Activate & Login</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center' },
  formContainer: { paddingHorizontal: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0D9488', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 30 },
  inputTile: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 15, height: 60, justifyContent: 'center', paddingHorizontal: 15, marginBottom: 15 },
  input: { fontSize: 16 },
  submitBtn: { backgroundColor: '#0D9488', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});