import toastHelper from "../../utils/toastHelper";
import api from "../api/api";
import { env } from "../../utils/env";

export interface Product {
  _id?: string;
  skuFamilyId: string | { _id: string; name: string; images?: string[] };
  specification: string;
  simType: string;
  color: string;
  ram: string;
  storage: string;
  condition: string;
  price: number | string;
  stock: number | string;
  country: string;
  moq: number | string;
  isNegotiable: boolean;
  isFlashDeal: string;
  expiryTime: string;
  WishList?: boolean; // Added wishList field as per backend update
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ImportResponse {
  status: number;
  message: string;
  data: {
    imported: string;
  };
}

export interface NotificationRequest {
  productId: string;
  notifyType: "stock_alert" | "price_alert";
  notify: boolean;
}

export interface Notification {
  _id?: string;
  productId: string;
  email: string;
  phone?: string;
  notificationType: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  status: number;
  message: string;
  data?: Notification;
}

export interface NotificationListResponse {
  status: number;
  message: string;
  data: {
    docs: Notification[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export interface NotificationStatsResponse {
  status: number;
  message: string;
  data: {
    totalNotifications: number;
    activeNotifications: number;
    triggeredNotifications: number;
    pendingNotifications: number;
  };
}

export interface UserPreferences {
  email: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  frequency: "immediate" | "daily" | "weekly";
  categories: string[];
}

export interface WishlistToggleRequest {
  productId: string;
  wishlist: boolean;
}

export interface WishlistToggleResponse {
  status: number;
  message: string;
  data: {
    productId: string;
    wishlist: boolean;
  };
}

export class ProductService {
  static getProductById = async (id: string): Promise<Product> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/get-product`;

    try {
      const res = await api.post(url, { id });
      
      if (res.data?.data === null) {
        throw new Error(res.data?.message || "Failed to fetch Product");
      }

  

      return res.data.data; // Return the Product with populated skuFamilyId and WishList status
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch Product";
      toastHelper.showTost(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };

  // Create a new notification request
  static createNotification = async (
    notificationData: NotificationRequest
  ): Promise<NotificationResponse> => {
    const baseUrl = env.baseUrl;
    const customerRoute = env.customerRoute;
    const url = `${baseUrl}/api/${customerRoute}/notify/me`;

    try {
      const res = await api.post(url, notificationData);
      toastHelper.showTost(
        res.data.message || "Notification created successfully!",
        "success"
      );
      return res.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create notification";
      toastHelper.showTost(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };

  // Toggle wishlist status for a product
  static toggleWishlist = async (
    wishlistData: WishlistToggleRequest
  ): Promise<WishlistToggleResponse> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/toggle-wishlist`;

    try {
      const res = await api.post(url, wishlistData);
      toastHelper.showTost(
        res.data.message ||
          `Product ${
            wishlistData.wishlist ? "added to" : "removed from"
          } wishlist!`,
        "success"
      );

      // Dispatch wishlist updated event for cross-component synchronization
      window.dispatchEvent(
        new CustomEvent("wishlistUpdated", {
          detail: {
            productId: wishlistData.productId,
            isWishlisted: wishlistData.wishlist,
          },
        })
      );

      return res.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to toggle wishlist";
      toastHelper.showTost(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };

  // NEW: Remove from wishlist (convenience method)
  static removeFromWishlist = async (
    productId: string
  ): Promise<WishlistToggleResponse> => {
    return await this.toggleWishlist({
      productId,
      wishlist: false,
    });
  };

  // NEW: Fetch wishlist with pagination
  static getWishlist = async (
    page: number = 1,
    limit: number = 10
  ): Promise<{
    docs: Product[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  }> => {
    const baseUrl = env.baseUrl;
    const url = `${baseUrl}/api/customer/get-wishlist`;

    try {
      const res = await api.post(url, { page, limit });
      if (res.data.status !== 200) {
        throw new Error(res.data.message || "Failed to fetch wishlist");
      }
      return res.data.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch wishlist";
      toastHelper.showTost(errorMessage, "error");
      throw new Error(errorMessage);
    }
  };
}
