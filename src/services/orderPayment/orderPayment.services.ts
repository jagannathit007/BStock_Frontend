import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface OrderPayment {
  _id?: string;
  orderId: string;
  customerId: string;
  paymentMethod: 'Cash' | 'TT' | 'ThirdParty';
  amount: number;
  currency: string;
  status: 'requested' | 'verified' | 'approved' | 'paid';
  paymentDetails?: Record<string, any>;
  transactionRef?: string;
  otp?: string;
  otpExpiry?: string;
  otpVerified?: boolean;
  otpVerifiedAt?: string;
  verificationDocuments?: string[];
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderPaymentResponse {
  status: number;
  message?: string;
  data?: OrderPayment | OrderPayment[];
}

export interface SubmitPaymentData {
  orderId: string;
  paymentMethod: 'Cash' | 'TT' | 'ThirdParty';
  paymentDetails?: Record<string, any>;
  transactionRef?: string;
  amount?: number; // Payment amount (for partial payments)
}

export class OrderPaymentService {
  /**
   * Submit payment for an order
   */
  static async submitPayment(data: SubmitPaymentData, files?: File[]): Promise<OrderPaymentResponse> {
    try {
      const formData = new FormData();
      formData.append('orderId', data.orderId);
      formData.append('paymentMethod', data.paymentMethod);
      if (data.paymentDetails) {
        formData.append('paymentDetails', JSON.stringify(data.paymentDetails));
      }
      if (data.transactionRef) {
        formData.append('transactionRef', data.transactionRef);
      }
      if (data.amount !== undefined && data.amount !== null) {
        formData.append('amount', data.amount.toString());
      }

      // Add files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('documents', files[i]);
        }
      }

      const res = await api.post('/api/customer/order-payment/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseData = res.data;
      
      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'Payment submitted successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to submit payment', 'error');
      }

      return responseData;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit payment';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  /**
   * Get payment details for an order
   */
  static async getPaymentDetails(orderId: string): Promise<OrderPaymentResponse> {
    try {
      const res = await api.post('/api/customer/order-payment/get-details', { orderId });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch payment details';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }

  /**
   * Verify OTP sent by admin
   */
  static async verifyOTP(paymentId: string, otp: string): Promise<OrderPaymentResponse> {
    try {
      const res = await api.post('/api/customer/order-payment/verify-otp', { paymentId, otp });
      const responseData = res.data;
      
      if (res.status === 200) {
        toastHelper.showTost(responseData.message || 'OTP verified successfully!', 'success');
      } else {
        toastHelper.showTost(responseData.message || 'Failed to verify OTP', 'error');
      }

      return responseData;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to verify OTP';
      toastHelper.showTost(msg, 'error');
      throw err;
    }
  }
}

export default OrderPaymentService;

