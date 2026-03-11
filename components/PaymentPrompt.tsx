import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Switch, 
  Alert 
} from 'react-native';
import { processPayment } from '../services/paymentService';

// 1. Define the Interface for Props
interface PaymentPromptProps {
  scanId: string;
  amount: number;
  patientId: string;
  onSuccess: (transaction: any) => void;
}

export const PaymentPrompt: React.FC<PaymentPromptProps> = ({ 
  scanId, 
  amount, 
  patientId, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [agreed, setAgreed] = useState<boolean>(false);

  const handlePayment = async () => {
    if (!agreed) {
      Alert.alert("Action Required", "Please accept the non-refundable policy to proceed.");
      return;
    }

    setLoading(true);
    try {
      // Calls the service we updated earlier
      const result = await processPayment(scanId, amount, patientId);
      
      if (result.success) {
        onSuccess(result.transaction);
      } else {
        Alert.alert("Payment Failed", result.message || "Verification could not be completed.");
      }
    } catch (error) {
      // Errors are handled inside the service, but we catch cancellation here
      console.log("Payment flow interrupted:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Consultation Fee</Text>
      <Text style={styles.amount}>₹{amount / 100}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>• Specialist Medical Review</Text>
        <Text style={styles.infoText}>• Guaranteed response within 24h</Text>
      </View>

      <View style={styles.agreementContainer}>
        <Switch 
          value={agreed} 
          onValueChange={setAgreed} 
          trackColor={{ false: "#767577", true: "#2196F3" }} 
        />
        <Text style={styles.agreementText}>
          I understand that this fee is **non-refundable** once the specialist begins the review.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, (!agreed || loading) && styles.buttonDisabled]} 
        onPress={handlePayment}
        disabled={loading || !agreed}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay & Submit for Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, 
    margin: 16 
  },
  title: { fontSize: 16, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  amount: { fontSize: 40, fontWeight: 'bold', color: '#2196F3', marginVertical: 12 },
  infoRow: { marginBottom: 24 },
  infoText: { color: '#444', fontSize: 15, marginBottom: 8, fontWeight: '500' },
  agreementContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 24, 
    paddingRight: 40 
  },
  agreementText: { fontSize: 13, color: '#777', marginLeft: 12, lineHeight: 18 },
  button: { 
    backgroundColor: '#2196F3', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonDisabled: { backgroundColor: '#B0BEC5', shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});