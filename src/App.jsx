import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  HashRouter,
} from "react-router-dom";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import Footer from "./components/Footer";
import MainContent from "./components/ReadyStockPage/MainContent";
import "./App.css";
import ProductDetails from "./components/ReadyStockPage/ProductDetails";
import BiddingContent from "./components/BiddingPage/BiddingContent";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";
import VerifyEmailPrompt from "./components/VerifyEmailPrompt";
import VerifyEmail from "./components/VerifyEmail";
import CartPage from "./components/ReadyStockPage/CartPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import Order from "./components/Order";
import { AuthService } from "./services/auth/auth.services";
import FlashDeals from "./components/ReadyStockPage/FlashDeals";

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

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <>
          <Header onLogout={handleLogout} />
          <NavTabs />
        </>

        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignUpForm />} />{" "}
            <Route path="/verify-email" element={<VerifyEmailPrompt />} />
            <Route path="/api/customer/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/customer/:token" element={<VerifyEmail />} />
            {/* Public pages (browsable without login) */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/ready-stock" element={<MainContent />} />
            <Route path="/flash-deals" element={<FlashDeals />} />
            {/* Profile remains protected */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            {/* Default root to Home for all users */}
            <Route path="/" element={<Navigate to="/home" replace /> } />
            {/* Restricted actions require login */}
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bidding"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <BiddingContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Order />
                </ProtectedRoute>
              }
            />
            {/* Fallback to Home for unknown routes */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
