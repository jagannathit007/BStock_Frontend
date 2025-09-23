import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductInfo from "./ProductInfo";
import ProductSpecs from "./ProductSpecs";
import { ProductService } from "../../../services/products/products.services";
// Import FontAwesome icons
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
        name:
          typeof p.skuFamilyId === "object" && p.skuFamilyId?.name
            ? p.skuFamilyId.name
            : "Product",
        description:
          [p.storage || "", p.color || ""].filter(Boolean).join(" • ") ||
          (p.specification || ""),
        price: String(priceNumber),
        originalPrice: String(originalPriceNumber),
        discountPercentage,
        mainImage:
          images[0] || "https://via.placeholder.com/800x600.png?text=Product",
        thumbnails: images.length
          ? images.slice(0, 4)
          : new Array(4).fill(
              images[0] || "https://via.placeholder.com/200.png?text=Product"
            ),
        features: [
          {
            icon: faMicrochip,
            color: "text-blue-600",
            text: p.specification || "High performance",
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
        stockCount: stock,
        stockStatus,
        expiryTime: p.expiryTime || "",
        notify: Boolean(p.notify),
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

    // store on window for passing to child via prop? We'll pass inline function
    return () => {
      isCancelled = true;
    };
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
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
            const priceNumber = Number(res.price) || 0;
            const originalPriceNumber = priceNumber > 0 ? priceNumber + 100 : 0;
            const images = typeof res.skuFamilyId === "object" && Array.isArray(res.skuFamilyId?.images) ? res.skuFamilyId.images : [];
            const stock = Number(res.stock) || 0;
            const stockStatus = stock <= 0 ? "Out of Stock" : stock <= 10 ? "Low Stock" : "In Stock";
            setProduct({
              id: res._id || res.id,
              name: typeof res.skuFamilyId === "object" && res.skuFamilyId?.name ? res.skuFamilyId.name : "Product",
              description: [res.storage || "", res.color || ""].filter(Boolean).join(" • ") || (res.specification || ""),
              price: String(priceNumber),
              originalPrice: String(originalPriceNumber),
              discountPercentage: originalPriceNumber > 0 ? Math.round(((originalPriceNumber - priceNumber) / originalPriceNumber) * 100) + "%" : "0%",
              mainImage: images[0] || "https://via.placeholder.com/800x600.png?text=Product",
              thumbnails: images.length ? images.slice(0, 4) : new Array(4).fill(images[0] || "https://via.placeholder.com/200.png?text=Product"),
              features: [
                { icon: faMicrochip, color: "text-blue-600", text: res.specification || "High performance" },
                { icon: faCamera, color: "text-purple-600", text: "Advanced Camera" },
                { icon: faShieldHalved, color: "text-green-600", text: "12 Month Warranty" },
                { icon: faTruckFast, color: "text-orange-600", text: "2-3 Days Shipping" },
              ],
              moq: Number(res.moq) || 0,
              stockCount: stock,
              stockStatus,
              expiryTime: res.expiryTime || "",
              notify: Boolean(res.notify),
            });
          } catch (_) {
            // ignore
          }
        }}
      />
      <ProductSpecs />
    </>
  );
};

export default ProductDetails;