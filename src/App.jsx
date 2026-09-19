import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CreateWebsitePage from './pages/CreateWebsitePage';
import LoginPage from './pages/LoginPage';
import SignupModal from './components/SignupModal';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import LiveOrderTicker from './components/LiveOrderTicker';
import './App.css';

// FoodyPay App Entry Point
function App() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Free');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    // Permanently set light theme matching the Warm Orange & White logo branding
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('foodypay-theme');
  }, []);

  const openSignup = (plan = 'Free') => {
    setSelectedPlan(plan);
    setSignupOpen(true);
  };

  const closeSignup = () => {
    setSignupOpen(false);
  };

  const openLogin = () => {
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
  };

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
        <Navbar onOpenSignup={openSignup} onOpenLogin={openLogin} />

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
            path="*"
            element={<HomePage onOpenSignup={openSignup} onShowToast={showToast} />}
          />
        </Routes>

        <Footer />

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

        <LiveOrderTicker onOpenSignup={openSignup} />
      </div>
    </BrowserRouter>
  );
}

export default App;
