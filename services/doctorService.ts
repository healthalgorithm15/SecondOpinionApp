import API from '../utils/api';
import { storage } from '../utils/storage';

export const doctorService = {
  /**
   * 🟢 Fetch all cases assigned to doctors that need review
   */
  getPendingCases: async () => {
    try {
      const token = await storage.getItem('userToken');
      const response = await API.get('/doctor/pending-cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to fetch worklist' };
    }
  },

  /**
   * 🟢 Fetch specific case details for the review screen
   * Hits: GET /api/doctor/case/:caseId
   */
  getCaseDetails: async (caseId: string) => {
    try {
      const token = await storage.getItem('userToken');
      const response = await API.get(`/doctor/case/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Case not found' };
    }
  },

  /**
   * 🟢 Submit the final doctor analysis
   * Updated keys to 'diagnosis' and 'summary' to match frontend state and TS types
   */
  submitAnalysis: async (
    caseId: string, 
    analysisData: { diagnosis: string; summary: string }
  ) => {
    try {
      const token = await storage.getItem('userToken');
      
      // The backend controller now accepts these keys thanks to our recent update
      const response = await API.post('/doctor/submit-opinion', {
        caseId,
        ...analysisData
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to submit review' };
    }
  }
};