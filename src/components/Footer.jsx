import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-900 border-t border-gray-200 mt-30">
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-500 text-sm">
              © 2025 xGSM. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a 
                href="#" 
                className="text-gray-500 hover:text-[#0071e3] transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-gray-500 hover:text-[#0071e3] transition-colors duration-200 text-sm"
              >
                Terms of Service
              </a>
              <a 
                href="#" 
                className="text-gray-500 hover:text-[#0071e3] transition-colors duration-200 text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
