import { Platform } from 'react-native';
import API from '../utils/api';

/**
 * patientService
 * Handles all medical record and review operations for the patient role.
 */
export const patientService = {
  /**
   * Fetches the patient's current dashboard data.
   * Scenario 2 (Drafts) and Scenario 3 (Active Cases) are handled here.
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
   * Deletes a specific medical record.
   * Note: Backend only allows deletion if isSubmitted is false.
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
   * Transitions records from Scenario 2 to Scenario 3.
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
   * 🟢 REUSES an existing record from history.
   * Adds a pointer/copy of a historical document to the current dashboard drafts.
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
   * 📄 GET SECURE DOWNLOAD URL
   * Returns the full endpoint path for downloading a PDF.
   * Used by Expo-File-System to download the file before viewing.
   */
  getRecordFileUrl: (recordId: string) => {
    // This uses your existing axios base URL configuration
    return `${API.defaults.baseURL}/patient/record/${recordId}/file`;
  },

  /**
   * Handles multi-platform file uploads with Android URI fixes.
   */
  uploadRecord: async (fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName); 
    } else {
      const uploadUri = Platform.OS === 'ios' 
        ? fileUri.replace('file://', '') 
        : fileUri;

      formData.append('file', {
        uri: uploadUri,
        name: fileName || 'upload.pdf',
        type: mimeType || 'application/pdf',
      } as any);
    }

    formData.append('title', fileName || 'Medical Report');
    formData.append('category', 'General'); 

    try {
      const response = await API.post('/patient/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error("❌ Upload Error Details:", errorMsg);
      throw error;
    }
  },

  /**
   * Polling/Fetching endpoint for Scenario 3 (Active Stepper Status).
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
   * Fetches all past cases (Medical Vault / History Modal).
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