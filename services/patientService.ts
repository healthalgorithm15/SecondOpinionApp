import { Platform } from 'react-native';
import API from '../utils/api';

export const patientService = {
  /**
   * 📄 SMART VIEW/DOWNLOAD URL
   * Correctly routes to either the 'record' endpoint or the 'view' endpoint.
   */
  getRecordFileUrl: (path: string) => {
    if (!path) return '';
    // Normalize path by removing leading slash and 'patient/' prefix if present
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (cleanPath.startsWith('patient/')) {
       cleanPath = cleanPath.replace('patient/', '');
    }

    // SCENARIO 1: Draft Records (Binary stream from DB)
    if (cleanPath.startsWith('record')) {
      return `${API.defaults.baseURL}/patient/${cleanPath}`;
    }

    // SCENARIO 2: Final Reports / Historical Views
    return `${API.defaults.baseURL}/patient/view/${cleanPath}`;
  },

  /**
   * Fetches the patient's current dashboard data.
   */
  getDashboard: async () => {
    try {
      const response = await API.get('/patient/dashboard');
      return response.data; 
    } catch (error: any) {
      console.error("❌ Get Dashboard Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Deletes a specific medical record (only if not submitted).
   */
  deleteRecord: async (id: string) => {
    try {
      const response = await API.delete(`/patient/record/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Delete Record Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Triggers the AI and specialist review pipeline.
   */
  submitForReview: async (reportIds: string[]) => {
    try {
      const response = await API.post('/patient/submit-review', { reportIds });
      return response.data;
    } catch (error: any) {
      console.error("❌ Submit Review Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Reuses an existing record from history.
   */
  reuseRecord: async (reportId: string) => {
    try {
      const response = await API.post('/patient/records/reuse', { reportId });
      return response.data;
    } catch (error: any) {
      console.error("❌ Reuse Record Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🟢 PRODUCTION UPLOAD
   * Handles multi-platform file uploads with boundary fixes.
   */
  uploadRecord: async (fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName); 
    } else {
      // Fix for iOS file pathing
      const uploadUri = Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri;
      
      const filePayload = {
        uri: uploadUri,
        name: fileName || 'upload.pdf',
        type: mimeType || 'application/pdf',
      } as any;

      formData.append('file', filePayload);
    }

    formData.append('title', (fileName || 'Medical Report').trim());
    formData.append('category', 'General'); 

    try {
      const response = await API.post('/patient/upload', formData, {
        headers: { 
          // 🛡️ PRODUCTION FIX: Removing manual 'Content-Type' header.
          // Axios/React Native will automatically set it WITH the required boundary.
          'Accept': 'application/json' 
        },
        // Ensures Axios handles the FormData object correctly
        transformRequest: (data) => data,
      });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error("❌ Upload Error:", errorMsg);
      throw error;
    }
  },

  /**
   * Retrieves active case status (Stepper logic).
   */
  getCaseStatus: async (caseId: string) => {
    try {
      const response = await API.get(`/patient/case/${caseId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Case Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetches all past completed cases.
   */
  getReviewHistory: async (page = 1, limit = 10) => {
    try {
      const response = await API.get('/patient/history', {
        params: { page, limit }
      });
      return response.data; 
    } catch (error: any) {
      console.error("❌ Get History Error:", error.response?.data || error.message);
      throw error;
    }
  }
};