import api from '../api/api';
import toastHelper from '../../utils/toastHelper';

export interface Negotiation {
  _id?: string;
  productId: string | {
    _id: string;
    name: string;
    price: number;
    mainImage: string;
    skuFamilyId?: string | {
      _id: string;
      name: string;
    };
  };
  bidId: string;
  fromUserId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  FromUserType: 'Admin' | 'Customer';
  toUserId?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  toUserType?: 'Admin' | 'Customer';
  offerPrice: number;
  currency?: string;
  quantity?: number;
  message?: string;
  status: 'negotiation' | 'accepted' | 'rejected';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBidRequest {
  productId: string;
  offerPrice: number;
  currency?: string;
  currentLocation?: string;
  deliveryLocation?: string;
  deliveryCountry?: string;
  quantity?: number;
  message?: string;
}

export interface NegotiationResponse {
  negotiation: Negotiation;
  message: string;
  success: boolean;
}

export interface NegotiationListResponse {
  negotiations: Negotiation[];
  totalPages: number;
  currentPage: number;
  total: number;
  message: string;
  success: boolean;
}

export interface NegotiationStats {
  totalNegotiations: number;
  activeNegotiations: number;
  acceptedNegotiations: number;
  customerBids: number;
  adminBids: number;
}

export interface NegotiationStatsResponse {
  data: NegotiationStats;
  message: string;
  success: boolean;
}

export interface RespondToNegotiationRequest {
  negotiationId: string;
  action: 'accept' | 'counter';
  offerPrice?: number;
  currency?: string;
  currentLocation?: string;
  deliveryLocation?: string;
  deliveryCountry?: string;
  quantity?: number;
  message?: string;
}

export class NegotiationService {
  // Customer methods
  static async createBid(bidData: CreateBidRequest): Promise<NegotiationResponse> {
    try {
      const res = await api.post('/api/customer/negotiation/create-bid', bidData);
      // Check if response status is 200 and data is not null
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || 'Bid created successfully!', 'success');
        return res.data.data;
      } else {
        // Show warning message and return false
        toastHelper.showTost(res.data.message || 'Failed to create bid', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create bid';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getCustomerNegotiations(page = 1, limit = 10, status?: string): Promise<NegotiationListResponse> {
    try {
      const res = await api.post('/api/customer/negotiation/list', { page, limit, status });
      console.log('Customer Negotiations Response:', res.data); // Debug log
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch negotiations');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getProductBids(productId: string, page = 1, limit = 50): Promise<NegotiationListResponse> {
    try {
      const res = await api.post('/api/customer/negotiation/product-bids', { productId, page, limit });
      if (res.data?.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch product bids');
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch product bids';
      console.error('Error fetching product bids:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  static async respondToNegotiation(responseData: RespondToNegotiationRequest): Promise<NegotiationResponse> {
    try {
      const res = await api.post('/api/customer/negotiation/respond', responseData);
      // Check if response status is 200 and data is not null
      if (res.status === 200 && res.data.data) {
        toastHelper.showTost(res.data.message || 'Response sent successfully!', 'success');
        return res.data.data;
      } else {
        // Show warning message and return false
        toastHelper.showTost(res.data.message || 'Failed to send response', 'warning');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send response';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getAcceptedNegotiations(page = 1, limit = 10): Promise<NegotiationListResponse> {
    try {
      const res = await api.post('/api/customer/negotiation/accepted', { page, limit });
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch accepted negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Admin methods
  static async getAllNegotiations(page = 1, limit = 10, status?: string, customerId?: string): Promise<NegotiationListResponse> {
    try {
      const res = await api.post('/api/admin/negotiation/list', { page, limit, status, customerId });
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async respondToNegotiationAdmin(responseData: RespondToNegotiationRequest): Promise<NegotiationResponse> {
    try {
      const res = await api.post('/api/admin/negotiation/respond', responseData);
      toastHelper.showTost(res.data?.message || 'Response sent successfully!', 'success');
      return res.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send response';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getNegotiationDetails(negotiationId: string): Promise<NegotiationResponse> {
    try {
      const res = await api.post('/api/admin/negotiation/details', { negotiationId });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiation details';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getAcceptedNegotiationsAdmin(page = 1, limit = 10): Promise<NegotiationListResponse> {
    try {
      const res = await api.post('/api/admin/negotiation/accepted', { page, limit });
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch accepted negotiations';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  static async getNegotiationStats(): Promise<NegotiationStatsResponse> {
    try {
      const res = await api.post('/api/admin/negotiation/stats', {});
      return res.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch negotiation statistics';
      toastHelper.showTost(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  }

  // Confirm negotiation (via token from email) with addresses
  static async confirmNegotiation(
    token: string, 
    shippingAddress?: { address: string; country: string; city: string },
    billingAddress?: { address: string; country: string; city: string }
  ): Promise<any> {
    try {
      const body: any = { token };
      if (shippingAddress) {
        body.shippingAddress = shippingAddress;
      }
      if (billingAddress) {
        body.billingAddress = billingAddress;
      }
      const res = await api.post(`/api/customer/negotiation/confirm`, body);
      if (res.data?.status === 200) {
        return res.data.data;
      } else {
        throw new Error(res.data?.message || 'Failed to confirm negotiation');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm negotiation';
      throw new Error(errorMessage);
    }
  }
}

export default NegotiationService;
