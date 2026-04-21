import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal } from 'react-native';
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
    if (!formData.name || !formData.email || !formData.mciNumber) {
      return Alert.alert("Required Fields", "Name, Email, and MCI Number are mandatory.");
    }

    setLoading(true);
    try {
      const response = await adminService.createDoctor(formData);
      
      if (response.success && response.data) {
        // tempPassword comes from your backend controller logic
        setTempPassword(response.data.tempPassword);
        setShowModal(true);
        setFormData({ name: '', email: '', mobile: '', specialization: '', mciNumber: '', experienceYears: undefined });
      }
    } catch (error: any) {
      Alert.alert("Registration Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formGroup}>
        <TextInput 
          style={styles.input} 
          placeholder="Full Name *" 
          placeholderTextColor="#94A3B8"
          onChangeText={(v) => setFormData({...formData, name: v})}
          value={formData.name}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email Address *" 
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(v) => setFormData({...formData, email: v})}
          value={formData.email}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Mobile Number" 
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          onChangeText={(v) => setFormData({...formData, mobile: v})}
          value={formData.mobile}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Specialization (e.g. Cardiologist)" 
          placeholderTextColor="#94A3B8"
          onChangeText={(v) => setFormData({...formData, specialization: v})}
          value={formData.specialization}
        />
        <TextInput 
          style={styles.input} 
          placeholder="MCI Number *" 
          placeholderTextColor="#94A3B8"
          onChangeText={(v) => setFormData({...formData, mciNumber: v})}
          value={formData.mciNumber}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Years of Experience" 
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          onChangeText={(v) => setFormData({...formData, experienceYears: parseInt(v) || undefined})}
          value={formData.experienceYears?.toString() || ''}
        />

        <PrimaryButton title="Register Doctor" onPress={handleRegister} loading={loading} />
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalSub}>Temporary credentials generated:</Text>
            
            <View style={styles.passContainer}>
              <Text style={styles.passLabel}>Temp Password</Text>
              <Text style={styles.passValue}>{tempPassword}</Text>
            </View>

            <Text style={styles.infoText}>Share this password with the doctor. They will be asked to change it on first login.</Text>

            <PrimaryButton title="Done" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  formGroup: { padding: 5 },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: BORDER_RADIUS.md, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: COLORS.textMain
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 25, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: COLORS.primary, marginBottom: 8 },
  modalSub: { color: '#64748B', marginBottom: 20, textAlign: 'center', fontFamily: 'Inter-Medium' },
  passContainer: { backgroundColor: '#F1F5F9', width: '100%', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  passLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  passValue: { fontSize: 26, fontFamily: 'Inter-Bold', color: COLORS.textMain, letterSpacing: 3 },
  infoText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 25, lineHeight: 18 }
});