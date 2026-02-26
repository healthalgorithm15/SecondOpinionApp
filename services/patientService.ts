import { Platform } from 'react-native';
import API from '../utils/api';

/**
 * patientService
 * Handles all medical record and review operations for the patient role.
 */
export const patientService = {
  /**
   * Fetches the patient's current dashboard data.
   * Hits GET /api/patient/dashboard
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
   * 🚀 PRODUCTION REVIEW SUBMISSION
   * Triggers the AI and specialist review pipeline for selected reports.
   * Hits POST /api/patient/submit-review
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
   * Handles multi-platform file uploads.
   * Prepares specific FormData structures for Web vs Mobile.
   * Hits POST /api/patient/upload
   */
  uploadRecord: async (fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName); 
    } else {
      const cleanUri = Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri;
      formData.append('file', {
        uri: cleanUri,
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
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Upload Error Details:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetches detailed case status (used for real-time tracking/polling).
   * Hits GET /api/patient/case/:caseId
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
   * 🟢 UPDATED: Fetches paginated ReviewCase objects for the History screen.
   * Hits GET /api/patient/history?page=1&limit=10
   * @param page - The page number to fetch
   * @param limit - Number of items per page
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