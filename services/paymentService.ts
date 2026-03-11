import { Alert } from 'react-native';
/** * NOTE: For local Expo Go development, keep this commented.
 * Run 'npx expo prebuild' and use a Development Client to use the real SDK.
 */
// import RazorpayCheckout from 'react-native-razorpay'; 

// Pulls from your .env file
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

interface PaymentResponse {
  success: boolean;
  message?: string;
  transaction?: any;
}

/**
 * processPayment
 * @param scanId - The ID of the medical scan
 * @param amount - Amount in PAISE (e.g., 50000 for ₹500)
 * @param patientId - The unique ID of the current user
 */
export const processPayment = async (
  scanId: string, 
  amount: number, 
  patientId: string
): Promise<PaymentResponse> => {
  try {
    // 1. Request Order from Backend
    const response = await fetch(`${API_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        scanId, 
        amount, 
        patientId 
      })
    });

    if (!response.ok) {
      throw new Error("Failed to create order on server");
    }

    const order = await response.json();

    // 2. Open Payment Interface
    return new Promise((resolve, reject) => {
      
      // --- PRODUCTION RAZORPAY LOGIC (Commented for Dev) ---
      /*
      const options = {
        description: 'Specialist Scan Review - Praman AI',
        image: 'https://your-domain.com/logo.png', // Update with your logo
        currency: order.currency || 'INR',
        key: RAZORPAY_KEY,
        amount: order.amount,
        name: 'Praman AI',
        order_id: order.id,
        prefill: {
          email: 'patient@example.com', // Replace with real user data
          contact: '919999999999',
          name: 'Patient Name'
        },
        theme: { color: '#2196F3' } // Your brand color
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Verify signature on backend
          const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          resolve(await verifyRes.json());
        })
        .catch((error) => {
          console.log("Razorpay Error:", error);
          reject(error);
        });
      */

      // --- DEVELOPMENT / LOCAL STRATEGY ---
      // This allows you to test the full flow without a real PAN/KYC gateway
      Alert.alert(
        "Secure Checkout", 
        `Confirm payment of ₹${amount / 100} for specialist review?`, 
        [
          { text: "Cancel", onPress: () => reject("User cancelled"), style: "cancel" },
          { 
            text: "Pay Now", 
            onPress: async () => {
              try {
                const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: order.id,
                    razorpay_payment_id: "pay_dev_mock_" + Date.now(),
                    razorpay_signature: "dev_bypass"
                  })
                });
                const result = await verifyRes.json();
                resolve(result);
              } catch (e) {
                reject(e);
              }
            } 
          }
        ]
      );
    });

  } catch (err) {
    console.error("Payment Service Failure:", err);
    Alert.alert("Payment Error", "Unable to process transaction at this time.");
    throw err;
  }
};