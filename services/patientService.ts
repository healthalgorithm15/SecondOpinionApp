import { Platform } from 'react-native';
import API from '../utils/api';

/**
 * patientService
 * Handles all medical record and review operations for the patient role.
 */
export const patientService = {
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
   * Deletes a specific medical record.
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

  getCaseStatus: async (caseId: string) => {
    try {
      const response = await API.get(`/patient/case/${caseId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Case Error:", error.response?.data || error.message);
      throw error;
    }
  },

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