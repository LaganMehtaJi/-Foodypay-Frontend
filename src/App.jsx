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
          element={<HomePage onOpenSignup={handleOpenSignup} onShowToast={showToast} />}
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('foodypay-theme');
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
      <div className="app-layout">
        <AppContent showToast={showToast} />
        <Toast message={toastMessage} isVisible={toastVisible} />
      </div>
    </BrowserRouter>
  );
}

export default App;
