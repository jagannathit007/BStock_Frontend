import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faTruck } from "@fortawesome/free-solid-svg-icons";
import { PRIMARY_COLOR, PRIMARY_COLOR_LIGHT, PRIMARY_COLOR_LIGHTER, PRIMARY_COLOR_DARK } from "../utils/colors";

const HomePage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState("");
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef({});

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers = [];
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]));
        }
      });
    };

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const setSectionRef = (id) => (el) => {
    if (el) sectionRefs.current[id] = el;
  };

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

  const ceos = [
    {
      name: "Sufiyan",
      position: "Co-Founder & CEO",
      description: "Visionary leader with extensive experience in the wholesale electronics industry. Sufiyan brings innovative strategies and deep market insights to XGSM, driving the company's mission to connect trusted traders worldwide.",
      expertise: "Strategic Planning, Business Development, Market Analysis"
    },
    {
      name: "Mustakim",
      position: "Co-Founder & CEO",
      description: "Passionate entrepreneur dedicated to transforming the wholesale trading landscape. Mustakim's expertise in technology and business operations ensures XGSM delivers exceptional value to distributors and retailers globally.",
      expertise: "Operations Management, Technology Innovation, Customer Relations"
    }
  ];

  const stats = [
    { value: "11+", label: "Years of experience", suffix: "since 2014" },
    { value: "100%", label: "Customer satisfaction", suffix: "guaranteed" },
    { value: "1.3M+", label: "iPhones successfully sold", suffix: "" },
    { value: "700+", label: "Active wholesale clients", suffix: "globally" },
    { value: "<1.5%", label: "Average RMA rate", suffix: "maintained" }
  ];

  // Custom SVG Icons for Product Categories
  const IPhoneIcon = () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="6" r="1" fill="currentColor"/>
    </svg>
  );

  const PartsIcon = () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  );

  const AccessoriesIcon = () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8L22 9L17 13L18 20L12 17L6 20L7 13L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const AuctionIcon = () => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8L22 9L17 13L18 20L12 17L6 20L7 13L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const productCategories = [
    {
      icon: IPhoneIcon,
      title: "iPhones",
      description: "Shop premium pre-owned iPhones at wholesale prices",
      color: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      href: "/ready-stock"
    },
    {
      icon: PartsIcon,
      title: "Parts",
      description: "High-quality iPhone replacement parts",
      color: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      href: "/ready-stock"
    },
    {
      icon: AccessoriesIcon,
      title: "Accessories",
      description: "Genuine Apple accessories at wholesale prices",
      color: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      href: "/ready-stock"
    },
    {
      icon: AuctionIcon,
      title: "Auctions",
      description: "Place your bid now and secure your batch",
      color: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      href: "/bidding"
    }
  ];

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="bg-white">
      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ backgroundColor: PRIMARY_COLOR_LIGHT }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 text-center">
          <div 
            className={`transition-all duration-1000 ${isVisible('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            ref={setSectionRef('hero')}
            id="hero"
          >
            <p className="text-lg md:text-xl text-gray-600 mb-6 font-medium tracking-wide">
              Europe's trusted Distributor since 2014
            </p>
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-gray-900 mb-8 leading-none tracking-tight">
              <span className="block lg:inline">Premium <span style={{ color: PRIMARY_COLOR }}>Wholesale</span></span>
              <span className="hidden lg:inline"> </span>
              <br className="block lg:hidden" />
              <span className="block lg:inline">iPhones</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Connecting distributors and retailers with the largest inventory of premium pre-owned iPhones. 
              Trusted by 700+ wholesalers across 60+ countries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleNavigateToReadyStock}
                className="text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                style={{ backgroundColor: PRIMARY_COLOR }}
                onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
                onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
              >
                Shop Ready Stock
              </button>
              <button
                onClick={handleNavigateToBidding}
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                View Auctions
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 text-2xl" />
        </div>
      </section>

      {/* About Section - Apple Style */}
      <section 
        id="about"
        ref={setSectionRef('about')}
        className={`py-24 md:py-32 bg-white transition-all duration-1000 ${isVisible('about') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              About XGSM
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Looking for a trusted and reliable supplier? XGSM is the premier platform for distributors and consumer electronic retailers. 
              We offer access to a massive inventory, ensuring that you'll never run out of the latest phones.
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-6 leading-relaxed">
              <span className="font-semibold text-gray-900">"We have 100% customer satisfaction"</span>
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section - Coolmix Style */}
      <section 
        id="stats"
        ref={setSectionRef('stats')}
        className={`py-24 md:py-32 bg-gray-50 transition-all duration-1000 ${isVisible('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isVisible('stats') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                  opacity: isVisible('stats') ? 1 : 0
                }}
              >
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-3 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-base md:text-lg text-gray-600 font-medium mb-1">{stat.label}</div>
                {stat.suffix && (
                  <div className="text-sm text-gray-500">{stat.suffix}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories - Apple Style */}
      <section 
        id="categories"
        ref={setSectionRef('categories')}
        className={`py-24 md:py-32 bg-white transition-all duration-1000 ${isVisible('categories') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive range of products and services designed for wholesale traders
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {productCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(category.href)}
                  className="group cursor-pointer relative overflow-hidden bg-white border border-gray-200 rounded-3xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: isVisible('categories') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                    opacity: isVisible('categories') ? 1 : 0
                  }}
                >
                  {/* Background Gradient */}
                  {category.title === "iPhones" ? (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR_LIGHTER}, ${PRIMARY_COLOR_LIGHT})` }}></div>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  )}
                  
                  <div className="relative p-8">
                    {/* Icon Container with Enhanced Design */}
                    <div className="relative mb-6">
                      {category.title === "iPhones" ? (
                        <>
                          <div className="absolute inset-0 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}></div>
                          <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
                            <div className="w-12 h-12 text-white">
                              <IconComponent />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                          <div className={`relative w-20 h-20 bg-gradient-to-br ${category.color} rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl`}>
                            <div className="w-12 h-12 text-white">
                              <IconComponent />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-900 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-base group-hover:text-gray-700 transition-colors">
                      {category.description}
                    </p>
                    
                    {/* Arrow Indicator */}
                    <div className="mt-6 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                      <span className="text-sm font-medium mr-2">Explore</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CEOs Section */}
      <section 
        id="ceos"
        ref={setSectionRef('ceos')}
        className={`py-24 md:py-32 bg-gray-50 transition-all duration-1000 ${isVisible('ceos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Meet Our Leadership
            </h2>
            <p className="text-xl text-gray-600">
              Visionary founders driving innovation in wholesale trading
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {ceos.map((ceo, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: isVisible('ceos') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                  opacity: isVisible('ceos') ? 1 : 0
                }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mr-4" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
                    <span className="text-white text-2xl font-bold">
                      {ceo.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{ceo.name}</h3>
                    <p className="text-gray-600 text-lg">{ceo.position}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed text-base">
                  {ceo.description}
                </p>
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Expertise</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{ceo.expertise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Delivery Section */}
      <section 
        id="delivery"
        ref={setSectionRef('delivery')}
        className={`py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 ${isVisible('delivery') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-xl" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Delivering Worldwide!
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Express worldwide shipping to distributors and retailers across the globe
            </p>
          </div>
          
          {/* Delivery Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div 
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animationDelay: '0ms',
                animation: isVisible('delivery') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                opacity: isVisible('delivery') ? 1 : 0
              }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_COLOR_DARK})` }}>
                <FontAwesomeIcon icon={faTruck} className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Express Shipping</h3>
              <p className="text-gray-600 leading-relaxed">
                Fast and reliable delivery to all major destinations worldwide
              </p>
            </div>

            <div 
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animationDelay: '100ms',
                animation: isVisible('delivery') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                opacity: isVisible('delivery') ? 1 : 0
              }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Packaging</h3>
              <p className="text-gray-600 leading-relaxed">
                Products carefully packaged to ensure safe delivery anywhere in the world
              </p>
            </div>

            <div 
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{
                animationDelay: '200ms',
                animation: isVisible('delivery') ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                opacity: isVisible('delivery') ? 1 : 0
              }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tracking Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time tracking for all shipments with 24/7 customer support
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300" style={{ color: PRIMARY_COLOR }}>60+</div>
              <div className="text-gray-600 font-medium">Countries Served</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300" style={{ color: PRIMARY_COLOR }}>24/7</div>
              <div className="text-gray-600 font-medium">Shipping Support</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300" style={{ color: PRIMARY_COLOR }}>5-7</div>
              <div className="text-gray-600 font-medium">Days Average Delivery</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300" style={{ color: PRIMARY_COLOR }}>100%</div>
              <div className="text-gray-600 font-medium">Safe Delivery Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        id="faq"
        ref={setSectionRef('faq')}
        className={`py-24 md:py-32 bg-gray-50 transition-all duration-1000 ${isVisible('faq') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  <FontAwesomeIcon 
                    icon={openFaq === index ? faChevronUp : faChevronDown} 
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform"
                  />
                </button>
                {openFaq === index && (
                  <div className="px-8 py-6 bg-gray-50 text-gray-700 leading-relaxed text-base border-t border-gray-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section 
        id="newsletter"
        ref={setSectionRef('newsletter')}
        className={`py-24 md:py-32 bg-white transition-all duration-1000 ${isVisible('newsletter') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Get in touch
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join our newsletter and stay updated with the latest wholesale deals
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full text-gray-900 bg-gray-50 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-lg"
              onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${PRIMARY_COLOR}40`}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required
            />
            <button
              type="submit"
              className="text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 whitespace-nowrap text-lg shadow-lg hover:shadow-xl"
              style={{ backgroundColor: PRIMARY_COLOR }}
              onMouseEnter={(e) => e.target.style.backgroundColor = PRIMARY_COLOR_DARK}
              onMouseLeave={(e) => e.target.style.backgroundColor = PRIMARY_COLOR}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
