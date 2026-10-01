import React from 'react';
import HighVelocityBanner from '../components/HighVelocityBanner';
import LiveDemo from '../components/LiveDemo';
import FourParts from '../components/FourParts';
import GuestExperience from '../components/GuestExperience';
import ControlGrid from '../components/ControlGrid';
import PricingCalculator from '../components/PricingCalculator';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// Main Landing Page with High Velocity Live Counter
export default function HomePage({ onOpenSignup, onShowToast }) {
  return (
   
    <main id="top" className="main-content">
       <Navbar onOpenSignup={onOpenSignup} onShowToast={onShowToast} />
      {/* HERO SECTION */}
      <header className="hero wrap">
        {/* HIGH VELOCITY TICKING BANNER & 1,000-ORDER CELEBRATIONS */}
        <HighVelocityBanner onOpenSignup={onOpenSignup} />

        <div className="hero-top-layout">
          <div className="hero-title-area">
            <h1>
              <span className="a">Faster Orders.</span>
              <span className="b">Happier Diners.</span>
              <span className="c">Higher Profits.</span>
            </h1>
          </div>

          {/* RIGHT-SIDE HERO LOGO SHOWCASE */}
          <div className="hero-right-logo-container">
            <div className="hero-logo-backdrop-glow" />
            <div className="hero-logo-card">
              <img
                src="/Logo.png"
                alt="FoodyPay Logo"
                className="hero-showcase-logo"
              />
              <div className="hero-logo-caption">
                <span className="logo-sparkle-star"></span>
                <b>FoodyPay OS</b>
                <span className="logo-sub-badge">Table QR • POS • KDS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-row">
          <div>
            <p className="sub">
              The all-in-one restaurant operating system: table QR ordering, lightning walk-in billing, kitchen KDS, and <strong>your own online ordering website</strong> so diners can order directly from home.
            </p>
            <ul className="ticks">
              <li><b>Free forever</b> plan, ₹0 monthly</li>
              <li><b>Own Website</b> live 1 week free (order from home)</li>
              <li><b>2%</b> on QR table orders</li>
              <li><b>₹0</b> on counter billing</li>
              <li><b>Zero</b> proprietary hardware needed</li>
            </ul>
          </div>
          <div className="cta-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => onOpenSignup('Free')}
            >
              Start Free Plan
            </button>
            <a
              href="/create-website"
              target="_blank"
              rel="noopener noreferrer"
              className="btn hero-builder-btn"
            >
               Live Your Website in Just 3 Steps →
            </a>
            <a className="btn" href="#demo">
              Try the live demo
            </a>
          </div>
        </div>

        {/* 3-PILLAR VISUAL REAL-WORLD RESTAURANT GALLERY */}
        <div className="hero-visual-gallery-strip">
          <div className="gallery-card">
            <div className="gallery-img-box">
              <img
                src="/Section-Images/qr-table.png"
                alt="Table QR code stand on restaurant dining table for contactless food orders"
                className="gallery-photo"
                loading="lazy"
              />
              <span className="gallery-badge">🪑 QR Code on Table</span>
            </div>
            <div className="gallery-info">
              <b>QR Codes on Every Table</b>
              <p>Diners scan directly with phone camera to view full menu and order with zero waiting.</p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-box">
              <img
                src="/Section-Images/catalog-hand.png"
                alt="Customer holding smartphone with open FoodyPay food catalog menu"
                className="gallery-photo"
                loading="lazy"
              />
              <span className="gallery-badge"> Open Catalog in Hand</span>
            </div>
            <div className="gallery-info">
              <b>Digital Catalog in Diner's Hand</b>
              <p>Appetizing photography, ingredient customizations, and 1-tap cart right in the diner's palm.</p>
            </div>
          </div>

          <div className="gallery-card">
            <div className="gallery-img-box">
              <img
                src="/Section-Images/crm-analytics.png"
                alt="FoodyPay Managed CRM and restaurant growth analytics dashboard"
                className="gallery-photo"
                loading="lazy"
              />
              <span className="gallery-badge"> Managed CRM &amp; Sales</span>
            </div>
            <div className="gallery-info">
              <b>Managed CRM &amp; Analytics</b>
              <p>Capture customer numbers, automate WhatsApp loyalty offers, and track peak-hour profits.</p>
            </div>
          </div>
        </div>

        {/* PROMINENT ONLINE ORDERING WEBSITE BANNER */}
        <div className="hero-website-feature-card">
          <div className="feature-card-media">
            <img
              src="/Section-Images/catalog-hand.png"
              alt="Online food ordering website for direct home delivery"
              className="feature-thumb-img"
              loading="lazy"
            />
          </div>
          <div className="feature-card-content">
            <div className="feature-badge"> 1 Week Free Website Trial</div>
            <h3>Ghar baithe orders lein: Apni branded food website shuru karein</h3>
            <p>
              Ab customers ghar baithe direct aapke official menu se order kar sakte hain. Zero setup fee, zero coding. Menu setup karein aur turant live share karein!
            </p>
          </div>
          <a
            href="/create-website"
            target="_blank"
            rel="noopener noreferrer"
            className="btn primary hero-feature-action"
          >
            Live Your Website in Just 3 Steps 
          </a>
        </div>
      </header>

      {/* CONNECTED LIVE DEMO WITH SOUNDS & 3D STATION */}
      <LiveDemo onShowToast={onShowToast} />

      {/* FOUR PARTS. ONE SYSTEM */}
      <FourParts />

      {/* GUEST EXPERIENCE */}
      <GuestExperience />

      {/* CONTROL GRID */}
      <ControlGrid />

      {/* PRICING & CALCULATOR */}
      <PricingCalculator onOpenSignup={onOpenSignup} onShowToast={onShowToast} />

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <h2>Ready to supercharge your restaurant?</h2>
          <p className="lead" style={{ marginInline: 'auto' }}>
            Cut table wait times by 40%, increase average bill size by 25%, and manage operations with effortless clarity. Join 1,200+ high-growth dining spots on FoodyPay.
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn primary"
              onClick={() => onOpenSignup('Free')}
            >
              Start Free Plan
            </button>
            <a
              href="/create-website"
              target="_blank"
              rel="noopener noreferrer"
              className="btn hero-builder-btn"
            >
               Live Your Website in Just 3 Steps →
            </a>
            <a className="btn" href="#demo">
              Watch the demo
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
