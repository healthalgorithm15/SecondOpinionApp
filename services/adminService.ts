import api from '../utils/api';

// --- Interfaces for Type Safety ---

export interface DoctorRegistrationData {
    name: string;
    email: string;
    mobile: string;
    specialization: string;
    mciNumber: string;
    experienceYears?: number;
}

export interface AdminResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

// Concrete data shapes for better frontend development
export interface DashboardStats {
    users: { _id: string; count: number }[];
    cases: { _id: string; count: number }[];
    finance: { total: number }[];
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
     * 👨‍⚕️ Create Doctor Account
     */
    createDoctor: async (doctorData: DoctorRegistrationData): Promise<AdminResponse> => {
        try {
            const response = await api.post('/admin/create-doctor', doctorData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to create doctor account");
        }
    },

    /**
     * 👥 Fetch Users by Role
     */
    getUsersByRole: async (role: 'doctor' | 'patient'): Promise<AdminResponse> => {
        try {
            const response = await api.get(`/admin/users?role=${role}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || `Error fetching ${role}s`);
        }
    },

    /**
     * 🔍 Fetch All Cases (with populated patient/doctor names)
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
     * 🛠️ Reassign Case to a different Doctor
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
     * 💰 Fetch Payment Transactions
     */
    getPayments: async (): Promise<AdminResponse> => {
        try {
            const response = await api.get('/admin/payments');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching payments");
        }
    },

    /**
     * ✅ Manually Verify a Payment
     */
    verifyPayment: async (transactionId: string): Promise<AdminResponse> => {
        try {
            const response = await api.patch('/admin/verify-payment', { transactionId });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Failed to verify payment");
        }
    },


// Inside your adminService object...

/**
 * 👨‍⚕️ Fetch just the doctors for the reassignment dropdown
 */
async getAvailableDoctors(): Promise<AdminResponse<{_id: string, name: string, specialization: string}[]>> {
    try {
        // The 'async' keyword above allows this 'await' to work
        const response = await api.get('/admin/users?role=doctor');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Failed to fetch doctors");
    }
},
};

export default adminService;