import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreateWebsitePage from './pages/CreateWebsitePage';
import LoginPage from './pages/LoginPage';
import SignupModal from './components/SignupModal';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import LiveOrderTicker from './components/LiveOrderTicker';
import './App.css';

const AppContent = ({ openSignup, openLogin, showToast }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && <Navbar onOpenSignup={openSignup} onOpenLogin={openLogin} />}

      <Routes>
        <Route
          path="/"
          element={<HomePage onOpenSignup={openSignup} onShowToast={showToast} />}
        />
        <Route
          path="/create-website"
          element={<CreateWebsitePage onOpenSignup={openSignup} onShowToast={showToast} />}
        />
        <Route
          path="/login"
          element={<LoginPage onShowToast={showToast} />}
        />
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="*"
          element={<HomePage onOpenSignup={openSignup} onShowToast={showToast} />}
        />
      </Routes>

      {!isDashboard && <Footer />}
      {!isDashboard && <LiveOrderTicker onOpenSignup={openSignup} />}
    </>
  );
};

// FoodyPay App Entry Point
function App() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Free');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('foodypay-theme');
  }, []);

  const openSignup = (plan = 'Free') => {
    setSelectedPlan(plan);
    setSignupOpen(true);
  };

  const closeSignup = () => setSignupOpen(false);
  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

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
        <AppContent openSignup={openSignup} openLogin={openLogin} showToast={showToast} />

        <SignupModal
          isOpen={signupOpen}
          onClose={closeSignup}
          selectedPlan={selectedPlan}
        />

        <LoginModal
          isOpen={loginOpen}
          onClose={closeLogin}
          onShowToast={showToast}
          onSwitchToSignup={() => openSignup('Free')}
        />

        <Toast message={toastMessage} isVisible={toastVisible} />
      </div>
    </BrowserRouter>
  );
}

export default App;
