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
import { COLORS } from '../../constants/theme';

// ✅ Lazy-load PDF only on Native
let Pdf: any = null;

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ docId: string; fileName: string; contentType: string }>();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialize PDF Library
    if (Platform.OS !== 'web' && !Pdf) {
      try {
        Pdf = require('react-native-pdf').default;
      } catch (e) {
        console.error("PDF Library load failed", e);
      }
    }

    // 2. Auth Check
    const fetchToken = async () => {
      try {
        const userToken = await SecureStore.getItemAsync('userToken');
        if (!userToken) {
          setErrorMsg("Session expired. Please log in.");
        } else {
          setToken(userToken);
        }
      } catch (e) {
        setErrorMsg("Security check failed");
      } finally {
        // We don't set loading false here because the PDF/Image component 
        // will handle its own loading finish state.
      }
    };
    fetchToken();
  }, []);

  const contentType = params.contentType?.toLowerCase() || '';
  const fileName = params.fileName?.toLowerCase() || '';

  const isImage = contentType.includes('image') || 
                  fileName.endsWith('.jpg') || 
                  fileName.endsWith('.jpeg') || 
                  fileName.endsWith('.png');

  const isActuallyPDF = !isImage && (contentType.includes('pdf') || fileName.endsWith('.pdf'));
  const fileUrl = patientService.getRecordFileUrl(params.docId);

  return (
    <SafeAreaView style={styles.container}>
      {/* 🟢 MedTech Clean Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>
          {params.fileName || "Medical Record"}
        </Text>
        
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        {/* Full Screen Loader overlay */}
        {loading && !errorMsg && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary || '#1E7D75'} />
            <Text style={styles.loadingText}>Decrypting Document...</Text>
          </View>
        )}

        {errorMsg ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                <Text style={{color: '#FFF', fontWeight: '600'}}>Go Back</Text>
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
            onLoadComplete={() => setLoading(false)}
            onProgress={(percent: number) => {
              // Optional: Update loading text with progress
            }}
            style={styles.pdf}
            onError={(error: any) => {
              console.log("PDF Error:", error);
              setErrorMsg("Unable to open PDF. It may be encrypted or corrupted.");
              setLoading(false);
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
            onError={() => {
              setErrorMsg("Could not display Image.");
              setLoading(false);
            }}
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
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 60,
    paddingHorizontal: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    // Safe area spacing for Android
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  content: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500'
  },
  pdf: { 
    flex: 1, 
    width: Dimensions.get('window').width, 
    backgroundColor: '#F8FAFC' 
  },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#EF4444', textAlign: 'center', fontWeight: '500', marginTop: 10, lineHeight: 20 },
  retryBtn: { marginTop: 20, backgroundColor: '#1E293B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }
});