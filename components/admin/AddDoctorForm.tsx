import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import adminService, { DoctorRegistrationData } from '../../services/adminService';
import { PrimaryButton } from '../ui/PrimaryButton';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

export default function AddDoctorForm() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  
  const [formData, setFormData] = useState<DoctorRegistrationData>({
    name: '',
    email: '',
    mobile: '',
    specialization: '',
    mciNumber: '',
    experienceYears: undefined
  });

  const handleRegister = async () => {
    // Basic Validation
    if (!formData.name || !formData.email || !formData.mciNumber) {
      return Alert.alert("Required Fields", "Name, Email, and MCI Number are mandatory.");
    }

    setLoading(true);
    try {
      const response = await adminService.createDoctor(formData);
      
      if (response.success && response.data) {
        setTempPassword(response.data.tempPassword);
        setShowModal(true);
        // Reset form
        setFormData({ name: '', email: '', mobile: '', specialization: '', mciNumber: '', experienceYears: undefined });
      }
    } catch (error: any) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formGroup}>
        <TextInput 
          style={styles.input} 
          placeholder="Full Name *" 
          onChangeText={(v) => setFormData({...formData, name: v})}
          value={formData.name}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email Address *" 
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(v) => setFormData({...formData, email: v})}
          value={formData.email}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Mobile Number" 
          keyboardType="phone-pad"
          onChangeText={(v) => setFormData({...formData, mobile: v})}
          value={formData.mobile}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Specialization (e.g. Cardiologist)" 
          onChangeText={(v) => setFormData({...formData, specialization: v})}
          value={formData.specialization}
        />
        <TextInput 
          style={styles.input} 
          placeholder="MCI Number *" 
          onChangeText={(v) => setFormData({...formData, mciNumber: v})}
          value={formData.mciNumber}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Years of Experience" 
          keyboardType="numeric"
          onChangeText={(v) => setFormData({...formData, experienceYears: parseInt(v) || undefined})}
          value={formData.experienceYears?.toString()}
        />

        <PrimaryButton title="Register Doctor" onPress={handleRegister} loading={loading} />
      </View>

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registration Successful</Text>
            <Text style={styles.modalSub}>Give these credentials to the doctor:</Text>
            
            <View style={styles.passContainer}>
              <Text style={styles.passLabel}>Temporary Password:</Text>
              <Text style={styles.passValue}>{tempPassword}</Text>
            </View>

            <PrimaryButton title="Close & Continue" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formGroup: { padding: 5 },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: BORDER_RADIUS.md, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    fontSize: 16
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 5 },
  modalSub: { color: '#64748B', marginBottom: 20, textAlign: 'center' },
  passContainer: { backgroundColor: '#F1F5F9', width: '100%', padding: 15, borderRadius: 10, marginBottom: 25, alignItems: 'center' },
  passLabel: { fontSize: 12, color: '#64748B', marginBottom: 5, textTransform: 'uppercase' },
  passValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.textMain, letterSpacing: 2 }
});