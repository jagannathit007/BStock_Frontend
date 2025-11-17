import React from "react";

const ProductCardSkeleton = ({ viewMode = "grid", delay = 0 }) => {
  const containerStyle = {
    animationName: "skeletonFadeIn",
    animationDuration: "0.5s",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    animationFillMode: "forwards",
    animationDelay: `${delay}ms`,
    opacity: 0,
  };

  if (viewMode === "table") {
    return (
      <tr className="bg-white border-b border-gray-200 hover:bg-gray-50" style={containerStyle}>
        <td className="px-4 py-3">
          <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </td>
      </tr>
    );
  }

  if (viewMode === "list") {
    return (
      <div 
        className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200"
        style={containerStyle}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Image */}
          <div className="w-full sm:w-32 h-32 sm:h-28 bg-gray-200 rounded-lg flex-shrink-0 animate-pulse"></div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Title */}
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            
            {/* Description */}
            <div className="h-3 bg-gray-200 rounded w-full mt-1 animate-pulse"></div>
            
            {/* Specs */}
            <div className="flex gap-2 mt-2">
              <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
            </div>
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between mt-auto">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col w-full h-full p-3 pb-3 box-border"
      style={containerStyle}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden mb-3 flex-shrink-0 w-full h-[200px] rounded-lg bg-gray-200 animate-pulse"></div>
      
      {/* Content Section */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        
        {/* Description */}
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
        
        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="h-[42px] bg-gray-200 rounded animate-pulse"></div>
          <div className="h-[42px] bg-gray-200 rounded animate-pulse"></div>
          <div className="h-[42px] bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

