import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductInfo from "./ProductInfo";
import ProductSpecs from "./ProductSpecs";
import { products } from "../MainContent";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the product with the matching ID
    const foundProduct = products.find((p) => p.id === parseInt(id));
    if (foundProduct) {
      // Calculate discount percentage first
      const discountValue = parseInt(foundProduct.discount);
      const originalPriceValue = parseInt(
        foundProduct.originalPrice.replace(/,/g, "")
      );
      const discountPercentage =
        Math.round((discountValue / originalPriceValue) * 100) + "%";

      setProduct({
        ...foundProduct,
        discountPercentage,
        mainImage: foundProduct.imageUrl,
        thumbnails: new Array(4).fill(foundProduct.imageUrl),
        features: [
          { icon: "faMicrochip", color: "text-blue-600", text: "A17 Pro Chip" },
          {
            icon: "faCamera",
            color: "text-purple-600",
            text: "48MP Pro Camera",
          },
          {
            icon: "faShieldHalved",
            color: "text-green-600",
            text: "12 Month Warranty",
          },
          {
            icon: "faTruckFast",
            color: "text-orange-600",
            text: "2-3 Days Shipping",
          },
        ],
      });
      setLoading(false);
    } else {
      navigate("/", { replace: true });
    }
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
      <ProductInfo product={product} navigate={navigate} />
      <ProductSpecs />
    </>
  );
};

export default ProductDetails;
