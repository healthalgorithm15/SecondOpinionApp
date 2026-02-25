import api from '../utils/api';

// Define the shape of the data for better Autocomplete/Type Safety
export interface DoctorRegistrationData {
    name: string;
    email: string;
    mobile: string;
    specialization: string;
    mciNumber: string;
    experienceYears?: number;
}

export interface AdminResponse {
    success: boolean;
    message: string;
    data?: {
        name: string;
        tempPassword: string;
        role: string;
    };
}

const adminService = {
    /**
     * Sends doctor details to backend to create a new account
     * Includes the Admin's JWT token automatically via the 'api' utility
     */
    createDoctor: async (doctorData: DoctorRegistrationData): Promise<AdminResponse> => {
        try {
            const response = await api.post('/admin/create-doctor', doctorData);
            return response.data;
        } catch (error: any) {
            // Extract the error message from the backend response
            const message = error.response?.data?.message || "Failed to create doctor account";
            throw new Error(message);
        }
    },

    /**
     * Optional: Fetch all doctors to show in a management list
     */
    getAllDoctors: async () => {
        try {
            const response = await api.get('/admin/doctors');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Error fetching doctors");
        }
    }
};

export default adminService;