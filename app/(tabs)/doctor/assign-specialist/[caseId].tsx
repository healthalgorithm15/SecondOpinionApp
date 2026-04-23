import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- DESIGN SYSTEM ---
import AuthLayout from '../../../../components/AuthLayout';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../../../constants/theme';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';

// --- LOGIC ---
import { doctorService } from '../../../../services/doctorService';

// Mock data for specialists - in production, fetch this from an API
const SPECIALISTS_DATA = [
  { id: 'spec_1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', cases: 2 },
  { id: 'spec_2', name: 'Dr. James Wilson', specialty: 'Radiology', cases: 5 },
  { id: 'spec_3', name: 'Dr. Elena Rodriguez', specialty: 'Neurology', cases: 1 },
  { id: 'spec_4', name: 'Dr. Michael Bond', specialty: 'General Medicine', cases: 0 },
];

export default function AssignSpecialistScreen() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching specialist list
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleAssignment = async () => {
    if (!selectedId) {
      Alert.alert("Selection Required", "Please select a specialist to handle this case.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await doctorService.assignSpecialist(caseId as string, selectedId);
      if (res.success) {
        Alert.alert("Success", "Case successfully assigned.", [
          { text: "OK", onPress: () => router.replace('/(tabs)/doctor/doctor-home') }
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to assign case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSpecialist = ({ item }: { item: any }) => {
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity 
        style={[
          styles.doctorCard, 
          isSelected && styles.selectedCard
        ]}
        onPress={() => setSelectedId(item.id)}
      >
        <View style={styles.doctorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(4)}</Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.specialtyText}>{item.specialty}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.loadLabel}>Active Cases</Text>
          <Text style={[styles.loadCount, { color: item.cases > 3 ? '#EF4444' : '#10B981' }]}>
            {item.cases}
          </Text>
        </View>

        <Ionicons 
          name={isSelected ? "checkbox" : "square-outline"} 
          size={24} 
          color={isSelected ? COLORS.primary : '#CBD5E1'} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <AuthLayout 
      title="Assign Specialist" 
      subtitle={`Selecting lead for Case #${(caseId as string)?.slice(-6).toUpperCase()}`}
    >
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>AVAILABLE DOCTORS</Text>
            <FlatList
              data={SPECIALISTS_DATA}
              renderItem={renderSpecialist}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
            />
            
            <View style={styles.footer}>
              <PrimaryButton 
                title="Confirm Assignment" 
                onPress={handleAssignment}
                loading={isSubmitting}
                disabled={!selectedId}
              />
              <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 15 },
  list: { paddingBottom: 20 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.soft
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDFA',
  },
  doctorInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: { fontWeight: 'bold', color: '#64748B' },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  specialtyText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  statsContainer: { marginRight: 20, alignItems: 'center' },
  loadLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  loadCount: { fontSize: 16, fontWeight: '800' },
  footer: { paddingVertical: 20 },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  cancelText: { color: '#94A3B8', fontWeight: '600' },

  details: {
    flex: 1,
    justifyContent: 'center',
  },

});