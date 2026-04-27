import api from '../utils/api';

// --- Interfaces for Type Safety ---

export interface DoctorRegistrationData {
  name: string;
  email: string;
  mobile: string;
  role: 'doctor' | 'cmo'; // 🟢 Now mandatory for the service call
  specialization?: string;
  mciNumber?: string;
  experienceYears?: number;
}

export interface AdminResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface DashboardStats {
    users: { _id: string; count: number }[];
    cases: { _id: string; count: number }[];
    finance: { total: number }[];
}

export interface TransactionData {
    _id: string;
    patientName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    date: string; 
}

export interface PatientRecord {
    _id: string;
    name: string;
    paymentStatus: 'Paid' | 'Pending';
    caseId: string;
    assignedDoctor: string;
}

export interface CaseData {
    _id: string;
    status: 'pending' | 'assigned' | 'completed';
    patientId: { _id: string; name: string };
    doctorId?: { _id: string; name: string; specialization: string };
    createdAt: string;
}

const adminService = {
    /**
     * 📊 Get Dashboard Overview
     */
    getDashboardStats: async (): Promise<AdminResponse<DashboardStats>> => {
        try {
            const response = await api.get('/admin/dashboard-stats');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to fetch dashboard stats");
        }
    },

    /**
     * 💰 Fetch Detailed Transaction History
     */
    getTransactionHistory: async (): Promise<AdminResponse<TransactionData[]>> => {
        try {
            const response = await api.get('/admin/payments');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching transaction history");
        }
    },

    /**
     * 💰 Fetch Payment/Transaction History
     */
    getPayments: async (): Promise<AdminResponse<any[]>> => {
        try {
            const response = await api.get('/admin/payments');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching payments");
        }
    },

    /**
     * 👨‍⚕️ Fetch All Registered Doctors
     */
    getAllDoctors: async (): Promise<AdminResponse<any[]>> => {
        try {
            const response = await api.get('/admin/users?role=doctor');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching doctor list");
        }
    },

    /**
     * 👥 Fetch All Patients with Status
     */
    getAllPatients: async (): Promise<AdminResponse<PatientRecord[]>> => {
        try {
            const response = await api.get('/admin/users?role=patient&includeStatus=true');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching patient records");
        }
    },

    /**
     * 👨‍⚕️ Create Staff Account (Doctor or CMO)
     * 🟢 UPDATED: Endpoint changed to match backend staff creation logic
     */
    createDoctor: async (doctorData: DoctorRegistrationData): Promise<AdminResponse> => {
        try {
            // Changed from /create-doctor to /create-staff to match backend controller
            const response = await api.post('/admin/create-doctor', doctorData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to create account");
        }
    },

    /**
     * 🔍 Fetch All Cases
     */
    getAllCases: async (): Promise<AdminResponse<CaseData[]>> => {
        try {
            const response = await api.get('/admin/cases');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching cases");
        }
    },

    /**
     * 🛠️ Reassign Case
     */
    reassignDoctor: async (caseId: string, doctorId: string): Promise<AdminResponse> => {
        try {
            const response = await api.patch('/admin/reassign-doctor', { caseId, doctorId });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to reassign doctor");
        }
    },

    /**
     * ✅ Verify Payment
     */
    verifyPayment: async (transactionId: string): Promise<AdminResponse> => {
        try {
            const response = await api.patch('/admin/verify-payment', { transactionId });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to verify payment");
        }
    },
};

export default adminService;