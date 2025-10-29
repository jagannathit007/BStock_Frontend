import toastHelper from "../../utils/toastHelper";
import api from "../api/api";
import { env } from "../../utils/env";

export interface BidProduct {
  _id?: string;
  name: string;
  brand: string;
  model: string;
  grade: string;
  capacity: string;
  carrier: string;
  price: number | string;
  minimumBid?: number | string;
  lotNumber?: string;
  biddingEndsAt?: string;
  description?: string;
  images?: string[];
  manifest?: Array<{
    sku: string;
    condition: string;
    qty: number;
    imei?: string;
  }>;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BidProductResponse {
  success: boolean;
  message: string;
  data: BidProduct;
}

export class BiddingService {
  static getBidProductById = async (id: string): Promise<BidProduct> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/get-bid-productsById`;

    try {
      const res = await api.post(url, { id });
      
      if (res.data?.data === null || res.data?.data === undefined) {
        throw new Error(res.data?.message || "Failed to fetch Bid Product");
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch Bid Product";
      toastHelper.showTost(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };
}

