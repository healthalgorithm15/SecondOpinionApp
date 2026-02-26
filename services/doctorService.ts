import API from '../utils/api';

/**
 * doctorService
 * Handles specialist workflows including pending queues, case reviews, and history.
 */
export const doctorService = {
  /**
   * 🟢 Fetch all cases awaiting specialist review
   * Hits: GET /api/doctor/pending-cases
   */
  getPendingCases: async () => {
    try {
      const response = await API.get('/doctor/pending-cases');
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Pending Cases Error:", error.response?.data || error.message);
      throw error; // Throwing allows component-level catch blocks to handle UI alerts
    }
  },

  /**
   * 🟢 Fetch specific case details for the review screen
   * Hits: GET /api/doctor/case/:caseId
   */
  getCaseDetails: async (caseId: string) => {
    try {
      const response = await API.get(`/doctor/case/${caseId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Case Details Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🟢 Submit the final doctor analysis
   * Matches the backend transaction logic and accepts flexible naming
   * Hits: POST /api/doctor/submit-opinion
   */
  submitAnalysis: async (
    caseId: string, 
    analysisData: { diagnosis: string; summary: string }
  ) => {
    try {
      const response = await API.post('/doctor/submit-opinion', {
        caseId,
        ...analysisData
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Submit Analysis Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🟢 NEW: Fetch completed reviews (History) with pagination
   * Hits: GET /api/doctor/history?page=1&limit=10
   */
  getDoctorHistory: async (page = 1, limit = 10) => {
    try {
      const response = await API.get('/doctor/history', {
        params: { page, limit }
      });
      return response.data; // Returns { success: true, data: [...], pagination: {...} }
    } catch (error: any) {
      console.error("❌ Get Doctor History Error:", error.response?.data || error.message);
      throw error;
    }
  }
};