/**
 * Main App Component
 * Routes and layout management
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { setReferralSource } from './utils/tracking';

// Pages
import Homepage from './pages/Homepage';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import MyTickets from './pages/MyTickets';
import SupportCenter from './pages/SupportCenter';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import SummerPromo from './pages/SummerPromo';
import BlackFridayPromo from './pages/BlackFridayPromo';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center px-5 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" />;
  }

  return children;
};

// Admin Protected Route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center px-5 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
      </div>
    );
  }

  return isAuthenticated && isAdmin ? children : <Navigate to="/" />;
};

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setReferralSource();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center px-5 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border-dark border-t-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && isAdmin && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/promo/summer" element={<SummerPromo />} />
        <Route path="/promo/black-friday" element={<BlackFridayPromo />} />

        {/* Protected Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-confirmation/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <SupportCenter />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
