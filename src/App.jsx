// import React from "react";
// import Header from "./components/Header";
// import NavTabs from "./components/NavTabs";
// import MainContent from "./components/MainContent";
// import "./App.css";

// const App = () => {
//   return (
//     <div className="bg-gray-50">
//       <Header />
//       <NavTabs />
//       <MainContent />
//     </div>
//   );
// };

// export default App;

// App.js
// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./components/Header";
// import NavTabs from "./components/NavTabs";
// import MainContent from "./components/MainContent";
// import "./App.css";
// import ProductDetails from "./components/ProductDetails";

// const App = () => {
//   return (
//     <Router>
//       <div className="bg-gray-50">
//         <Header />
//         <NavTabs />
//         <Routes>
//           <Route path="/" element={<MainContent />} />
//           <Route path="/product/:id" element={<ProductDetails />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// };

// export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import MainContent from "./components/ReadyStockPage/MainContent";
import "./App.css";
import ProductDetails from "./components/ReadyStockPage/ProductDetails";
import BiddingContent from "./components/BiddingPage/BiddingContent";
import ProfilePage from "./pages/ProfilePage";
// import FlashDealsPage from "./components/FlashDealsPage/FlashDealsPage";
// import WatchlistPage from "./components/WatchlistPage/WatchlistPage";

const App = () => {
  return (
    <Router>
      <div className="bg-[#f5f5f7]">
        <Header />
        <NavTabs />
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/bidding" element={<BiddingContent />} />
          {/* <Route path="/flash-deals" element={<FlashDealsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} /> */}
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

// import React, { useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import Header from "./components/Header";
// import NavTabs from "./components/NavTabs";
// import MainContent from "./components/ReadyStockPage/MainContent";
// import "./App.css";
// import ProductDetails from "./components/ReadyStockPage/ProductDetails";
// import BiddingContent from "./components/BiddingPage/BiddingContent";
// import LoginForm from "./components/LoginForm";
// import SignUpForm from "./components/SignUpForm"; // Import the SignUpForm component

// const App = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(
//     localStorage.getItem("isLoggedIn") === "true"
//   );

//   const handleLogin = () => {
//     localStorage.setItem("isLoggedIn", "true");
//     setIsLoggedIn(true);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("isLoggedIn");
//     setIsLoggedIn(false);
//   };

//   const ProtectedRoute = ({ children }) => {
//     if (!isLoggedIn) {
//       return <Navigate to="/login" replace />;
//     }
//     return children;
//   };

//   return (
//     <Router>
//       <div className="bg-gray-50">
//         {isLoggedIn && (
//           <>
//             <Header onLogout={handleLogout} />
//             <NavTabs />
//           </>
//         )}

//         <Routes>
//           {/* Public Routes */}
//           <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
//           <Route path="/signup" element={<SignUpForm />} />{" "}
//           {/* Add this route */}
//           {/* Protected Routes */}
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <MainContent />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/product/:id"
//             element={
//               <ProtectedRoute>
//                 <ProductDetails />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/bidding"
//             element={
//               <ProtectedRoute>
//                 <BiddingContent />
//               </ProtectedRoute>
//             }
//           />
//           {/* Redirect to login if no matching route */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// };

// export default App;
