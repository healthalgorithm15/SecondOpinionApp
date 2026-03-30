import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Dimensions, Platform,
  SafeAreaView, StatusBar, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';



// ✅ Internal Imports
import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

// ✅ Lazy-load PDF for Native
let Pdf: any = null;

export default function DocumentViewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ 
    docId: string; 
    fileName: string; 
    contentType: string;
    uploadedBy?: string; 
    category?: string;
  }>();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Hide System Header to use our custom MedTech header
    navigation.setOptions({ headerShown: false });

    // 2. Initialize PDF Library
    if (Platform.OS !== 'web' && !Pdf) {
      try {
        Pdf = require('react-native-pdf').default;
      } catch (e) {
        console.error("PDF Library load failed", e);
      }
    }

    // 3. Auth Check
    const fetchToken = async () => {
      const userToken = await SecureStore.getItemAsync('userToken');
      if (!userToken) {
        setErrorMsg("Session expired.");
      } else {
        setToken(userToken);
      }
    };
    fetchToken();
  }, [navigation]);

  const fileUrl = patientService.getRecordFileUrl(params.docId);
  const isActuallyPDF = params.contentType?.includes('pdf') || params.fileName?.toLowerCase().endsWith('.pdf');

  /**
   * 📥 NEW API DOWNLOAD & SAVE
   * Uses FileSystem.File and FileSystem.Paths.cache (SDK 51+ Standard)
   */
 const handleSave = async () => {
  if (!token) return;
  if (!Sharing || typeof Sharing.shareAsync !== 'function') {
      Alert.alert(
        "Module Missing", 
        "The sharing module is not initialized. Please restart your dev server with 'npx expo start -c'."
      );
      return;
    }
  try {
    setIsSharing(true);

    const timestamp = new Date().getTime();
    const safeName = `${timestamp}_${(params.fileName || 'document').replace(/\s+/g, '_')}`;
    
    // 🟢 Fix: Construct the File object manually using the cache directory
    const destinationFile = new FileSystem.File(FileSystem.Paths.cache, safeName);
    const downloadResult = await FileSystem.File.downloadFileAsync(fileUrl, destinationFile, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (downloadResult && downloadResult.uri) {
      // 🟢 Check availability before calling
      const isAvailable = await Sharing.isAvailableAsync();
if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: params.contentType?.includes('pdf') ? 'application/pdf' : 'image/jpeg',
          dialogTitle: `Save ${params.fileName}`,
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    }
  } catch (error: any) {
    console.error("Save Error:", error);
    Alert.alert("Error", `Save failed: ${error.message}`);
  } finally {
    setIsSharing(false);
  }
};

  // Logic to hide the download button
  const isPatientLabReport = params.uploadedBy === 'Patient' && params.category === 'Lab Report';

  return (
    <View style={styles.container}>
      {/* 🟢 Status Bar fix for Android & iOS */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          
          <Text style={styles.title} numberOfLines={1}>
            {params.fileName || "Viewing Document"}
          </Text>
          
          <View style={styles.headerRight}>
            {!isPatientLabReport && (
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={isSharing || loading}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={COLORS.primary || '#1E7D75'} />
                ) : (
                  <Ionicons name="download-outline" size={22} color={COLORS.primary || '#1E7D75'} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {loading && !errorMsg && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary || '#1E7D75'} />
            <Text style={styles.loadingText}>Loading Document...</Text>
          </View>
        )}

        {errorMsg ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : token && isActuallyPDF && Platform.OS !== 'web' && Pdf ? (
          <Pdf
            trustAllCerts={false}
            source={{ 
              uri: fileUrl, 
              headers: { 'Authorization': `Bearer ${token}` },
              cache: true 
            }}
            onLoadComplete={() => setLoading(false)}
            style={styles.pdf}
            onError={() => {
              setErrorMsg("Unable to display PDF");
              setLoading(false);
            }}
          />
        ) : token ? (
          <Image 
            source={{ 
              uri: fileUrl, 
              headers: { 'Authorization': `Bearer ${token}` } 
            }} 
            style={styles.image} 
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setErrorMsg("Could not display image");
              setLoading(false);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 60,
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    // 🟢 Critical: Account for Android Status Bar
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerRight: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  title: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B',
    letterSpacing: -0.3 
  },
  content: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#F8FAFC', 
    zIndex: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  pdf: { 
    flex: 1, 
    width: Dimensions.get('window').width, 
    height: Dimensions.get('window').height,
    backgroundColor: '#F8FAFC' 
  },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#EF4444', marginTop: 10, fontWeight: '500' }
});