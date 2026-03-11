import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextStyle, ViewStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ docId: string; fileName: string; contentType: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    setToken(userToken);
    setLoading(false);
  }, []);

  const fileUrl = `${process.env.EXPO_PUBLIC_API_URL}/patient/view/${params.docId}?token=${token}`;

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#1E7D75" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>{params.fileName || "Medical Record"}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        {token ? (
          <iframe 
            src={fileUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title={params.fileName} 
          />
        ) : (
          <View style={styles.centered}><Text>Access Denied</Text></View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 45, paddingBottom: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});