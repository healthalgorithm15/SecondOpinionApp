import RazorpayCheckout from 'react-native-razorpay';
import API from '../utils/api'; 
import { COLORS } from '../constants/theme';

export const startPaymentFlow = async (
  scanId: string,
  patientId: string,
  user: { email: string; phone: string; name: string }
) => {
  try {
    console.log("💳 Step 1: Requesting Order ID from Backend...");
    
    // 1. Backend creates order and returns order ID
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
      image: 'https://your-logo-url.com/logo.png', 
      currency: order.currency || 'INR',
      key: razorpayKey, 
      amount: Math.round(order.amount), 
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

    console.log("📲 Step 2: Opening Razorpay Checkout...");
    
    // 2. Trigger Razorpay Checkout
    const razorpayResponse = await RazorpayCheckout.open(options);

    /**
     * 🟢 CRITICAL FIX: The "UI Breathe" Delay
     * We wait 600ms to ensure the Razorpay Modal has completely unmounted 
     * from the native UI layer before we start hitting our own APIs.
     * This stops the "Something went wrong" native popup.
     */
    console.log("⏳ Success! Waiting for Modal to close...");
    await new Promise(resolve => setTimeout(resolve, 600));

    console.log("🛡️ Step 3: Verifying Signature with Backend...");

    // 3. Post-payment verification call
    const { data: verification } = await API.post('/payments/verify-payment', {
      razorpay_order_id: order.id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    });

    if (verification.success) {
      console.log("✅ Payment Verified & Credits Updated.");
      return {
        success: true,
        data: verification,
        cancelled: false
      };
    } else {
      throw new Error("Verification failed: Signature mismatch.");
    }

  } catch (error: any) {
    // 🟢 Handle user cancellation (Code 2 is specific to Razorpay SDK)
    if (error.code === 2) {
      console.log("📡 Payment cancelled by user.");
      return { success: false, cancelled: true };
    }

    // Handle the case where the user paid, but the backend verification failed
    if (error.response && error.response.status === 500) {
        console.error("🚨 CRITICAL: Payment Success but Backend Error", error.response.data);
        throw new Error("Payment processed, but we had trouble updating your credits. Please do not retry; we are verifying it now.");
    }

    const errorMessage = error.description || error.message || "Payment failed";
    console.error("❌ Razorpay/Payment Error:", error);
    
    throw new Error(errorMessage);
  }
};