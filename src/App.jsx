import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
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

  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="bg-gray-50">
        {isLoggedIn && (
          <>
            <Header onLogout={handleLogout} />
            <NavTabs />
          </>
        )}

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUpForm />} />{" "}
          <Route path="/verify-email" element={<VerifyEmailPrompt />} />
          <Route path="/api/customer/verify-email/:token" element={<VerifyEmail />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          {/* Add this route */}
          {/* Protected Routes */}
          <Route
            path="/ready-stock"
            element={
              <ProtectedRoute>
                <MainContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          {/* Redirect root to appropriate page */}
          <Route
            path="/"
            element={<Navigate to={isLoggedIn ? "/ready-stock" : "/login"} replace />}
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bidding"
            element={
              <ProtectedRoute>
                <BiddingContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect to login if no matching route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
