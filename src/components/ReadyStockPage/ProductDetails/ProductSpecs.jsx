import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTv,
  faMicrochip,
  faCamera,
  faBatteryThreeQuarters,
  faWifi,
  faCube,
} from "@fortawesome/free-solid-svg-icons";

const ProductSpecs = () => {
  const specifications = [
    {
      title: "Display",
      icon: faTv,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      items: [
        { label: "Size:", value: "6.7 inches" },
        { label: "Type:", value: "Super Retina XDR" },
        { label: "Resolution:", value: "2796×1290" },
        { label: "Refresh Rate:", value: "120Hz ProMotion" },
      ],
    },
    {
      title: "Performance",
      icon: faMicrochip,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      items: [
        { label: "Chip:", value: "A17 Pro" },
        { label: "CPU:", value: "6-core" },
        { label: "GPU:", value: "6-core" },
        { label: "Neural Engine:", value: "16-core" },
      ],
    },
    {
      title: "Camera",
      icon: faCamera,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      items: [
        { label: "Main:", value: "48MP f/1.78" },
        { label: "Ultra Wide:", value: "12MP f/2.2" },
        { label: "Telephoto:", value: "12MP f/2.8" },
        { label: "Front:", value: "12MP f/1.9" },
      ],
    },
    {
      title: "Battery",
      icon: faBatteryThreeQuarters,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
      items: [
        { label: "Video Playback:", value: "Up to 29 hours" },
        { label: "Charging:", value: "USB-C" },
        { label: "Wireless:", value: "MagSafe, Qi" },
        { label: "Fast Charge:", value: "50% in 30 min" },
      ],
    },
    {
      title: "Connectivity",
      icon: faWifi,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      items: [
        { label: "5G:", value: "Sub-6 GHz, mmWave" },
        { label: "Wi-Fi:", value: "Wi-Fi 6E" },
        { label: "Bluetooth:", value: "5.3" },
        { label: "NFC:", value: "Yes" },
      ],
    },
    {
      title: "Build",
      icon: faCube,
      iconColor: "text-gray-600",
      iconBg: "bg-gray-100",
      items: [
        { label: "Dimensions:", value: "159.9×76.7×8.25mm" },
        { label: "Weight:", value: "221g" },
        { label: "Material:", value: "Titanium" },
        { label: "Water Resistance:", value: "IP68" },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 m-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Technical Specifications
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specifications.map((spec, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div
                className={`w-10 h-10 ${spec.iconBg} rounded-lg flex items-center justify-center mr-3`}
              >
                <FontAwesomeIcon
                  icon={spec.icon}
                  className={`${spec.iconColor}`}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {spec.title}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              {spec.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex justify-between">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSpecs;
