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
import CartPage from "./components/ReadyStockPage/CartPage";
import CheckoutPage from "./components/ReadyStockPage/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import Order from "./components/Order";
import { AuthService } from "./services/auth/auth.services";
import FlashDeals from "./components/ReadyStockPage/FlashDeals";
import WishlistPage from "./pages/WishlistPage";
import { CurrencyProvider } from "./context/CurrencyContext";

// Route guard: redirects unauthenticated users to login with returnTo
const ProtectedRoute = ({ children, isLoggedIn }) => {
  if (!isLoggedIn) {
    const currentPath = window.location.hash.replace('#', '') || '/home';
    const returnTo = encodeURIComponent(currentPath);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Check profile completion for Google users on protected routes (except profile page)
  const currentPath = window.location.hash.replace('#', '');
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
      if (userData && userData.platformName === 'google') {
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
  
  // Hide header only on login, signup, verify-email, and reset-password pages
  const hideHeader = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/verify-email') || location.pathname.startsWith('/reset-password');

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
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignUpForm />} />{" "}
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
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
              path="/wishlist"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Layout><WishlistPage /></Layout>
                </ProtectedRoute>
              }
            />
            {/* Fallback to Home for unknown routes */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
        
        {!hideHeader && <Footer />}
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

    const handleLogout = () => {
      // Clear entire localStorage
      localStorage.clear();
      setIsLoggedIn(false);
      // Dispatch event to notify other components of logout
      window.dispatchEvent(new Event('loginStateChanged'));
      // Redirect to home page after logout
      window.location.hash = '#/home';
    };

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
