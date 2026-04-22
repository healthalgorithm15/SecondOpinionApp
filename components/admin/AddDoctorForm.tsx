import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import adminService from '../../services/adminService';
import { PrimaryButton } from '../ui/PrimaryButton';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

export default function AddDoctorForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'cmo'>('doctor'); // 🟢 Added Role State
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    specialization: '',
    mciNumber: '',
    experienceYears: undefined as number | undefined
  });

  const handleRegister = async () => {
    // 🟢 DYNAMIC VALIDATION: MCI is only mandatory for Doctors
    if (!formData.name || !formData.email || (role === 'doctor' && !formData.mciNumber)) {
      const msg = role === 'doctor' 
        ? "Name, Email, and MCI Number are mandatory." 
        : "Name and Email are mandatory.";
      return Alert.alert("Required Fields", msg);
    }

    setLoading(true);
    try {
      // 🟢 Pass the role along with form data
      const response = await adminService.createDoctor({ ...formData, role });
      
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

  const handleModalDone = () => {
    setShowModal(false);
    router.replace('/(admin)/' as any);
  };

  return (
    <View style={styles.container}>
      {/* 🟢 ROLE SELECTOR TABS */}
      <View style={styles.rolePickerContainer}>
        <TouchableOpacity 
          style={[styles.roleTab, role === 'doctor' && styles.activeTab]} 
          onPress={() => setRole('doctor')}
        >
          <Text style={[styles.roleTabText, role === 'doctor' && styles.activeTabText]}>DOCTOR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.roleTab, role === 'cmo' && styles.activeTab]} 
          onPress={() => setRole('cmo')}
        >
          <Text style={[styles.roleTabText, role === 'cmo' && styles.activeTabText]}>CMO</Text>
        </TouchableOpacity>
      </View>

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

        {/* 🟢 CONDITIONAL FIELDS: Hide for CMO if they aren't medical practitioners */}
        {role === 'doctor' && (
          <>
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
          </>
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Years of Experience" 
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          onChangeText={(v) => setFormData({...formData, experienceYears: parseInt(v) || undefined})}
          value={formData.experienceYears?.toString() || ''}
        />

        <PrimaryButton 
          title={`Register ${role === 'doctor' ? 'Doctor' : 'CMO'}`} 
          onPress={handleRegister} 
          loading={loading} 
        />
      </View>

      {/* SUCCESS MODAL remains the same but updated for context */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registration Successful</Text>
            <Text style={styles.modalSub}>{role.toUpperCase()} credentials generated:</Text>
            
            <View style={styles.passContainer}>
              <Text style={styles.passLabel}>Temp Password</Text>
              <Text style={styles.passValue}>{tempPassword}</Text>
            </View>

            <Text style={styles.infoText}>
              Share this with the {role}. They must change it upon their first login to activate the account.
            </Text>

            <PrimaryButton title="Back to Dashboard" onPress={handleModalDone} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  rolePickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: 20,
    marginHorizontal: 5
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#94A3B8',
  },
  activeTabText: {
    color: COLORS.primary,
  },
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
  modalTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: COLORS.primary, marginBottom: 8, textAlign: 'center' },
  modalSub: { color: '#64748B', marginBottom: 20, textAlign: 'center', fontFamily: 'Inter-Medium' },
  passContainer: { backgroundColor: '#F1F5F9', width: '100%', padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  passLabel: { fontSize: 10, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  passValue: { fontSize: 26, fontFamily: 'Inter-Bold', color: COLORS.textMain, letterSpacing: 2 },
  infoText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 25, lineHeight: 18 }
});