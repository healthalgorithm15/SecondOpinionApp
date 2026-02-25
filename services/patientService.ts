import { Platform } from 'react-native';
import API from '../utils/api';

/**
 * patientService
 * Handles all medical record operations for the patient role.
 */
export const patientService = {
  /**
   * Fetches the patient's current dashboard data, 
   * including profile info and recent reports.
   * Returns: { success: true, data: { name, reports, stats } }
   */
  getDashboard: async () => {
    try {
      // Hits GET /api/patient/dashboard
      const response = await API.get('/patient/dashboard');
      return response.data; //
    } catch (error: any) {
      console.error("❌ Get Dashboard Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🚀 PRODUCTION REVIEW SUBMISSION
   * Triggers the AI and specialist review pipeline for selected reports.
   */
  submitForReview: async (reportIds: string[]) => {
    try {
      // Hits POST /api/patient/submit-review
      const response = await API.post('/patient/submit-review', { reportIds });
      return response.data; //
    } catch (error: any) {
      console.error("❌ Submit Review Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Handles multi-platform file uploads.
   * Converts URIs to Blobs for Web and prepares specific objects for Mobile.
   */
  uploadRecord: async (fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();

    // 1. Prepare file data based on Platform
    if (Platform.OS === 'web') {
      /**
       * 🌐 WEB LOGIC
       * Browsers require an actual Blob object for FormData uploads.
       */
      const response = await fetch(fileUri);
      const blob = await response.blob();
      // Appends to the 'file' key to match backend upload.single('file')
      formData.append('file', blob, fileName); 
    } else {
      /**
       * 📱 MOBILE LOGIC (iOS/Android)
       * Streams file from disk using a specific object structure.
       */
      const cleanUri = Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri;
      formData.append('file', {
        uri: cleanUri,
        name: fileName || 'upload.pdf',
        type: mimeType || 'application/pdf',
      } as any);
    }

    // 2. Append additional metadata required by MedicalRecord schema
    formData.append('title', fileName || 'Medical Report');
    formData.append('category', 'General'); // Default category

    try {
      /**
       * 🚀 Hits POST /api/patient/upload
       * Your API util handles Authorization headers.
       * Deleting Content-Type in interceptors allows correct boundary setting.
       */
      const response = await API.post('/patient/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data; // Structure: { success: true, message, data }
    } catch (error: any) {
      // Log detailed error for debugging 404/500 issues
      console.error("❌ Upload Error Details:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetches detailed case status for the history screen.
   */
  getCaseStatus: async (caseId: string) => {
    console.log("inside patientservice ts", caseId)
    try {
       console.log("inside patientservice ts before reponse ", caseId)
      const response = await API.get(`/patient/case/${caseId}`);
       console.log("inside patientservice ts after reponse ", response)
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Case Error:", error.response?.data || error.message);
      throw error;
    }
  }
};