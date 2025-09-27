import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  HashRouter,
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
import Order from "./components/Order";

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
    <HashRouter>
      <div className="">
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
          <Route path="/customer/:token" element={<VerifyEmail />} />
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
          <Route
            path="/order"
            element={
              <ProtectedRoute>
                <Order />
              </ProtectedRoute>
            }
          />
          {/* Redirect to login if no matching route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
