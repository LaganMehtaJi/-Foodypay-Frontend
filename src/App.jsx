import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreateWebsitePage from './pages/CreateWebsitePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import AdminDebugPage from './pages/AdminDebugPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import DeliveryPartnerPage from './pages/DeliveryPartnerPage';
import CrmPortalPage from './pages/CrmPortalPage';
import LegalPolicyPage from './pages/LegalPolicyPage';
import PartnerLoginPage from './pages/PartnerLoginPage';
import PartnerPortalPage from './pages/PartnerPortalPage';
import MerchantAdminPage from './pages/MerchantAdminPage';
import Toast from './components/Toast';
import LiveOrderTicker from './components/LiveOrderTicker';
import './App.css';

const AppContent = ({ showToast }) => {
  const navigate = useNavigate();

  const handleOpenSignup = () => {
    navigate('/register');
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<CustomerMenuPage onShowToast={showToast} />}
        />
        <Route
          path="/saas-landing"
          element={<HomePage onOpenSignup={handleOpenSignup} onShowToast={showToast} />}
        />
        <Route
          path="/crm"
          element={<CrmPortalPage />}
        />
        <Route
          path="/terms"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/terms-and-conditions"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/privacy"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/privacy-policy"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/refunds"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/refund-policy"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/about"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/about-us"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/blog"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/blogs"
          element={<LegalPolicyPage />}
        />
        <Route
          path="/create-website"
          element={<CreateWebsitePage onOpenSignup={handleOpenSignup} onShowToast={showToast} />}
        />
        <Route
          path="/login"
          element={<LoginPage onShowToast={showToast} />}
        />
        <Route
          path="/partner-login"
          element={<PartnerLoginPage onShowToast={showToast} />}
        />
        <Route
          path="/partner"
          element={<PartnerPortalPage onShowToast={showToast} />}
        />
        <Route
          path="/partner-portal"
          element={<PartnerPortalPage onShowToast={showToast} />}
        />
        <Route
          path="/signup"
          element={<SignupPage onShowToast={showToast} />}
        />
        <Route
          path="/register"
          element={<SignupPage onShowToast={showToast} />}
        />
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="/merchant-admin"
          element={<MerchantAdminPage onShowToast={showToast} />}
        />
        <Route
          path="/merchantadmin"
          element={<MerchantAdminPage onShowToast={showToast} />}
        />
        <Route
          path="/Admin"
          element={<AdminDebugPage onShowToast={showToast} />}
        />
        <Route
          path="/admin"
          element={<AdminDebugPage onShowToast={showToast} />}
        />
        <Route
          path="/AdminDebug"
          element={<AdminDebugPage onShowToast={showToast} />}
        />
        <Route
          path="/admin-debug"
          element={<AdminDebugPage onShowToast={showToast} />}
        />

        <Route
          path="/:restaurantSlug/:merchantId/KitchenDisplaySystem"
          element={<KitchenDisplayPage onShowToast={showToast} />}
        />
        <Route
          path="/:restaurantSlug/:merchantId/kds"
          element={<KitchenDisplayPage onShowToast={showToast} />}
        />
        <Route
          path="/KitchenDisplaySystem"
          element={<KitchenDisplayPage onShowToast={showToast} />}
        />
        <Route
          path="/kds"
          element={<KitchenDisplayPage onShowToast={showToast} />}
        />
        <Route
          path="/:restaurantSlug/:merchantId/delivery"
          element={<DeliveryPartnerPage onShowToast={showToast} />}
        />
        <Route
          path="/:restaurantSlug/:merchantId/delivery-partner"
          element={<DeliveryPartnerPage onShowToast={showToast} />}
        />
        <Route
          path="/delivery"
          element={<DeliveryPartnerPage onShowToast={showToast} />}
        />
        <Route
          path="/delivery-partner"
          element={<DeliveryPartnerPage onShowToast={showToast} />}
        />
        <Route
          path="/:restaurantSlug/:merchantId/:tableId"
          element={<CustomerMenuPage onShowToast={showToast} />}
        />
        <Route
          path="/:restaurantSlug/:merchantId"
          element={<CustomerMenuPage onShowToast={showToast} />}
        />
        <Route
          path="*"
          element={<HomePage onOpenSignup={handleOpenSignup} onShowToast={showToast} />}
        />
      </Routes>
    </>
  );
};

// FoodyPay App Entry Point
function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('foodypay-theme');

    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 900);

    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  return (
    <BrowserRouter>
      {showSplash && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0F172A',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            opacity: splashFading ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: splashFading ? 'none' : 'auto'
          }}
        >
          {/* Uncut, perfectly proportioned FoodyPay Logo */}
          <div
            style={{
              maxWidth: '320px',
              width: '85%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 24px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '28px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)'
            }}
          >
            <img
              src="/Logo.png"
              alt="FoodyPay Logo"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '110px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Smooth PWA Loading Line */}
          <div
            style={{
              width: '160px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#FF5E14',
                borderRadius: '4px',
                width: '100%',
                animation: 'pwaProgressAnim 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
            />
          </div>

          <div style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 700, marginTop: '14px', letterSpacing: '0.04em' }}>
            Instant Food Ordering &amp; POS Console
          </div>
        </div>
      )}

      <div className="app-layout">
        <AppContent showToast={showToast} />
        <Toast message={toastMessage} isVisible={toastVisible} />
      </div>
    </BrowserRouter>
  );
}

export default App;
