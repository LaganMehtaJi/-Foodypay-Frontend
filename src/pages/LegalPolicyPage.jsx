import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, RefreshCw, Info, BookOpen, ArrowLeft, Utensils, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LegalPolicyPage() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  let initialTab = 'terms';
  if (path.includes('privacy')) initialTab = 'privacy';
  else if (path.includes('refund')) initialTab = 'refunds';
  else if (path.includes('about')) initialTab = 'about';
  else if (path.includes('blog')) initialTab = 'blog';

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 80px 20px' }}>
        {/* TOP BREADCRUMB */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px', color: '#64748B' }}>
          <Link to="/" style={{ color: '#FF5E14', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <span>/</span>
          <span style={{ fontWeight: 800, color: '#0F172A' }}>Legal, Policies &amp; Resources</span>
        </div>

        {/* PAGE HEADER */}
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF0EB', color: '#FF5E14', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ShieldCheck size={14} /> FoodyPay Official Documentation
          </div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0F172A' }}>
            Terms of Service, Privacy &amp; Platform Guidelines
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14.5px', color: '#64748B', lineHeight: 1.6 }}>
            Comprehensive terms, privacy policies, refund procedures, and e-commerce guides for merchants, diners, and restaurant operators on foodypay.in.
          </p>

          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: activeTab === 'terms' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                background: activeTab === 'terms' ? '#FFF0EB' : '#FFFFFF',
                color: activeTab === 'terms' ? '#FF5E14' : '#475569',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              <FileText size={16} /> Terms &amp; Conditions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: activeTab === 'privacy' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                background: activeTab === 'privacy' ? '#FFF0EB' : '#FFFFFF',
                color: activeTab === 'privacy' ? '#FF5E14' : '#475569',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              <ShieldCheck size={16} /> Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: activeTab === 'refunds' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                background: activeTab === 'refunds' ? '#FFF0EB' : '#FFFFFF',
                color: activeTab === 'refunds' ? '#FF5E14' : '#475569',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Refund &amp; Cancellation Policy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: activeTab === 'about' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                background: activeTab === 'about' ? '#FFF0EB' : '#FFFFFF',
                color: activeTab === 'about' ? '#FF5E14' : '#475569',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              <Info size={16} /> About Us
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: activeTab === 'blog' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                background: activeTab === 'blog' ? '#FFF0EB' : '#FFFFFF',
                color: activeTab === 'blog' ? '#FF5E14' : '#475569',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={16} /> Blogs &amp; Guides
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ background: '#FFFFFF', padding: '36px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <article style={{ lineHeight: 1.7, color: '#334155' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: 0 }}>
                1. Terms &amp; Conditions of Service
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Last Updated: October 2026 • Effective Date: January 1, 2026
              </p>
              
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '24px' }}>
                1.1 Overview &amp; Acceptance
              </h3>
              <p>
                Welcome to <strong>FoodyPay (foodypay.in)</strong>. By accessing our platform, restaurant management web console (`/crm`), digital ordering menus, or creating a merchant website, you agree to comply with and be bound by these Terms and Conditions.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '20px' }}>
                1.2 Merchant Store Website &amp; CRM Services
              </h3>
              <p>
                FoodyPay provides a no-code digital showroom and cloud POS platform enabling restaurants, cafes, food courts, and cloud kitchens to build an online ordering website in 15 seconds, generate QR standees, accept online payments via Razorpay, and manage kitchen orders via KDS.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '20px' }}>
                1.3 Subscription Plans &amp; Billing
              </h3>
              <ul>
                <li><strong>Starter Free Plan ($0/mo):</strong> Includes 1 week online website, QR table ordering, and counter POS billing.</li>
                <li><strong>Growth Pro Plan ($35/mo):</strong> Unlocks permanent live website, KDS, customer CRM, and lower commission rates.</li>
                <li><strong>Enterprise Max Plan ($75/mo):</strong> Unlocks 0% commission, custom domains, and white-label options.</li>
              </ul>
              <p>
                Subscriptions are billed monthly or annually. Upon expiry, accounts drop to Starter Free tier until renewed via Razorpay payment.
              </p>
            </article>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <article style={{ lineHeight: 1.7, color: '#334155' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: 0 }}>
                2. Privacy Policy &amp; Data Protection
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                FoodyPay is committed to protecting the privacy of merchants and diners.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '24px' }}>
                2.1 Information We Collect
              </h3>
              <p>
                We collect merchant details (business name, owner contact, email, address, UPI ID), diner order details (name, table number, mobile number, item choices), and transaction payloads processed via Razorpay.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '20px' }}>
                2.2 How Data Is Used
              </h3>
              <p>
                Data is used strictly to process food orders, dispatch kitchen alerts, issue SMS/WhatsApp bill receipts, and provide store analytics. We do NOT sell or share customer data with unauthorized third parties.
              </p>
            </article>
          )}

          {/* TAB 3: REFUND & CANCELLATION POLICY */}
          {activeTab === 'refunds' && (
            <article style={{ lineHeight: 1.7, color: '#334155' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: 0 }}>
                3. Refund &amp; Cancellation Policy
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Guidelines for merchant subscriptions and diner order refunds.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '24px' }}>
                3.1 Merchant Subscription Refunds
              </h3>
              <p>
                Subscription purchases for Growth Pro ($35/mo) and Enterprise Max ($75/mo) paid via Razorpay can be cancelled within 7 days of activation for a full pro-rata refund if features fail to meet your operational requirements. Contact <strong>Product@foodypay.in</strong> or WhatsApp support at <strong>+91 7496888449</strong>.
              </p>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '20px' }}>
                3.2 Food Order Refunds &amp; Cancellations
              </h3>
              <p>
                Food orders placed by diners at restaurant tables or online websites are routed directly to the merchant's POS/KDS. If an order is cancelled prior to kitchen preparation or if an item is out of stock, refunds are processed back to the diner's original payment method via Razorpay within 3 to 5 business days.
              </p>
            </article>
          )}

          {/* TAB 4: ABOUT US */}
          {activeTab === 'about' && (
            <article style={{ lineHeight: 1.7, color: '#334155' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: 0 }}>
                4. About FoodyPay (foodypay.in)
              </h2>
              <p>
                <strong>FoodyPay</strong> is a fast-growing technology startup empowering restaurants, cafes, food courts, and cloud kitchens across India to digitize their operations in seconds.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '24px' }}>
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <Utensils size={28} color="#FF5E14" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Blinkit-Style Marketplace</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Browse and order food online from local restaurants with lightning speed.</p>
                </div>

                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <CheckCircle size={28} color="#16A34A" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>15-Sec Digital Showroom</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Build your custom restaurant website and digital QR menu without coding.</p>
                </div>
              </div>
            </article>
          )}

          {/* TAB 5: BLOGS & GUIDES */}
          {activeTab === 'blog' && (
            <article style={{ lineHeight: 1.7, color: '#334155' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: 0 }}>
                5. FoodyPay Technology Blog &amp; E-Commerce Guides
              </h2>
              
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '18px', border: '1px solid #E2E8F0', marginTop: '20px' }}>
                <span style={{ fontSize: '11px', background: '#FF5E14', color: '#FFF', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, textTransform: 'uppercase' }}>FEATURED ARTICLE</span>
                <h3 style={{ margin: '8px 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                  Best E-Commerce Platform for Indian Restaurants &amp; Cafes in 2026 — Digital Showroom by FoodyPay
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  Discover how no-code digital store builders are enabling Indian restaurant owners to cut Swiggy/Zomato commission costs by 50% to 100% using direct QR ordering and custom domain websites built in just 30 seconds.
                </p>
                <Link to="/register" style={{ color: '#FF5E14', fontWeight: 800, fontSize: '13.5px', textDecoration: 'none' }}>
                  Build Your Free Restaurant Website Now →
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
