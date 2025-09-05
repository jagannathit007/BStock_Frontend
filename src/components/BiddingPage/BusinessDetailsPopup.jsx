import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faTimes,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

const BusinessDetailsPopup = ({ onClose, onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0  bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Popup Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
          <h2 className="text-2xl font-bold flex items-center">
            <FontAwesomeIcon icon={faBuilding} className="mr-3" />
            Business Details Required
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:opacity-75 transition-opacity"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50">
          <p className="text-gray-700 mb-6 text-center font-medium">
            Provide your business information to unlock bidding features. Your
            details help us tailor the best experience.
          </p>

          <form className="space-y-6">
            {/* Row 1: Company Name and Contact Person */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="mr-2 text-blue-600"
                  />
                  Company Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  placeholder="Enter your company name"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="mr-2 text-blue-600"
                  />
                  Contact Person *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  placeholder="Full name"
                  required
                />
              </div>
            </div>

            {/* Row 2: Email and Phone */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="mr-2 text-blue-600"
                  />
                  Business Email *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  placeholder="business@company.com"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="mr-2 text-blue-600"
                  />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className="mr-2 text-blue-600"
                />
                Business Address
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md resize-none"
                rows="3"
                placeholder="Enter your business address"
              ></textarea>
            </div>

            {/* Row 3: Website and Business Type */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <FontAwesomeIcon
                    icon={faGlobe}
                    className="mr-2 text-blue-600"
                  />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  placeholder="https://www.yourcompany.com"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Business Type *
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all hover:shadow-md">
                  <option value="">Select business type</option>
                  <option value="retailer">Retailer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="distributor">Distributor</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="reseller">Reseller</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shadow-sm"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r bg-[#0071E0]  text-white font-semibold rounded-lg hover:bg-blue-700  transition-all shadow-md hover:shadow-lg"
          >
            Submit & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsPopup;
