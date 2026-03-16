declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number | string;
    name: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
      method?: 'card' | 'netbanking' | 'wallet' | 'upi';
    };
    theme?: {
      color?: string;
    };
    modal?: {
      confirm_close?: boolean;
      ondismiss?: () => void;
    };
    retry?: {
      enabled: boolean;
      max_count?: number;
    };
    send_sms_hash?: boolean;
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpayResponse>;
  }
}