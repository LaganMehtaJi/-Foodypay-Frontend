import React, { useState, useEffect, useRef } from 'react';



const STORAGE_KEY = 'foodypay_live_orders_count';
const DEFAULT_START_COUNT = 1428500;

export default function HighVelocityBanner({ onOpenSignup }) {
  const [orderCount, setOrderCount] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch  {}
    return DEFAULT_START_COUNT;
  });

  const [currentRate, setCurrentRate] = useState(22);
  const [isUiBuzzing, setIsUiBuzzing] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState(null);

  const celebrationTimerRef = useRef(null);

  // Trigger celebration routine (Disabled per user request)
  const triggerCelebration = (milestoneNumber, total) => {
    // Disabled celebration popup and fanfare sound per user request
    return;
  };

  // Interval to add 10 to 30 orders every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random number between 10 and 30
      const delta = Math.floor(Math.random() * 21) + 10;
      setCurrentRate(delta);

      setOrderCount((prev) => {
        const next = prev + delta;
        try {
          localStorage.setItem(STORAGE_KEY, next.toString());
        } catch  {}

        const prevMilestone = Math.floor(prev / 5000);
        const nextMilestone = Math.floor(next / 5000);

        if (nextMilestone > prevMilestone) {
          triggerCelebration(nextMilestone * 5000, next);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // Testing Button: Immediately trigger 5,000 orders celebration
  const handleNotifyTestClick = (e) => {
    e.stopPropagation();
    const jump = 5000;
    const newTotal = orderCount + jump;
    setOrderCount(newTotal);
    try {
      localStorage.setItem(STORAGE_KEY, newTotal.toString());
    } catch  {}
    triggerCelebration(newTotal, newTotal);
  };

  const handleClaimFreePlan = () => {
    setCelebrationModal(null);
    const pricing = document.getElementById('pricing');
    if (pricing) {
      pricing.scrollIntoView({ behavior: 'smooth' });
    }
    if (onOpenSignup) {
      onOpenSignup('Free');
    }
  };

  return (
    <>
      {/* HIGH VELOCITY MILESTONE PILL IN HERO */}
      <div className={`live-orders-milestone-pill ${isUiBuzzing ? 'ui-buzz-active' : ''}`}>
        <span className="live-orders-pulse-dot" />
        <span className="live-orders-badge">HIGH VELOCITY</span>

        <span className="live-orders-text">
          In every minute food orders are placed and managed by FoodyPay
        </span>

        {/* LIVE TICKING ORDERS COUNTER */}
        <div className="live-counter-inline-box" title="Live orders placed in real-time">
          <span className="live-counter-num">
            {orderCount.toLocaleString('en-IN')}
          </span>
          <span className="live-counter-rate">
            +{currentRate}/s
          </span>
        </div>
      </div>

      {/* CONGRATULATIONS 5,000 ORDERS CELEBRATION MODAL */}
      {celebrationModal && (
        <div className="milestone-celebration-backdrop" onClick={() => setCelebrationModal(null)}>
          <div
            className="milestone-celebration-card"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-live="assertive"
          >
            <button
              type="button"
              className="celebration-close-btn"
              onClick={() => setCelebrationModal(null)}
              aria-label="Dismiss celebration"
            >
              ×
            </button>

            <div className="celebration-badge-top">
              <span className="celebration-sparkle"></span>
              <span>CONGRATULATIONS!</span>
              <span className="celebration-sparkle"></span>
            </div>

            <h3 className="celebration-heading">
              5,000 New Orders Placed &amp; Managed!
            </h3>

            <p className="celebration-subtext">
              Another <strong>5,000+ orders</strong> just processed seamlessly across restaurants using the FoodyPay POS &amp; QR platform.
            </p>

            <div className="celebration-stat-box">
              <div className="stat-label">TOTAL ORDERS MANAGED RIGHT NOW</div>
              <div className="stat-value">{celebrationModal.total.toLocaleString('en-IN')}</div>
              <div className="stat-tag"> Scaling at high velocity across 1,200+ outlets</div>
            </div>

            <div className="celebration-actions-row">
              <button
                type="button"
                className="btn primary celebration-cta-btn"
                onClick={handleClaimFreePlan}
              >
                 Get Started Free Plan →
              </button>
              <button
                type="button"
                className="btn celebration-dismiss-btn"
                onClick={() => setCelebrationModal(null)}
              >
                Awesome!
              </button>
            </div>

            {/* PROGRESS BAR TO AUTO-DISMISS */}
            <div className="celebration-timer-bar">
              <div className="celebration-timer-fill" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
