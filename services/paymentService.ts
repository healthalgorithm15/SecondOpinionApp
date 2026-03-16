import RazorpayCheckout from 'react-native-razorpay';
import API from '../utils/api'; 
import { COLORS } from '../constants/theme';
import { Alert } from 'react-native';

export const startPaymentFlow = async (
  scanId: string,
  patientId: string,
  user: { email: string; phone: string; name: string }
) => {
  try {
    // 1. Backend creates order and returns order ID + verified price
    // We send scanId as 'new_scan' if it's a fresh credit purchase
    const response = await API.post('/payments/create-order', {
      scanId,
      patientId
    });

    const order = response.data;

    if (!order || !order.id) {
      throw new Error("Invalid order received from server");
    }

    const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      console.error("RAZORPAY_KEY_ID is missing in environment variables");
      throw new Error("Payment gateway configuration error");
    }

    const options = {
      description: 'Medical Analysis Credit',
      image: 'https://your-logo-url.com/logo.png', // Replace with your actual hosted logo
      currency: order.currency || 'INR',
      key: razorpayKey, 
      amount: Math.round(order.amount), // 🟢 Ensure it's a whole number (paise)
      name: 'Praman AI',
      order_id: order.id,
      prefill: {
        email: user.email || '',
        contact: user.phone || '',
        name: user.name || 'User'
      },
      theme: { color: COLORS.primary },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    // 2. Trigger Razorpay Checkout
    const razorpayResponse = await RazorpayCheckout.open(options);

    // 3. Post-payment verification call to our backend
    // This is critical to prevent "fake" payment success reports
    const { data: verification } = await API.post('/payments/verify-payment', {
      razorpay_order_id: order.id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    });

    return {
      success: verification.success,
      data: verification,
      cancelled: false
    };

  } catch (error: any) {
    // 🟢 Handle user cancellation (Code 2 is specific to Razorpay SDK)
    if (error.code === 2) {
      console.log("Payment cancelled by user");
      return { success: false, cancelled: true };
    }

    // Handle specific Razorpay errors
    const errorMessage = error.description || error.message || "Payment initialization failed";
    console.error("Razorpay Error:", error);
    
    throw new Error(errorMessage);
  }
};