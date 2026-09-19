import React, { useState, useEffect, useRef } from 'react';

const INDIAN_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Kabir Mehta',
  'Vikram Malhotra', 'Ishita Sen', 'Aditya Joshi', 'Neha Reddy', 'Arjun Kapoor',
  'Diya Nair', 'Sneha Kulkarni', 'Rajesh Gupta', 'Pooja Bhatt', 'Aryan Singhania',
  'Meera Chawla', 'Kunal Deshmukh', 'Tanvi Saxena', 'Siddharth Rao', 'Bhavna Menon',
  'Devansh Mishra', 'Rhea Mukherjee', 'Karan Oberoi', 'Tara Pillai', 'Harsh Goel'
];

const AUS_NAMES = [
  'Jack Miller', 'Chloe Wilson', 'Liam Smith', 'Oliver Brown', 'Matilda Taylor',
  'Lachlan Jones', 'Sophie Davis', 'Ethan White', 'Emma Clark', 'Cooper Hall',
  'Harper Evans', 'Noah Walker', 'Isla Robinson', 'Lucas Wright', 'Mia Thompson',
  'Charlotte King', 'Henry Campbell', 'Grace Edwards', 'Archie Stewart', 'Ruby Kelly',
  'Harrison Scott', 'Zoe Mitchell', 'Leo Phillips', 'Ella Turner', 'Oscar Adams'
];

const CITIES = [
  { city: 'Mumbai', country: 'IN', flag: '🇮🇳' },
  { city: 'Melbourne', country: 'AU', flag: '🇦🇺' },
  { city: 'Bengaluru', country: 'IN', flag: '🇮🇳' },
  { city: 'Sydney', country: 'AU', flag: '🇦🇺' },
  { city: 'Delhi NCR', country: 'IN', flag: '🇮🇳' },
  { city: 'Brisbane', country: 'AU', flag: '🇦🇺' },
  { city: 'Hyderabad', country: 'IN', flag: '🇮🇳' },
  { city: 'Perth', country: 'AU', flag: '🇦🇺' },
  { city: 'Pune', country: 'IN', flag: '🇮🇳' },
  { city: 'Adelaide', country: 'AU', flag: '🇦🇺' },
  { city: 'Chennai', country: 'IN', flag: '🇮🇳' },
  { city: 'Gold Coast', country: 'AU', flag: '🇦🇺' }
];

const FOOD_ITEMS = [
  { item: 'Masala Dosa & South Filter Coffee', bill: '₹190' },
  { item: 'Paneer Butter Masala + Garlic Naan (2)', bill: '₹360' },
  { item: 'Hyderabadi Chicken Dum Biryani & Mirchi Salan', bill: '₹340' },
  { item: 'Aussie Angus Wagyu Burger with Golden Chips', bill: 'A$24 (₹1,320)' },
  { item: 'Woodfired Truffle Mushroom Pizza', bill: 'A$22 (₹1,210)' },
  { item: 'Sourdough Avo Smash & Double Shot Flat White', bill: 'A$18 (₹990)' },
  { item: 'Tandoori Chicken Tikka with Mint Chutney', bill: '₹380' },
  { item: 'Crispy Barramundi Fish & Chips with Tartare Sauce', bill: 'A$26 (₹1,430)' },
  { item: 'Delhi Special Chole Bhature with Sweet Lassi', bill: '₹210' },
  { item: 'Organic Acai Superfood Bowl & Green Smoothie', bill: 'A$17 (₹935)' },
  { item: 'Butter Chicken Rice Bowl with Gulab Jamun', bill: '₹299' },
  { item: 'Classic Aussie Beef Mince Pie & Potato Wedges', bill: 'A$14 (₹770)' },
  { item: 'Loaded Cheesy Nachos & Fresh Lime Soda', bill: '₹240' },
  { item: 'Grilled Salmon Bowl with Quinoa Salad', bill: 'A$28 (₹1,540)' },
  { item: 'Dal Makhani Combo with Butter Roti', bill: '₹220' }
];

export default function LiveOrderTicker({ onOpenSignup }) {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const dismissTimerRef = useRef(null);
  const nextIntervalRef = useRef(null);

  const generateRandomOrder = () => {
    const isIndian = Math.random() > 0.5;
    const nameList = isIndian ? INDIAN_NAMES : AUS_NAMES;
    const cityList = CITIES.filter((c) => (isIndian ? c.country === 'IN' : c.country === 'AU'));

    const randomName = nameList[Math.floor(Math.random() * nameList.length)];
    const randomCity = cityList[Math.floor(Math.random() * cityList.length)];
    const randomFood = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)];
    const tableNo = Math.floor(Math.random() * 24) + 1;
    const orderSeconds = Math.floor(Math.random() * 8) + 2;

    return {
      name: randomName,
      city: randomCity.city,
      flag: randomCity.flag,
      tableNo,
      item: randomFood.item,
      bill: randomFood.bill,
      timeAgo: `${orderSeconds}s ago`
    };
  };

  const showNotification = () => {
    setNotification(generateRandomOrder());
    setIsExpanded(false);
    setIsPaused(false);
    setProgressKey((prev) => prev + 1);
    setIsVisible(true);

    // Auto-dismiss after exactly 3 seconds
    clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    setIsVisible(false);
    setIsExpanded(false);
    clearTimeout(dismissTimerRef.current);

    // Wait 10 seconds before next notification
    clearTimeout(nextIntervalRef.current);
    nextIntervalRef.current = setTimeout(() => {
      showNotification();
    }, 10000);
  };

  useEffect(() => {
    // First notification appears after 10 seconds
    const startTimer = setTimeout(() => {
      showNotification();
    }, 10000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(dismissTimerRef.current);
      clearTimeout(nextIntervalRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    // Pause auto-dismiss timer on hover
    setIsPaused(true);
    clearTimeout(dismissTimerRef.current);
  };

  const handleMouseLeave = () => {
    // Resume auto-dismiss if not manually expanded
    setIsPaused(false);
    if (!isExpanded) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        hideNotification();
      }, 1500); // give 1.5s grace after unhover
    }
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
      // Stop timer while user reads expanded content
      clearTimeout(dismissTimerRef.current);
    } else {
      setIsExpanded(false);
      // Auto dismiss 2 seconds after collapsing
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        hideNotification();
      }, 2000);
    }
  };

  const handleCtaClick = (e) => {
    e.stopPropagation();
    hideNotification();
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
    onOpenSignup('Free');
  };

  if (!notification) return null;

  return (
    <div
      className={`live-order-ticker-wrapper ${isVisible ? 'show' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`ticker-card compact-eye-catcher ${isExpanded ? 'expanded' : ''}`}>
        {/* DISMISS BUTTON */}
        <button
          type="button"
          className="ticker-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            hideNotification();
          }}
          aria-label="Dismiss notification"
        >
          ×
        </button>

        {/* EYE-CATCHING TOP ROW */}
        <div className="ticker-top-row">
          <div className="ticker-live-indicator">
            <span className="live-pulsing-circle" />
            <span className="live-label">LIVE ORDER</span>
          </div>
          <span className="ticker-time">{notification.timeAgo}</span>
        </div>

        {/* SHORT / COMPACT BODY: ONLY USER NAME, BILL, AND LOCATION */}
        <div className="ticker-short-body">
          <div className="ticker-avatar-circle" title={notification.city}>
            {notification.flag}
          </div>

          <div className="ticker-short-details">
            <div className="ticker-customer-name">
              <strong>{notification.name}</strong>
            </div>
            <div className="ticker-location-row">
              <span className="ticker-city-label">📍 {notification.city}</span>
              <span className="ticker-dot-sep">·</span>
              <span className="ticker-table-label">Table {notification.tableNo}</span>
            </div>
          </div>

          <div className="ticker-short-bill">
            <span className="ticker-bill-pill">
              {notification.bill}
            </span>
          </div>
        </div>

        {/* SHOW MORE TOGGLE BUTTON */}
        <div className="ticker-show-more-row">
          <button
            type="button"
            className="ticker-show-more-btn"
            onClick={handleToggleExpand}
          >
            {isExpanded ? 'Show less ▴' : 'Show more ▾'}
          </button>
        </div>

        {/* EXPANDABLE DETAILS: ITEMS, SETTLEMENT, AND CTA */}
        {isExpanded && (
          <div className="ticker-expanded-content">
            <div className="ticker-expanded-divider" />
            <div className="ticker-food-desc">
              🍽️ Ordered: <span>{notification.item}</span>
            </div>
            <div className="ticker-bill-badge">
              ⚡ Bill Paid: <b>{notification.bill}</b> via FoodyPay QR
            </div>

            <div className="ticker-cta-banner">
              <div className="cta-left-text">
                <span>Want to easily manage 1,000+ orders?</span>
              </div>
              <button
                type="button"
                className="cta-action-pill"
                onClick={handleCtaClick}
              >
                Get Started Free Plan →
              </button>
            </div>
          </div>
        )}

        {/* 3-SECOND COUNTDOWN PROGRESS BAR */}
        {!isExpanded && (
          <div className="ticker-progress-track">
            <div
              key={progressKey}
              className={`ticker-progress-bar ${isPaused ? 'paused' : ''}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

