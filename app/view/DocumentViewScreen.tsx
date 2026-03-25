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

// ✅ Lazy-load PDF only on Native
let Pdf: any = null;

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ docId: string; fileName: string; contentType: string }>();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
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

  // 🟢 IMPROVED FILE DETECTION
  const contentType = params.contentType?.toLowerCase() || '';
  const fileName = params.fileName?.toLowerCase() || '';

  const isImage = contentType.includes('image') || 
                  fileName.endsWith('.jpg') || 
                  fileName.endsWith('.jpeg') || 
                  fileName.endsWith('.png');

  const isActuallyPDF = !isImage && (contentType.includes('pdf') || fileName.endsWith('.pdf'));

  const fileUrl = patientService.getRecordFileUrl(params.docId);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#1E7D75" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 🟢 Ensures the status bar doesn't overlap the header on Android */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        >
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {params.fileName || "Medical Record"}
        </Text>
        
        {/* Placeholder to keep title centered */}
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {errorMsg ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                <Text style={{color: '#FFF'}}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : !token ? (
          <View style={styles.centered}><Text>Access Denied.</Text></View>
        ) : isActuallyPDF && Platform.OS !== 'web' && Pdf ? (
          <Pdf
            trustAllCerts={Platform.OS === 'ios'} 
            source={{ 
              uri: fileUrl, 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: true 
            }}
            singlePage={false} 
          onLoadComplete={(numberOfPages: number) => {
    console.log(`Number of pages: ${numberOfPages}`);
         setLoading(false);
            }}
            style={styles.pdf}
            onError={(error: any) => {
              console.log("PDF Error Details:", error);
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
            onLoadEnd={() => setLoading(false)}
            onError={() => setErrorMsg("Could not display Image.")}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF',
    // 🟢 FIX: Padding for Android Status Bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56,
    paddingHorizontal: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  content: { flex: 1, backgroundColor: '#F8FAFC' },
  pdf: { 
    flex: 1, 
    width: Dimensions.get('window').width, 
    backgroundColor: '#F8FAFC' 
  },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#EF4444', textAlign: 'center', fontWeight: '500', marginTop: 10 },
  retryBtn: { marginTop: 20, backgroundColor: '#1E293B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});