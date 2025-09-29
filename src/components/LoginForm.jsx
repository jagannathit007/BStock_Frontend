import { useState, useEffect } from "react";
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


const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);


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
          localStorage.setItem("email", email);
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
      console.error("Google login failed:", err);
      setError(err.message || "Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    const loginData = {
      email: email.trim().toLowerCase(),
      password,
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
          localStorage.setItem("email", email);
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
    <div className="relative w-full h-screen bg-indigo-600 flex items-center justify-center">
      <img
        src={loginImage}
        alt="Premium GSM Bidding Platform"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 text-center text-white px-6 max-w-2xl">
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          xGMS Access the best deals, anytime.
        </h2>
        <p className="text-lg text-indigo-100">
          Log in to discover exclusive deals, trusted sellers, and unbeatable
          prices—all in one place.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen flex bg-white fixed inset-0 overflow-auto">
        <div className="flex-1 flex  justify-center px-4 sm:px-4 lg:px-6 bg-white overflow-y-auto py-12 items-center">
          {showLoginForm && (
            <motion.div
              className="max-w-md w-full space-y-8 px-4 sm:px-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="text-left" variants={childVariants}>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back !
                </h1>
                <p className="text-gray-600">
                  Enter to get unlimited access to data & information.
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

              <motion.form
                className="space-y-6"
                onSubmit={handleSubmit}
                variants={childVariants}
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-indigo-400 text-sm"
                      />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg  transition-colors bg-white text-sm"
                      placeholder="Enter your mail address"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-indigo-400 text-sm"
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg  transition-colors bg-white text-sm"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEye :  faEyeSlash }
                        className="text-gray-400 hover:text-indigo-600 text-sm"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <span
                    onClick={handleForgotPassword}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Forgot your password ?
                  </span>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-[#0071E0] text-white cursor-pointer py-2 px-4 rounded-lg font-medium focus:ring-4 flex items-center justify-center disabled:opacity-70"
                  disabled={isLoading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {isLoading ? (
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">
                      Or, Login with
                    </span>
                  </div>
                </div>

                <div className="w-full">
                  {googleLoading ? (
                    <div className="flex justify-center items-center py-3 bg-gray-50 rounded-lg border">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin text-indigo-600 mr-2"
                      />
                      <span className="text-gray-700">
                        Signing in with Google...
                      </span>
                    </div>
                  ) : (
                    <div id="googleSignInDiv" className="w-fit mx-auto [&>div]:rounded-lg [&>div>div]:rounded-lg [&>div>div>div]:rounded-lg"></div>
                  )}
                </div>
              </motion.form>

              <motion.div className="text-center" variants={childVariants}>
                <p className="text-gray-600 text-sm font-medium">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Register here
                  </Link>
                </p>
              </motion.div>

              <motion.div className="text-center" variants={childVariants}>
                <p className="text-xs text-gray-500 flex items-center justify-center font-medium">
                  <FontAwesomeIcon
                    icon={faShieldHalved}
                    className="mr-2 text-indigo-500"
                  />
                  Your business data is protected with enterprise-grade security
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>

        <div className="hidden lg:flex flex-1 relative">
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
