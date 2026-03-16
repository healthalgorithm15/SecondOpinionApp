import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions, Platform,
  SafeAreaView, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

// ✅ Internal Imports
import { patientService } from '../../services/patientService';

// ✅ Keep the lazy-load variable
let Pdf: any = null;

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ docId: string; fileName: string; contentType: string }>();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Logic preserved: Only require PDF on Native
    if (Platform.OS !== 'web' && !Pdf) {
      try {
        Pdf = require('react-native-pdf').default;
      } catch (e) {
        console.error("PDF Library load failed");
      }
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

  // ✅ SMART URL: Using the service ensures the path matches the backend requirements
  const fileUrl = patientService.getRecordFileUrl(params.docId);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#1E7D75" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {params.fileName || "Medical Record"}
        </Text>
        
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {errorMsg ? (
          <View style={styles.centered}><Text style={styles.errorText}>{errorMsg}</Text></View>
        ) : !token ? (
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
            onError={(error: any) => {
              console.warn("PDF Render Error:", error);
              setErrorMsg("Could not display PDF.");
            }}
          />
        ) : (
          <Image 
            source={{ 
              uri: fileUrl, 
              headers: { 'Authorization': `Bearer ${token}` } 
            }} 
            style={styles.image} 
            resizeMode="contain" 
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backButton: { width: 40 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1E293B' },
  content: { flex: 1, backgroundColor: '#F8FAFC' },
  pdf: { 
    flex: 1, 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height,
    backgroundColor: '#F8FAFC' 
  },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#EF4444', textAlign: 'center', fontWeight: '500' }
});