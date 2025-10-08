import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigateToReadyStock = () => {
    navigate("/ready-stock");
  };

  const handleNavigateToBidding = () => {
    navigate("/bidding");
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-8 animate-slideUp">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Platform with Verified Traders
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-gray-900 animate-fadeIn">
              <span className="block animate-slideInLeft animate-stagger-1">AI-Powered</span>
              <span className="block text-blue-600 animate-slideInRight animate-stagger-2">Platform</span>
              <span className="block animate-slideInLeft animate-stagger-3">with Verified</span>
              <span className="block text-blue-600 animate-slideInRight animate-stagger-4">Traders</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-slideUp animate-stagger-5">
              At XGSM, we simplify global trading with fast, efficient, and user-friendly solutions designed specifically for traders, distributors, and retailers in the consumer electronics industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-scaleIn animate-stagger-5">
              <button
                onClick={handleNavigateToReadyStock}
                className="bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 animate-glow"
              >
                Join now with free membership
              </button>
              <button
                onClick={handleNavigateToBidding}
                className="border-2 border-blue-600 text-blue-600 px-10 py-4 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                Start free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
              The world's markets<br />
              <span className="text-blue-600">at your fingertips</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              At XGSM, we simplify global trading with fast, efficient, and user-friendly solutions designed specifically for traders, distributors, and retailers in the consumer electronics industry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 animate-slideUp animate-stagger-1">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 animate-float">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No. 1 Platform for verified traders</h3>
              <p className="text-gray-600 leading-relaxed">Connect with genuine leads and verified traders worldwide</p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 animate-slideUp animate-stagger-2">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: '0.5s'}}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Search Powered by OpenAI</h3>
              <p className="text-gray-600 leading-relaxed">Find exactly what you're looking for with AI-powered search</p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 animate-slideUp animate-stagger-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: '1s'}}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">TradingFeed All in One Space</h3>
              <p className="text-gray-600 leading-relaxed">Access all broadcasts and trading opportunities in one place</p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 animate-slideUp animate-stagger-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 animate-float" style={{animationDelay: '1.5s'}}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect with Genuine Leads</h3>
              <p className="text-gray-600 leading-relaxed">Build meaningful relationships with verified industry partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Access thousands of trusted buyers and sellers all around the world</h2>
            <p className="text-xl text-blue-100">Every trader is verified. Say goodbye to scams and say hello to secure, serious trading.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group animate-scaleIn animate-stagger-1">
              <div className="text-6xl font-bold mb-4 group-hover:scale-110 transition-transform animate-pulse">0k+</div>
              <div className="text-blue-100 text-lg">Companies</div>
            </div>
            <div className="group animate-scaleIn animate-stagger-2">
              <div className="text-6xl font-bold mb-4 group-hover:scale-110 transition-transform animate-pulse" style={{animationDelay: '0.2s'}}>0+</div>
              <div className="text-blue-100 text-lg">Countries</div>
            </div>
            <div className="group animate-scaleIn animate-stagger-3">
              <div className="text-6xl font-bold mb-4 group-hover:scale-110 transition-transform animate-pulse" style={{animationDelay: '0.4s'}}>0k+</div>
              <div className="text-blue-100 text-lg">Posts</div>
            </div>
            <div className="group animate-scaleIn animate-stagger-4">
              <div className="text-6xl font-bold mb-4 group-hover:scale-110 transition-transform animate-pulse" style={{animationDelay: '0.6s'}}>0k+</div>
              <div className="text-blue-100 text-lg">Deals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
