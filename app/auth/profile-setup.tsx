import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import API from '@/utils/api';

export default function ProfileSetup() {
  const router = useRouter();
  const [form, setForm] = useState({ age: '', gender: '' });

  const completeSetup = async () => {
    try {
      await API.put('/user/update-profile', form);
      router.replace('/(tabs)');
    } catch (err) {
      alert("Error saving profile");
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.webLimiter}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.title}>One last thing...</Text>
          <Text style={styles.sub}>Tell us a bit about yourself for better AI accuracy.</Text>
          
          <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" onChangeText={(v)=>setForm({...form, age: v})} />
          
          <View style={styles.genderRow}>
            {['Male', 'Female'].map(g => (
              <TouchableOpacity 
                key={g} 
                style={[styles.chip, form.gender === g && styles.activeChip]} 
                onPress={() => setForm({...form, gender: g})}
              >
                <Text style={form.gender === g ? {color: '#fff'} : {}}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={completeSetup}>
            <Text style={styles.btnText}>Complete Setup</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#E2E8F0', alignItems: 'center' },
  webLimiter: { flex: 1, width: '100%', maxWidth: 450, backgroundColor: '#fff' },
  safe: { flex: 1, padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40 },
  sub: { color: '#64748B', marginBottom: 30 },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  chip: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  activeChip: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  btn: { backgroundColor: '#134E4A', padding: 18, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});