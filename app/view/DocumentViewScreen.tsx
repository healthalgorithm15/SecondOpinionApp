import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// 1. REMOVE the top-level import Pdf from 'react-native-pdf'
// 2. Create a variable to hold the component
let Pdf: any = null;

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ docId: string; fileName: string; contentType: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 3. ONLY require the PDF library on Android/iOS at runtime
    if (Platform.OS !== 'web' && !Pdf) {
      Pdf = require('react-native-pdf').default;
    }

    const fetchToken = async () => {
      try {
        const userToken = await SecureStore.getItemAsync('userToken');
        setToken(userToken);
      } catch (e) {
        setErrorMsg("Security check failed");
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  const isPDF = params.contentType?.toLowerCase().includes('pdf') || 
                params.fileName?.toLowerCase().endsWith('.pdf');

  const fileUrl = `${process.env.EXPO_PUBLIC_API_URL}/patient/view/${params.docId}`;

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#1E7D75" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{params.fileName || "Medical Record"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!token ? (
          <View style={styles.centered}><Text>Access Denied.</Text></View>
        ) : isPDF && Platform.OS !== 'web' && Pdf ? (
          <Pdf
            trustAllCerts={false}
            source={{ 
              uri: fileUrl, 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: true 
            }}
            style={styles.pdf}
            onError={() => setErrorMsg("Could not display PDF.")}
          />
        ) : (
          <Image 
            source={{ uri: fileUrl, headers: { 'Authorization': `Bearer ${token}` } }} 
            style={styles.image} 
            resizeMode="contain" 
          />
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
  pdf: { flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});