import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Pages
import Home from './pages/Home';
import Tests from './pages/Tests';
import Packages from './pages/Packages';
import Booking from './pages/Booking';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import DeliveryRegister from './pages/DeliveryRegister';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import DeliveryDashboard from './pages/DeliveryDashboard';
import OTPVerify from './pages/OTPVerify';
import ForgotPassword from './pages/ForgotPassword';
import { PrivacyPolicy, TermsAndConditions, RefundPolicy, ContactUs } from './pages/Legal';
import ReferralPage from './pages/Referral';
import KnowledgeCenter from './pages/KnowledgeCenter';

const ProtectedRoute = ({ children, adminOnly = false, deliveryOnly = false }: { children: React.ReactNode, adminOnly?: boolean, deliveryOnly?: boolean }) => {
  const { user, profile, loading, isAdmin, isDelivery } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  if (deliveryOnly && !isDelivery) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/delivery" element={<DeliveryRegister />} />
          <Route path="/verify-email" element={<OTPVerify />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/knowledge" element={<KnowledgeCenter />} />
          
          <Route path="/referral" element={
            <ProtectedRoute>
              <ReferralPage />
            </ProtectedRoute>
          } />
          
          <Route path="/booking" element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/delivery" element={
            <ProtectedRoute deliveryOnly>
              <DeliveryDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
