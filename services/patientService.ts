import { Platform } from 'react-native';
import API from '../utils/api';

export const patientService = {
  /**
   * 📄 SMART VIEW/DOWNLOAD URL
   */
 /**
   * 📄 SMART VIEW/DOWNLOAD URL
   * Detects if we are viewing a static upload or a generated AI/Doctor report.
   */
  getRecordFileUrl: (path: string) => {
    if (!path) return '';

    // 1. Clean up the path (remove leading slashes)
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // 2. ROUTE TO GENERATOR: If path starts with 'case/', it's for reportController.js
    // Result: http://your-api.com/api/patient/case/pdf-ai/123
    if (cleanPath.startsWith('case/')) {
      return `${API.defaults.baseURL}/patient/${cleanPath}`;
    }

    // 3. ROUTE TO STORAGE: Default logic for viewing original uploaded files
    // Result: http://your-api.com/api/patient/view/678
    if (cleanPath.startsWith('patient/')) {
       cleanPath = cleanPath.replace('patient/', '');
    }
    
    return `${API.defaults.baseURL}/patient/view/${cleanPath}`;
  },

  /**
   * 🟢 PRODUCTION DASHBOARD SYNC
   * Returns the raw Axios response so that the UI can handle normalization.
   */
  getDashboard: async () => {
    try {
      // 🛡️ Returning the full response object allows PatientHomeScreen 
      // to handle .data.data or .data extraction based on the API response structure.
      return await API.get('/patient/dashboard');
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
   * Reinforced for multi-platform boundary handling.
   */
  uploadRecord: async (fileUri: string, fileName: string, mimeType: string) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName); 
    } else {
      // 🛡️ iOS/Android File Path Fix
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
          'Accept': 'application/json',
          // 🛡️ DO NOT manually set Content-Type here; Axios sets the boundary automatically.
        },
        // Ensures Axios doesn't attempt to stringify the FormData object
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
   * Retrieves active case status.
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
   * Fetches past cases with pagination.
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