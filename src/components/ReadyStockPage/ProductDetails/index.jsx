import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductInfo from "./ProductInfo";
import { ProductService } from "../../../services/products/products.services";
import { PRIMARY_COLOR } from "../../../utils/colors";
import {
  faMicrochip,
  faCamera,
  faShieldHalved,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const mapApiToDetails = (p) => {
      const priceNumber = Number(p.price) || 0;
      const originalPriceNumber = priceNumber > 0 ? priceNumber + 100 : 0;
      const discountPercentage =
        originalPriceNumber > 0
          ? Math.round(
              ((originalPriceNumber - priceNumber) / originalPriceNumber) * 100
            ) + "%"
          : "0%";

      const images =
        typeof p.skuFamilyId === "object" && Array.isArray(p.skuFamilyId?.images)
          ? p.skuFamilyId.images
          : [];

      const stock = Number(p.stock) || 0;
      const stockStatus =
        stock <= 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";

      return {
        id: p._id || p.id,
        name: p.skuFamilyId?.name || "Product",
        description:
          p.skuFamilyId?.description ||
          [p.storage, p.color].filter(Boolean).join(" • ") ||
          "",
        price: String(priceNumber),
        originalPrice: String(originalPriceNumber),
        discountPercentage,
        mainImage: images[0] || "https://via.placeholder.com/800x600.png?text=Product",
        thumbnails: images.length
          ? images.slice(0, 4)
          : new Array(4).fill(
              images[0] || "https://via.placeholder.com/200.png?text=Product"
            ),
        features: [
          {
            icon: faMicrochip,
            color: PRIMARY_COLOR,
            text: p.specification || p.skuFamilyId?.description || "High performance",
          },
          { icon: faCamera, color: "text-purple-600", text: "Advanced Camera" },
          {
            icon: faShieldHalved,
            color: "text-green-600",
            text: "12 Month Warranty",
          },
          {
            icon: faTruckFast,
            color: "text-orange-600",
            text: "2-3 Days Shipping",
          },
        ],
        moq: Number(p.moq) || 0,
        stock: stock,
        stockStatus,
        expiryTime: p.expiryTime || "",
        notify: Boolean(p.notify),
        wishList: Boolean(p.WishList),
        // All API fields
        brand: p.skuFamilyId?.brand || "",
        code: p.skuFamilyId?.code || "",
        color: p.color || "",
        colorVariant: p.skuFamilyId?.colorVariant || [],
        ram: p.ram || "",
        storage: p.storage || "",
        condition: p.condition || "",
        simType: p.simType || p.skuFamilyId?.simType || "",
        country: p.country || p.skuFamilyId?.country || "",
        countryVariant: p.skuFamilyId?.countryVariant || "",
        networkBands: p.skuFamilyId?.networkBands || [],
        isNegotiable: Boolean(p.isNegotiable),
        isVerified: Boolean(p.isVerified),
        isFlashDeal: Boolean(p.isFlashDeal),
        purchaseType: p.purchaseType || "",
        createdAt: p.createdAt || "",
        updatedAt: p.updatedAt || "",
        status: p.status || "",
        isApproved: Boolean(p.isApproved),
        verifiedBy: p.verifiedBy || "",
        approvedBy: p.approvedBy || "",
      };
    };

    const refreshProduct = async () => {
      setLoading(true);
      try {
        const res = await ProductService.getProductById(id);
        if (!isCancelled) {
          const mapped = mapApiToDetails(res);
          setProduct(mapped);
        }
      } catch (e) {
        if (!isCancelled) {
          navigate("/", { replace: true });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    if (id) {
      refreshProduct();
    }

    return () => {
      isCancelled = true;
    };
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderTopColor: PRIMARY_COLOR, borderBottomColor: PRIMARY_COLOR }}></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductInfo
        product={product}
        navigate={navigate}
        onRefresh={async () => {
          try {
            const res = await ProductService.getProductById(product.id);
            const mapped = mapApiToDetails(res);
            setProduct(mapped);
          } catch (_) {
            // ignore
          }
        }}
      />
      {/* <ProductSpecs /> */}
    </>
  );
};

export default ProductDetails;