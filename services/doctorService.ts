import API from '../utils/api';
import { storage } from '@/utils/storage';

/**
 * doctorService
 * Handles specialist workflows including pending queues, case reviews, and history.
 */
export const doctorService = {
  /**
   * 🟢 Fetch cases awaiting action
   * CMOs get the global queue via '?view=all', Specialists get their assigned queue.
   */
  getPendingCases: async () => {
    try {
      const role = await storage.getItem('userRole');
      const isCmo = role?.toLowerCase() === 'cmo';
      
      const endpoint = isCmo ? '/doctor/pending-cases?view=all' : '/doctor/pending-cases';
      const response = await API.get(endpoint);
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Pending Cases Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🟢 Fetch specific case details
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
   * 🟢 Specialist: Submit analysis
   * Moves case from 'ASSIGNED' to 'PENDING_CMO_APPROVAL'
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
   * 👑 CMO: Final Approval & Publish
   * Publishes the report so the patient can finally see it.
   */
  cmoApproveCase: async (
    caseId: string, 
    approvalData: { updatedVerdict: string; updatedRecommendations: string; cmoPrivateNote?: string }
  ) => {
    try {
      const response = await API.post(`/doctor/cmo-approve`, {
        caseId,
        ...approvalData
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ CMO Approval Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 👑 CMO: Assign Case to Specialist
   * Hits the endpoint to move case from 'UNASSIGNED' to 'ASSIGNED'
   */
  assignSpecialist: async (caseId: string, specialistId: string) => {
    try {
      const response = await API.post('/doctor/assign-case', {
        caseId,
        specialistId
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Assignment Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * 🟢 Fetch completed reviews (History)
   */
  getDoctorHistory: async (page = 1, limit = 10) => {
    try {
      const response = await API.get('/doctor/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Get Doctor History Error:", error.response?.data || error.message);
      throw error;
    }
  }
};