import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faCheckCircle, faUsers, faGlobe, faNewspaper, faHandshake } from "@fortawesome/free-solid-svg-icons";

const HomePage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState("");

  const handleNavigateToReadyStock = () => {
    navigate("/ready-stock");
  };

  const handleNavigateToBidding = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      const hashPath = window.location.hash?.slice(1) || '/home';
      const returnTo = encodeURIComponent(hashPath);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }
    navigate("/bidding");
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  const faqs = [
    {
      question: "How can I sign up?",
      answer: "Signing up is easy! Just fill in your name, email, and phone number to get started. Later on, we may ask you a few more questions to verify your account."
    },
    {
      question: "Is XGSM free?",
      answer: "Absolutely! You'll start with a free subscription, with the option to upgrade to a premium account and get verified."
    },
    {
      question: "I'm new to trading and seeking connections",
      answer: "XGSM is the best platform for connecting with new trading businesses. It's the ideal place to find the right supplier or customer for your needs."
    },
    {
      question: "Which kinds of trading businesses can I find here?",
      answer: "We offer over 50 categories of trading businesses. Some examples include mobile phone trading, spare parts trading, and accessories across various industries, dealing with both brand-new and used goods."
    },
    {
      question: "What does the Trading Feed feature do?",
      answer: "This feature brings all broadcasts together in one central location, making it easier and faster for you to trade. It is exclusively available to premium members."
    }
  ];

  const testimonials = [
    {
      name: "Parm Dhillon",
      position: "Managing Director",
      company: "Sunstrike International",
      text: "XGSM is unique in what they do. They have provided us with premium and valuable market insights through their advanced search technology. It's amazing how they've accomplished this in such a short time! Attending their Dubai event was a game-changer for us, strengthening our position in the mobile trading industry. Highly recommended for anyone serious about mobile trading!",
      rating: 5
    },
    {
      name: "Hozan Ali",
      position: "Sales Manager",
      company: "GLP Wireless",
      text: "XGSM has made collaboration really easy. The platform is intuitive and connects us with verified traders worldwide.",
      rating: 5
    },
    {
      name: "Imran Haidar",
      position: "CEO",
      company: "Universal Telecom",
      text: "Mobile-friendly platform the industry needed. XGSM has transformed how we do business.",
      rating: 5
    }
  ];

  const trustedCompanies = [
    { name: "Sunstrike International", logo: "SS" },
    { name: "PCS Wireless", logo: "PC" },
    { name: "GLP Wireless", logo: "GL" },
    { name: "Universal Telecom", logo: "UT" },
  ];

  return (
    <div className="bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs md:text-sm font-semibold mb-8 animate-slideUp shadow-lg backdrop-blur-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Platform with Verified Traders
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 text-white leading-tight">
              <span className="block mb-2">AI-Powered</span>
              <span className="block text-blue-400 mb-2">Platform</span>
              <span className="block">with Verified</span>
              <span className="block text-blue-400">Traders</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed">
              At XGSM, we simplify global trading with fast, efficient, and user-friendly solutions designed specifically for traders, distributors, and retailers in the consumer electronics industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleNavigateToReadyStock}
                className="bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base md:text-lg"
              >
                Join now with free membership
              </button>
              <button
                onClick={handleNavigateToBidding}
                className="border-2 border-gray-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 text-base md:text-lg"
              >
                Start free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group text-center p-6 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">No. 1 Platform for verified traders</h3>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-green-500/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Connect with Genuine Leads</h3>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FontAwesomeIcon icon={faGlobe} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Advanced Search Powered by OpenAI</h3>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-orange-500/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FontAwesomeIcon icon={faNewspaper} className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">TradingFeed All in One Space</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              The world's markets<br />
              <span className="text-blue-400">at your fingertips</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              At XGSM, we simplify global trading with fast, efficient, and user-friendly solutions designed specifically for traders, distributors, and retailers in the consumer electronics industry. Our platform helps you connect, share offers, and build genuine relationships with industry leaders.
            </p>
          </div>
        </div>
      </div>

      {/* Trusted Companies Section */}
      <div className="bg-gray-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm md:text-base text-gray-400 mb-8 font-semibold">Trusted by industry leading-Companies</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-70">
            {trustedCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-center">
                <div className="w-32 h-16 md:w-40 md:h-20 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center text-gray-300 font-semibold text-lg md:text-xl hover:border-gray-500 transition-colors">
                  {company.logo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-16 md:py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">One Platform. Endless Deals.</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              Access thousands of trusted buyers and sellers all around the world - all in one network. Every trader is verified. Say goodbye to scams and say hello to secure, serious trading.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-blue-400 group-hover:scale-110 transition-transform">0k+</div>
              <div className="text-gray-400 text-sm md:text-base">Companies</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-blue-400 group-hover:scale-110 transition-transform">0+</div>
              <div className="text-gray-400 text-sm md:text-base">Countries</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-blue-400 group-hover:scale-110 transition-transform">0k+</div>
              <div className="text-gray-400 text-sm md:text-base">Posts</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-blue-400 group-hover:scale-110 transition-transform">0k+</div>
              <div className="text-gray-400 text-sm md:text-base">Deals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted from over +3K happy client around the world
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-700/50 border border-gray-600/50 rounded-2xl p-6 md:p-8 hover:bg-gray-700 hover:border-gray-600 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.position} - {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-700/50 border border-gray-600/50 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <span className="font-semibold text-white text-sm md:text-base">{faq.question}</span>
                  <FontAwesomeIcon 
                    icon={openFaq === index ? faChevronUp : faChevronDown} 
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4"
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-gray-800/50 text-gray-300 leading-relaxed text-sm md:text-base border-t border-gray-600/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black text-white py-16 md:py-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Unlock the magic!</h2>
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            Join XGSM today and let's start your trading journey from scratch.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-300 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
