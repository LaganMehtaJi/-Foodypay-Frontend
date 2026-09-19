import React, { useState, useEffect } from 'react';

export default function LoginModal({ isOpen, onClose, onShowToast, onSwitchToSignup }) {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneOrEmail('');
      setPin('');
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (!phoneOrEmail.trim()) {
      setError('Please enter your registered phone or email.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError('Please enter your 4-digit security PIN or password.');
      return;
    }

    setError('');
    setIsSuccess(true);
    if (onShowToast) {
      onShowToast(`👋 Welcome back! Logged in as ${phoneOrEmail.trim()}`);
    }

    setTimeout(() => {
      onClose();
    }, 1600);
  };

  const handleQuickDemoLogin = () => {
    setPhoneOrEmail('9876543210');
    setPin('1234');
    setError('');
    setIsSuccess(true);
    if (onShowToast) {
      onShowToast("👋 Welcome back to Sharma's Kitchen POS!");
    }
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog login-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {!isSuccess ? (
          <div>
            <span className="chip">🔐 Restaurant Portal</span>
            <h3>Login to FoodyPay</h3>
            <p className="modal-sub">
              Access your live Kitchen KDS, billing ledger, table QR settings &amp; online orders.
            </p>

            <form onSubmit={handleLogin}>
              <label className="field">
                Registered Phone / Email
                <input
                  type="text"
                  placeholder="e.g. 98765 43210 or cafe@foodypay.in"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  autoFocus
                  required
                />
              </label>

              <label className="field">
                POS PIN / Password
                <input
                  type="password"
                  maxLength={8}
                  placeholder="4-digit PIN (e.g. 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </label>

              {error && <div className="hint error-text">{error}</div>}

              <button
                type="submit"
                className="btn primary"
                style={{ width: '100%', marginTop: '12px' }}
              >
                🔐 Sign In to Dashboard
              </button>

              <div className="login-quick-demo-box">
                <span className="quick-demo-divider">OR</span>
                <button
                  type="button"
                  className="btn small full-w demo-fill-btn"
                  onClick={handleQuickDemoLogin}
                >
                  ⚡ One-Click Demo Login (Sharma's Kitchen)
                </button>
              </div>

              <div className="modal-switch-text">
                New to FoodyPay?{' '}
                <button
                  type="button"
                  className="link-btn-text"
                  onClick={() => {
                    onClose();
                    if (onSwitchToSignup) onSwitchToSignup('Free');
                  }}
                >
                  Request for create Account →
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="login-success-box">
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✓</div>
            <h3>Authentication Verified!</h3>
            <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
              Redirecting you to your restaurant's live command center &amp; station telemetry...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
