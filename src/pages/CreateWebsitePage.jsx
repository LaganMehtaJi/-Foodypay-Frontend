import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration, playOrderPlaced } from '../utils/soundEffects';

const INITIAL_ITEMS = [
  {
    id: 1,
    category: 'Bestsellers',
    name: 'Special Masala Dosa',
    price: 130,
    desc: 'Crispy golden crepe filled with tempered spiced potatoes, served with coconut chutney & sambar',
    isVeg: true,
    img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=320&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    category: 'Bestsellers',
    name: 'Dum Biryani Feast',
    price: 260,
    desc: 'Slow-cooked aromatic basmati rice layered with caramelized onions, saffron & mint raita',
    isVeg: true,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=320&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    category: 'Beverages',
    name: 'Artisan Cold Coffee',
    price: 110,
    desc: 'Double espresso blended with chilled vanilla cream & dark chocolate drizzle',
    isVeg: true,
    img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=320&auto=format&fit=crop&q=80'
  }
];

export default function CreateWebsitePage() {
  const [step, setStep] = useState(1);

  // Step 1: Restaurant Details
  const [restaurantName, setRestaurantName] = useState("Sharma's Kitchen & Cafe");
  const [businessType, setBusinessType] = useState('Cafe & Dine-In');
  const [tagline, setTagline] = useState('Fresh Handcrafted Meals & Coffee');
  const [city, setCity] = useState('Connaught Place, Delhi');
  const [phone, setPhone] = useState('9876543210');
  const [themeColor, setThemeColor] = useState('#FF5E14');

  // Step 2: Categories & Food Items
  const [categories, setCategories] = useState(['Bestsellers', 'Beverages', 'Main Course', 'Desserts']);
  const [activeCategory, setActiveCategory] = useState('Bestsellers');
  const [items, setItems] = useState(INITIAL_ITEMS);

  // New Item Input State
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newCatInput, setNewCatInput] = useState('');
  const [itemError, setItemError] = useState('');

  // Step 3: Launch State
  const [isLive, setIsLive] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customerCart, setCustomerCart] = useState({});

  const storeSlug = (restaurantName || 'my-restaurant')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const storeUrl = `https://foodypay.in/store/${storeSlug || 'store'}`;

  // Step 2 Handlers:
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setActiveCategory(trimmed);
    }
    setNewCatInput('');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setItemError('Please enter a dish name.');
      return;
    }
    const priceNum = parseFloat(newItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setItemError('Please enter a valid price in ₹.');
      return;
    }

    setItemError('');
    const newItem = {
      id: Date.now(),
      category: activeCategory,
      name: newItemName.trim(),
      price: priceNum,
      desc: newItemDesc.trim() || 'Freshly prepared signature dish made to order.',
      isVeg: newItemIsVeg,
      img: newItemIsVeg
        ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=320&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=320&auto=format&fit=crop&q=80'
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleLoadSampleDishes = () => {
    setItems([
      ...items,
      {
        id: Date.now() + 1,
        category: 'Main Course',
        name: 'Paneer Butter Masala',
        price: 240,
        desc: 'Cottage cheese cubes tossed in a creamy spiced tomato gravy',
        isVeg: true,
        img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=320&auto=format&fit=crop&q=80'
      },
      {
        id: Date.now() + 2,
        category: 'Beverages',
        name: 'Mango Lassi Frost',
        price: 90,
        desc: 'Traditional chilled churned yogurt with fresh Alphonso mango pulp',
        isVeg: true,
        img: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=320&auto=format&fit=crop&q=80'
      }
    ]);
  };

  // Step 3 Go Live Handler
  const handleLaunchLive = () => {
    setIsLive(true);
    playMilestoneCelebration();

    // Multi-stage confetti celebration
    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#FF5E14', '#22C55E', '#F59E0B', '#FFFFFF']
    });

    setTimeout(() => {
      confetti({
        particleCount: 90,
        angle: 60,
        spread: 80,
        origin: { x: 0.05, y: 0.5 },
        colors: ['#22C55E', '#FF5E14', '#F59E0B']
      });
      confetti({
        particleCount: 90,
        angle: 120,
        spread: 80,
        origin: { x: 0.95, y: 0.5 },
        colors: ['#FF5E14', '#F59E0B', '#22C55E']
      });
    }, 300);
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(storeUrl);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2400);
  };

  const handleSimulateCart = (itemId) => {
    setCustomerCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    playOrderPlaced();
  };

  return (
    <div className="builder-page">
      {/* BUILDER NAVIGATION HEADER */}
      <header className="builder-header">
        <div className="wrap builder-header-wrap">
          <div className="builder-brand-group">
            <a href="/" className="builder-back-btn" title="Return to home">
              ← Exit
            </a>
            <div className="builder-logo-text">
              <span className="logo-sparkle">🍔</span>
              <b>FoodyPay</b>
              <span className="builder-live-badge">STORE BUILDER</span>
            </div>
          </div>

          <div className="builder-trial-pill">
            <span className="trial-dot" />
            <span>Website Live 1 Week Free</span>
          </div>
        </div>
      </header>

      {/* PROGRESS STEPPER BAR */}
      <div className="builder-stepper-container wrap">
        <div className="builder-steps-track">
          <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}>
            <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
            <div className="step-text">
              <b>Restaurant Details</b>
              <span>Name, type &amp; city</span>
            </div>
          </div>

          <div className="step-connector" />

          <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`} onClick={() => setStep(2)}>
            <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
            <div className="step-text">
              <b>Menu &amp; Food Items</b>
              <span>Categories, dishes &amp; prices</span>
            </div>
          </div>

          <div className="step-connector" />

          <div className={`step-node ${step >= 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
            <div className="step-circle">3</div>
            <div className="step-text">
              <b>Preview &amp; Go Live</b>
              <span>Launch 1 week free</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BUILDER CONTENT AREA */}
      <main className="wrap builder-main">
        {/* ================= STEP 1: RESTAURANT DETAILS ================= */}
        {step === 1 && (
          <div className="builder-card-flow">
            <div className="builder-step-head">
              <span className="step-tag-badge">STEP 01 OF 03</span>
              <h2>Tell us about your Restaurant or Cafe</h2>
              <p className="lead">
                Your online ordering website will be created instantly under your custom restaurant identity.
              </p>
            </div>

            <div className="builder-grid-2">
              <div className="builder-form-col">
                <label className="field">
                  Restaurant or Cafe Name *
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Sharma's Kitchen, Chai Point Cafe"
                    required
                  />
                </label>

                <label className="field">
                  Business / Dining Type
                  <div className="type-pills-row">
                    {['Restaurant', 'Cafe & Bakery', 'Cloud Kitchen', 'Fast Food & Pizzeria', 'Dhabha / Food Truck'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`type-pill ${businessType === t ? 'selected' : ''}`}
                        onClick={() => setBusinessType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  Cuisine / Short Tagline
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. North Indian Specialties, Crispy Dosa & Fresh Coffee"
                  />
                </label>

                <div className="field-row-2">
                  <label className="field">
                    City / Neighborhood *
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Indiranagar, Bangalore"
                      required
                    />
                  </label>

                  <label className="field">
                    Contact Phone / WhatsApp *
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98765 43210"
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  Website Theme Color Accent
                  <div className="color-palette-row">
                    {[
                      { hex: '#FF5E14', name: 'Warm Orange (FoodyPay Signature)' },
                      { hex: '#22C55E', name: 'Leaf Green' },
                      { hex: '#F59E0B', name: 'Golden Amber' },
                      { hex: '#E11D48', name: 'Crimson Rose' }
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        className={`color-bubble ${themeColor === col.hex ? 'picked' : ''}`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                        onClick={() => setThemeColor(col.hex)}
                      />
                    ))}
                  </div>
                </label>

                <div className="builder-actions-row">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      if (!restaurantName.trim()) {
                        alert('Please enter your restaurant name.');
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Next: Add Categories &amp; Dishes →
                  </button>
                </div>
              </div>

              {/* LIVE BRANDING CARD PREVIEW */}
              <div className="builder-preview-col">
                <div className="preview-sticky-wrap">
                  <span className="preview-label-tag">LIVE BRANDING CARD PREVIEW</span>
                  <div className="restaurant-live-id-card">
                    <div className="id-card-banner" style={{ background: `linear-gradient(135deg, ${themeColor}, #FFA07A)` }}>
                      <div className="id-card-avatar">🍽️</div>
                    </div>
                    <div className="id-card-body">
                      <h3>{restaurantName || 'Your Restaurant Name'}</h3>
                      <p className="id-tagline">{tagline || 'Delicious food made with love'}</p>
                      <div className="id-meta-pills">
                        <span>📍 {city || 'City'}</span>
                        <span>⭐ 4.9 (Live Store)</span>
                        <span>🛵 Home Delivery 30m</span>
                      </div>
                      <div className="id-url-pill">
                        🔗 {storeUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CATEGORIES & DISHES ================= */}
        {step === 2 && (
          <div className="builder-card-flow">
            <div className="builder-step-head">
              <span className="step-tag-badge">STEP 02 OF 03</span>
              <h2>Add Food Categories &amp; Dishes</h2>
              <p className="lead">
                Create the menu your diners will browse and order from home. Add dishes with prices, descriptions, and veg/non-veg tags.
              </p>
            </div>

            <div className="builder-grid-2">
              {/* ITEM ADDER FORM */}
              <div className="builder-form-col">
                <div className="category-control-strip">
                  <b>Current Category:</b>
                  <div className="category-tab-scroll">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`cat-pill-btn ${activeCategory === c ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <div className="add-cat-input-row">
                    <input
                      type="text"
                      placeholder="+ New category name..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    />
                    <button type="button" className="btn small" onClick={handleAddCategory}>
                      + Add
                    </button>
                  </div>
                </div>

                <form className="dish-adder-form" onSubmit={handleAddItem}>
                  <div className="form-legend-tag">
                    Adding to: <strong>{activeCategory}</strong>
                  </div>

                  <label className="field">
                    Food / Dish Name *
                    <input
                      type="text"
                      placeholder="e.g. Paneer Butter Masala, Masala Chai, Veg Burger"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                    />
                  </label>

                  <div className="field-row-2">
                    <label className="field">
                      Price in ₹ (INR) *
                      <input
                        type="number"
                        placeholder="e.g. 180"
                        min="1"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field">
                      Dietary Tag
                      <div className="dietary-toggle-group">
                        <button
                          type="button"
                          className={`diet-btn ${newItemIsVeg ? 'veg active' : ''}`}
                          onClick={() => setNewItemIsVeg(true)}
                        >
                          🟢 Pure Veg
                        </button>
                        <button
                          type="button"
                          className={`diet-btn ${!newItemIsVeg ? 'nonveg active' : ''}`}
                          onClick={() => setNewItemIsVeg(false)}
                        >
                          🔴 Non-Veg
                        </button>
                      </div>
                    </label>
                  </div>

                  <label className="field">
                    Description / Ingredients
                    <textarea
                      rows="2"
                      placeholder="e.g. Golden buttery crust, spiced cottage cheese, freshly chopped herbs..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                    />
                  </label>

                  {itemError && <div className="hint error-text">{itemError}</div>}

                  <div className="dish-submit-row">
                    <button type="submit" className="btn primary small">
                      + Add Dish to {activeCategory}
                    </button>
                    <button
                      type="button"
                      className="btn small sample-preset-btn"
                      onClick={handleLoadSampleDishes}
                      title="Instantly add popular signature dishes"
                    >
                      ✨ Load Sample Dishes
                    </button>
                  </div>
                </form>

                <div className="builder-actions-row">
                  <button type="button" className="btn" onClick={() => setStep(1)}>
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      if (items.length === 0) {
                        alert('Please add at least 1 food dish to your menu.');
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    Next: Preview &amp; Go Live ({items.length} dishes) →
                  </button>
                </div>
              </div>

              {/* REAL-TIME ADDED DISHES LIST */}
              <div className="builder-preview-col">
                <div className="preview-sticky-wrap">
                  <div className="dishes-list-header">
                    <b>Active Menu Catalog ({items.length} items)</b>
                    <span className="store-pill-badge">{restaurantName}</span>
                  </div>

                  <div className="catalog-dishes-stream">
                    {items.length === 0 ? (
                      <div className="catalog-empty-notice">
                        No dishes added yet. Use the form on the left or click "Load Sample Dishes".
                      </div>
                    ) : (
                      items.map((it) => (
                        <div key={it.id} className="builder-item-row">
                          <div className="item-veg-dot">
                            <span className={it.isVeg ? 'dot-veg' : 'dot-nonveg'}>●</span>
                          </div>
                          <div className="item-text-info">
                            <div className="item-title-badge">
                              <b>{it.name}</b>
                              <span className="cat-tiny-tag">{it.category}</span>
                            </div>
                            <span className="item-desc-text">{it.desc}</span>
                            <div className="item-price-tag">₹{it.price}</div>
                          </div>
                          <button
                            type="button"
                            className="item-delete-btn"
                            onClick={() => handleDeleteItem(it.id)}
                            title="Remove dish"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PREVIEW & GO LIVE ================= */}
        {step === 3 && (
          <div className="builder-card-flow">
            {!isLive ? (
              <>
                <div className="builder-step-head">
                  <span className="step-tag-badge">STEP 03 OF 03</span>
                  <h2>Interactive Store Preview &amp; Go Live</h2>
                  <p className="lead">
                    This is the exact website your diners will see when they order from home. Check your dishes, and click Launch to take it live immediately for 1 week free!
                  </p>
                </div>

                <div className="builder-grid-2">
                  {/* STORE SETTINGS & LAUNCH CONTROLS */}
                  <div className="builder-form-col">
                    <div className="live-launch-highlight-card">
                      <div className="launch-tag-row">
                        <span className="launch-glow-badge">⚡ 1-WEEK FREE TRIAL READY</span>
                        <span className="no-card-badge">Zero Credit Card Needed</span>
                      </div>

                      <h3>Ready to Launch Your Direct Website?</h3>
                      <p>
                        FoodyPay will immediately publish your website at:
                      </p>

                      <div className="custom-domain-box">
                        <span className="domain-url-preview">{storeUrl}</span>
                        <button type="button" className="copy-link-btn" onClick={handleCopyLink}>
                          {copiedLink ? '✓ Copied' : '📋 Copy Link'}
                        </button>
                      </div>

                      <div className="launch-features-list">
                        <div>✓ Diners can browse menu &amp; order from home in any mobile browser</div>
                        <div>✓ 0% commission on direct orders (Save 30% aggregator fees)</div>
                        <div>✓ Orders instantly pop up on your Kitchen KDS &amp; WhatsApp</div>
                        <div>✓ 100% Free for 7 full days with instant live URL</div>
                      </div>

                      <button
                        type="button"
                        className="btn primary full-w launch-big-btn"
                        onClick={handleLaunchLive}
                      >
                        🚀 Launch Website Live Now (1 Week Free)
                      </button>

                      <div className="guarantee-foot-note">
                        🔒 After 7 days, you can choose any plan or keep counter POS completely free forever.
                      </div>
                    </div>

                    <div className="builder-actions-row">
                      <button type="button" className="btn" onClick={() => setStep(2)}>
                        ← Back to Edit Menu
                      </button>
                    </div>
                  </div>

                  {/* REAL-TIME SMARTPHONE WEBSITE MOCKUP */}
                  <div className="builder-preview-col">
                    <div className="phone-mockup-wrapper">
                      <div className="phone-screen-frame">
                        {/* DYNAMIC ISLAND NOTCH */}
                        <div className="mockup-notch-bar">
                          <span className="notch-pill" />
                        </div>

                        {/* MOCKUP STORE HEADER */}
                        <div className="mockup-store-header" style={{ backgroundColor: themeColor }}>
                          <div className="mockup-store-title-row">
                            <div>
                              <h4>{restaurantName}</h4>
                              <span className="mockup-tagline">{tagline}</span>
                            </div>
                            <span className="mockup-badge-live">LIVE STORE</span>
                          </div>
                          <div className="mockup-store-meta">
                            <span>📍 {city}</span>
                            <span>⭐ 4.9 (320+ reviews)</span>
                          </div>
                        </div>

                        {/* CATEGORY TABS */}
                        <div className="mockup-cat-nav">
                          {categories.map((c) => (
                            <span key={c} className="mockup-cat-chip">
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* FOOD ITEMS STREAM */}
                        <div className="mockup-items-scroll">
                          {items.map((it) => (
                            <div key={it.id} className="mockup-food-card">
                              <div className="mockup-food-info">
                                <span className={it.isVeg ? 'dot-veg' : 'dot-nonveg'}>●</span>
                                <b>{it.name}</b>
                                <p>{it.desc}</p>
                                <span className="mockup-price">₹{it.price}</span>
                              </div>
                              <div className="mockup-food-action">
                                {it.img && <img src={it.img} alt={it.name} className="mockup-dish-thumb" />}
                                <button
                                  type="button"
                                  className="mockup-add-btn"
                                  onClick={() => handleSimulateCart(it.id)}
                                >
                                  {customerCart[it.id] ? `Added (${customerCart[it.id]})` : '+ Add'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* BOTTOM ORDER BAR */}
                        <div className="mockup-bottom-bar">
                          <span>
                            {Object.values(customerCart).reduce((a, b) => a + b, 0)} items in cart
                          </span>
                          <button type="button" className="mockup-checkout-btn" style={{ backgroundColor: themeColor }}>
                            Order Online →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ================= CONGRATULATIONS CELEBRATION CARD ================= */
              <div className="live-success-celebration-card">
                <div className="celebration-trophy-icon">🎉</div>
                <span className="celebration-live-tag">OFFICIALLY LIVE ON THE WEB</span>
                <h2>Congratulations! Your Website is Live!</h2>
                <p className="celebration-desc">
                  <strong>{restaurantName}</strong> is now accepting direct orders from home at zero commission for the next 7 days.
                </p>

                <div className="live-link-hero-box">
                  <span className="live-url-lead">YOUR OFFICIAL ONLINE ORDERING STORE URL:</span>
                  <div className="live-url-display-row">
                    <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="live-url-link">
                      {storeUrl}
                    </a>
                    <button type="button" className="btn primary small" onClick={handleCopyLink}>
                      {copiedLink ? '✓ Copied to Clipboard!' : '📋 Copy Link'}
                    </button>
                  </div>
                </div>

                <div className="celebration-action-grid">
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn primary"
                  >
                    🌐 Open Live Customer Storefront
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?text=Order%20food%20directly%20from%20our%20official%20menu%20website%3A%20${encodeURIComponent(storeUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn green"
                  >
                    📲 Share Menu on WhatsApp
                  </a>

                  <a href="/" className="btn">
                    ← Return to FoodyPay Home
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

