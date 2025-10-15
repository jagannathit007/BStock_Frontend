import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faShieldHalved,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { AuthService } from "../services/auth/auth.services";
import loginImage from "../../public/images/login.png";

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});


const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");


  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          "695873248784-k6f8fjsvj0u76e82u40qu8ishcbnrabd.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const googleSignInDiv = document.getElementById("googleSignInDiv");
      if (googleSignInDiv) {
        window.google.accounts.id.renderButton(googleSignInDiv, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "pill",
        });

        // Remove the auto-prompt to prevent showing suggestions automatically
        // window.google.accounts.id.prompt((notification) => {
        //   if (notification.isNotDisplayed() || notification.isSkipped()) {
        //     // Try next time or use fallback
        //   }
        // });
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError("");
    try {
      const userData = jwtDecode(response.credential);
      console.log("Google User:", userData);

      const loginData = {
        email: userData.email || "",
        socialId: userData.sub, // Google user ID
        platformName: "google",
      };

      try {
        // First, try to login
        const res = await AuthService.login(loginData);
        if (res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);

          // Save customer data to localStorage
          if (res.data.customer) {
            localStorage.setItem("user", JSON.stringify(res.data.customer));

            // Save profile image URL separately if available
            if (res.data.customer.profileImage || res.data.customer.avatar) {
              const profileImage =
                res.data.customer.profileImage || res.data.customer.avatar;
              localStorage.setItem("profileImageUrl", profileImage);
            }
          }

          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
            localStorage.setItem("email", userData.email);
          } else {
            localStorage.removeItem("rememberMe");
            localStorage.removeItem("email");
          }
          localStorage.setItem("isLoggedIn", "true");
          if (onLogin) onLogin();
          
          // Check if profile is complete for Google login users
          if (res.data.customer && res.data.customer.platformName === 'google') {
            const isProfileComplete = AuthService.isProfileComplete(res.data.customer);
            if (!isProfileComplete) {
              navigate("/profile");
              return;
            }
          }
          
          navigate("/ready-stock");
        }
      } catch (loginErr) {
        // If login fails, try to register the user automatically
        console.log("Login failed, attempting auto-registration:", loginErr.message);
        
        const registrationData = {
          name: userData.name || userData.given_name || userData.email.split('@')[0],
          email: userData.email || "",
          socialId: userData.sub,
          platformName: "google",
          // Set default values for required fields
          mobileNumber: "",
          mobileCountryCode: "+1", // Default country code
          whatsappNumber: "",
          whatsappCountryCode: "+1",
        };

        try {
          const registerRes = await AuthService.register(registrationData);
          
          if (registerRes.data && registerRes.data.token) {
            // Auto-registration successful, now login
            localStorage.setItem("token", registerRes.data.token);

            // Save customer data to localStorage
            if (registerRes.data.customer) {
              localStorage.setItem("user", JSON.stringify(registerRes.data.customer));

              // Save profile image URL separately if available
              if (registerRes.data.customer.profileImage || registerRes.data.customer.avatar) {
                const profileImage =
                  registerRes.data.customer.profileImage || registerRes.data.customer.avatar;
                localStorage.setItem("profileImageUrl", profileImage);
              }
            }

            if (rememberMe) {
              localStorage.setItem("rememberMe", "true");
              localStorage.setItem("email", userData.email);
            } else {
              localStorage.removeItem("rememberMe");
              localStorage.removeItem("email");
            }
            localStorage.setItem("isLoggedIn", "true");
            if (onLogin) onLogin();
            
            // For newly registered users, redirect to profile to complete setup
            navigate("/profile");
          }
        } catch (registerErr) {
          console.error("Auto-registration failed:", registerErr);
          setError(registerErr.message || "Failed to create account. Please try again.");
        }
      }
    } catch (err) {
      console.error("Google authentication failed:", err);
      setError(err.message || "Google authentication failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    const loginData = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    };

    try {
      const res = await AuthService.login(loginData);
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);

        // Save customer data to localStorage
        if (res.data.customer) {
          localStorage.setItem("user", JSON.stringify(res.data.customer));

          // Save profile image URL separately if available
          if (res.data.customer.profileImage || res.data.customer.avatar) {
            const profileImage =
              res.data.customer.profileImage || res.data.customer.avatar;
            localStorage.setItem("profileImageUrl", profileImage);
          }
        }

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("email", data.email);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("email");
        }
        localStorage.setItem("isLoggedIn", "true");
        if (onLogin) onLogin();
        
        // Check if profile is complete for Google login users
        if (res.data.customer && res.data.customer.platformName === 'google') {
          const isProfileComplete = AuthService.isProfileComplete(res.data.customer);
          if (!isProfileComplete) {
            navigate("/profile");
            return;
          }
        }
        
        navigate("/ready-stock");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleForgotPassword = () => {
    setShowLoginForm(false);
    setShowForgotPasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowForgotPasswordModal(false);
    setShowLoginForm(true);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, staggerChildren: 0.2 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0px 8px 25px rgba(79, 70, 229, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };


  // Right side image section
  const ImageSection = () => (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center overflow-hidden">
      <img
        src={loginImage}
        alt="Premium GSM Bidding Platform"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/80 to-indigo-800/90"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-16 lg:w-20 h-16 lg:h-20 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute top-40 right-20 w-12 lg:w-16 h-12 lg:h-16 bg-white/5 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-40 left-20 w-10 lg:w-12 h-10 lg:h-12 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 text-center text-white px-6 lg:px-8 max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 lg:w-20 h-16 lg:h-20 bg-white/20 rounded-2xl lg:rounded-3xl mb-6 lg:mb-8 backdrop-blur-sm">
          <svg className="w-8 lg:w-10 h-8 lg:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 className="text-2xl lg:text-3xl xl:text-5xl font-bold mb-4 lg:mb-6 leading-tight">
          Access the best deals, anytime
        </h2>
        <p className="text-lg lg:text-xl text-blue-100 leading-relaxed">
          Discover exclusive deals, trusted sellers, and unbeatable prices—all in one secure platform.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style jsx>{`
        .scroll-container {
          height: 100vh;
          max-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        .scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
      <div className="h-screen flex bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden" style={{height: '100vh', maxHeight: '100vh'}}>
        <div className="flex-1 flex justify-center px-2 sm:px-4 lg:px-6 bg-transparent py-2 sm:py-3 lg:py-4 items-start min-w-0 min-h-0 scroll-container" style={{height: '100%', maxHeight: '100vh'}}>
          <div className="w-full flex justify-center items-center min-h-full">
            {showLoginForm && (
            <motion.div
              className="max-w-md w-full space-y-4 sm:space-y-5 lg:space-y-6 px-2 sm:px-3 lg:px-4 py-3 sm:py-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Logo and Header */}
              <motion.div className="text-center" variants={childVariants}>
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl shadow-lg mb-3 sm:mb-4 animate-float">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Sign in to access exclusive deals and trusted trading opportunities
                </p>
              </motion.div>

              {/* {error && (
                <motion.div
                  className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200 flex items-start space-x-3"
                  variants={childVariants}
                >
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-amber-600 text-sm mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium">Login Warning</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </motion.div>
              )} */}

              {/* Form Card */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl border border-white/20 p-3 sm:p-4 lg:p-5"
                variants={childVariants}
              >
                <motion.form
                  className="space-y-3 sm:space-y-4 lg:space-y-5"
                  onSubmit={handleSubmit(onSubmit)}
                  variants={childVariants}
                >
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-gray-400 group-focus-within:text-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <input
                      type="email"
                      {...register("email", {
                        onChange: (e) => {
                          setValue("email", e.target.value);
                          setError("");
                          trigger("email");
                        },
                      })}
                      className={`block w-full pl-8 pr-3 py-1.5 sm:py-2 border-2 rounded-lg transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white text-sm sm:text-sm ${
                        errors.email
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-gray-400 group-focus-within:text-blue-500 transition-colors text-xs"
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", {
                        onChange: (e) => {
                          setValue("password", e.target.value);
                          setError("");
                          trigger("password");
                        },
                      })}
                      className={`block w-full pl-8 pr-10 py-1.5 sm:py-2 border-2 rounded-lg transition-all duration-300 bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white text-sm sm:text-sm ${
                        errors.password
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEye : faEyeSlash}
                        className="text-gray-400 hover:text-blue-600 transition-colors text-xs"
                      />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer"
                    />
                    <label className="ml-3 block text-[14px] font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[14px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-pointer py-1 sm:py-3 px-6 rounded-lg font-semibold text-sm sm:text-sm focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center disabled:opacity-70 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={isLoading || isSubmitting}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {isLoading || isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 
             0 5.373 0 12h4zm2 5.291A7.962 
             7.962 0 014 12H0c0 3.042 1.135 
             5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    <span>Log In</span>
                  )}
                </motion.button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  {googleLoading ? (
                    <div className="flex justify-center items-center py-4 bg-gray-50/50 rounded-xl border-2 border-gray-200">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin text-blue-600 mr-3"
                      />
                      <span className="text-gray-700 font-medium">
                        Signing in with Google...
                      </span>
                    </div>
                  ) : (
                    <div id="googleSignInDiv" className="w-full [&>div]:rounded-xl [&>div>div]:rounded-xl [&>div>div>div]:rounded-xl [&>div]:shadow-sm [&>div]:hover:shadow-md [&>div]:transition-all [&>div]:duration-300"></div>
                  )}
                </div>
                </motion.form>
              </motion.div>

              <motion.div className="text-center" variants={childVariants}>
                <p className="text-gray-600 text-base font-medium">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
                  >
                    Create one here
                  </Link>
                </p>
              </motion.div>
{/* 
              <motion.div className="text-center" variants={childVariants}>
                <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <FontAwesomeIcon
                    icon={faShieldHalved}
                    className="mr-2 text-green-600"
                  />
                  Enterprise-grade security
                </div>
              </motion.div> */}
            </motion.div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-1 relative min-w-0">
          <ImageSection />
        </div>

        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={handleCloseModal}
          onEmailSubmit={(email) => {
            console.log("Password reset requested for:", email);
            handleCloseModal();
          }}
        />
      </div>
    </>
  );
};

export default LoginForm;
