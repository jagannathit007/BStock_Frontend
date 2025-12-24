import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  HashRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import Footer from "./components/Footer";
import WTBPanel from "./components/WTB/WTBPanel";
import Layout from "./components/Layout";
import MainContent from "./components/ReadyStockPage/MainContent";
import "./App.css";
import ProductDetails from "./components/ReadyStockPage/ProductDetails";
import BiddingContent from "./components/BiddingPage/BiddingContent";
import BidProductDetails from "./components/BiddingPage/BidProductDetails";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";
import VerifyEmailPrompt from "./components/VerifyEmailPrompt";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";
import ConfirmOrderModification from "./components/ConfirmOrderModification";
import ConfirmNegotiation from "./components/ConfirmNegotiation";
import CartPage from "./components/ReadyStockPage/CartPage";
import CheckoutPage from "./components/ReadyStockPage/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import Order from "./components/Order";
import { AuthService } from "./services/auth/auth.services";
import FlashDeals from "./components/ReadyStockPage/FlashDeals";
import WishlistPage from "./pages/WishlistPage";
import { CurrencyProvider } from "./context/CurrencyContext";
import { SocketService } from "./services/socket/socket";
import Swal from "sweetalert2";

// Route guard: redirects unauthenticated users to login with returnTo
const ProtectedRoute = ({ children, isLoggedIn }) => {
  if (!isLoggedIn) {
    const currentPath = window.location.hash.replace('#', '') || '/home';
    const returnTo = encodeURIComponent(currentPath);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Check profile completion for all users on protected routes (except profile page)
  const currentPath = window.location.hash.replace('#', '').split('?')[0]; // Get path without query params
  if (currentPath !== '/profile') {
    const user = localStorage.getItem('user');
    if (user) {
      let userData = null;
      try {
        userData = JSON.parse(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return children;
      }
      if (userData) {
        const isProfileComplete = AuthService.isProfileComplete(userData);
        if (!isProfileComplete) {
          return <Navigate to="/profile" replace />;
        }
      }
    }
  }
  return children;
};

// Component to handle header visibility based on current route
const AppContent = ({ isLoggedIn, handleLogout, handleLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide header only on login, signup, verify-email, reset-password, and confirm-order-modification pages
  const hideHeader = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/verify-email') || location.pathname.startsWith('/reset-password') || location.pathname.startsWith('/confirm-order-modification');

  useEffect(() => {
    if (isLoggedIn && (location.pathname === "/login" || location.pathname === "/signup")) {
      const params = new URLSearchParams(location.search);
      const returnTo = params.get("returnTo");

      let redirectPath = "/home";
      if (returnTo) {
        try {
          const decoded = decodeURIComponent(returnTo);
          // Sanitize: must start with / and no ..
          if (decoded.startsWith("/") && !decoded.includes("..")) {
            redirectPath = decoded;
          }
        } catch (e) {
          console.error("Invalid returnTo parameter", e);
        }
      }

      // Clean redirect (replace to avoid history clutter)
      navigate(redirectPath, { replace: true });
    }
  }, [isLoggedIn, location, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && (
        <>
          <Header onLogout={handleLogout} />
          <NavTabs />
        </>
      )}

      <main className="flex-1">
          <Routes>
            {/* Public Routes - Order matters, more specific routes first */}
            <Route 
              path="/confirm-order-modification/:token" 
              element={<ConfirmOrderModification />} 
            />
            <Route 
              path="/confirm-negotiation/:token" 
              element={<ConfirmNegotiation />} 
            />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignUpForm />} />{" "}
            {/* Public pages (browsable without login) */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/ready-stock" element={<Layout><MainContent /></Layout>} />
            <Route path="/flash-deals" element={<Layout><FlashDeals /></Layout>} />
            {/* Profile remains protected */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><ProfilePage /></Layout>
                </ProtectedRoute>
              }
            />
            {/* Default root to Home for all users */}
            <Route path="/" element={<Navigate to="/home" replace /> } />
            {/* Restricted actions require login */}
            <Route
              path="/product/:id"
              element={
                  <Layout><ProductDetails /></Layout>
              }
            />
            <Route
              path="/bidding"
              element={
                <Layout><BiddingContent isLoggedIn={isLoggedIn} /></Layout>
              }
            />
            <Route
              path="/bidding/product/:id"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><BidProductDetails /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><CartPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><CheckoutPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/order"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><Order /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><PaymentHistoryPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><WishlistPage /></Layout>
                </ProtectedRoute>
              }
            />
            {/* Fallback to Home for unknown routes - but only if not a token route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
        
        {!hideHeader && (
          <>
            <Footer />
            <WTBPanel />
          </>
        )}
      </div>
    );
  };

  const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(
      localStorage.getItem("isLoggedIn") === "true"
    );

    const handleLogin = () => {
      localStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
    };

    const handleLogout = (reason = null) => {
      // Clear entire localStorage
      localStorage.clear();
      setIsLoggedIn(false);
      // Disconnect socket
      SocketService.disconnect();
      // Dispatch event to notify other components of logout
      window.dispatchEvent(new Event('loginStateChanged'));
      
      // Show message if reason is provided (from force logout)
      if (reason) {
        Swal.fire({
          title: 'Session Ended',
          text: reason,
          icon: 'info',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          // Redirect to home page after logout
          window.location.hash = '#/home';
        });
      } else {
        // Redirect to home page after logout
        window.location.hash = '#/home';
      }
    };

    // Listen for force logout events (e.g., when margins change)
    useEffect(() => {
      if (isLoggedIn) {
        const handleForceLogout = (data) => {
          console.log('Force logout received:', data);
          // Clear entire localStorage
          localStorage.clear();
          setIsLoggedIn(false);
          // Disconnect socket
          SocketService.disconnect();
          // Dispatch event to notify other components of logout
          window.dispatchEvent(new Event('loginStateChanged'));
          
          // Show message with reason
          Swal.fire({
            title: 'Session Ended',
            text: data.reason || 'Your session has been ended. Please login again.',
            icon: 'info',
            confirmButtonText: 'OK',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            // Redirect to home page after logout
            window.location.hash = '#/home';
          });
        };

        SocketService.onForceLogout(handleForceLogout);

        // Cleanup listener on unmount or when logged out
        return () => {
          SocketService.removeForceLogoutListener();
        };
      }
    }, [isLoggedIn]);

    // Listen for order confirmation events (when admin confirms order)
    useEffect(() => {
      if (isLoggedIn) {
        const handleOrderConfirmed = (data) => {
          console.log('Order confirmed received:', data);
          const orderData = data.order || {};
          const message = data.message || `Your order ${orderData.orderNo || orderData.orderId} has been confirmed. You can now submit payment.`;
          
          // Show success notification
          Swal.fire({
            title: 'Order Confirmed!',
            text: message,
            icon: 'success',
            confirmButtonText: 'View Orders',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            // Redirect to orders page
            const redirectPath = data.redirectTo || '/order';
            window.location.hash = `#${redirectPath}`;
          });
        };

        SocketService.onOrderConfirmed(handleOrderConfirmed);

        // Cleanup listener on unmount or when logged out
        return () => {
          SocketService.removeOrderConfirmedListener();
        };
      }
    }, [isLoggedIn]);

    // Listen for negotiation events (when admin responds to negotiation)
    useEffect(() => {
      if (isLoggedIn) {
        const handleNegotiationEvent = (data) => {
          console.log('Negotiation event received:', data);
          
          // Check if this is an admin-initiated event (admin responding to customer)
          const fromUserType = data?.FromUserType || data?.fromUserType || data?.userType;
          const type = data?.type || data?.eventType;
          
          // Only redirect if it's from admin (counter_offer, bid_accepted, bid_rejected)
          if (fromUserType === 'Admin' || type === 'counter_offer' || type === 'bid_accepted' || type === 'bid_rejected') {
            // Show notification
            const message = data.message || '📬 New negotiation update';
            let icon = 'info';
            if (type === 'bid_accepted') icon = 'success';
            else if (type === 'bid_rejected') icon = 'error';
            
            Swal.fire({
              title: 'Negotiation Update',
              text: message,
              icon: icon,
              confirmButtonText: 'View Negotiations',
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then(() => {
              // Redirect to negotiations page
              const redirectPath = data.redirectTo || '/bidding';
              window.location.hash = `#${redirectPath}`;
            });
          }
        };

        SocketService.onNegotiationNotification(handleNegotiationEvent);
        SocketService.onNegotiationBroadcast(handleNegotiationEvent);
        SocketService.onNegotiationUpdate(handleNegotiationEvent);

        // Cleanup listeners on unmount or when logged out
        return () => {
          // Note: SocketService doesn't have remove methods for negotiation listeners
          // They will be cleaned up when socket disconnects
        };
      }
    }, [isLoggedIn]);

    return (
      <HashRouter>
        <CurrencyProvider>
          <AppContent 
            isLoggedIn={isLoggedIn} 
            handleLogout={handleLogout} 
            handleLogin={handleLogin}
          />
        </CurrencyProvider>
      </HashRouter>
    );
  };

export default App;
