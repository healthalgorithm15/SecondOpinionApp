import React, { useState, useEffect } from 'react';
import { 
  Platform, View, Text, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions, ViewStyle, ImageStyle, TextStyle
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Pdf from 'react-native-pdf';

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    docId: string; fileName: string; contentType: string 
  }>();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const userToken = Platform.OS === 'web' 
          ? localStorage.getItem('userToken') 
          : await SecureStore.getItemAsync('userToken');
        
        if (!userToken) {
          setErrorMsg("Authentication required");
        }
        setToken(userToken);
      } catch (e) {
        setErrorMsg("Security check failed");
        console.error("Token Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Detection logic for PDF (Fixes the 'undefined' log we saw)
  const isPDF = params.contentType?.toLowerCase().includes('pdf') || 
                params.fileName?.toLowerCase().endsWith('.pdf');

  const fileUrl = `${process.env.EXPO_PUBLIC_API_URL}/patient/view/${params.docId}${Platform.OS === 'web' ? `?token=${token}` : ''}`;

  console.log("🔍 DEBUG -> isPDF:", isPDF);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E7D75" />
      </View>
    );
  }

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
        {!token && Platform.OS !== 'web' ? (
          <Text style={styles.errorText}>Access Denied. Please login again.</Text>
        ) : isPDF ? (
          Platform.OS === 'web' ? (
            /* @ts-ignore - iframe is web-only */
            <iframe 
               src={fileUrl} 
               style={{ width: '100%', height: '100%', border: 'none' }} 
               title={params.fileName} 
            />
          ) : (
            <Pdf
              trustAllCerts={false}
              source={{ 
                uri: fileUrl, 
                headers: { 'Authorization': `Bearer ${token}` },
                cache: true 
              }}
              onLoadComplete={(num) => console.log(`✅ Loaded ${num} pages`)}
              onError={(error) => {
                console.log('❌ PDF Error:', error);
                setErrorMsg(error.toString());
              }}
              style={styles.pdf}
            />
          )
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

        {errorMsg && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Fixed Styles to be strictly compatible with React Native
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' } as ViewStyle,
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
  } as ViewStyle,
  backButton: { width: 40 } as ViewStyle,
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' } as TextStyle,
  content: { flex: 1, backgroundColor: '#F8FAFC' } as ViewStyle,
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#F8FAFC',
  } as ViewStyle,
  image: { width: '100%', height: '100%' } as ImageStyle,
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  errorContainer: { 
    position: 'absolute', 
    bottom: 50, left: 20, right: 20, 
    backgroundColor: '#EF4444', 
    padding: 10, borderRadius: 5 
  } as ViewStyle,
  errorText: { color: 'white', textAlign: 'center' } as TextStyle
});