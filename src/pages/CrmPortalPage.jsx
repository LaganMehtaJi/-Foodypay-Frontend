import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, Truck, Laptop, Utensils, CheckCircle, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CrmPortalPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('foodypay_token');

  // Auto-redirect to /dashboard if logged in
  React.useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px 100px 20px' }}>
        {/* HERO HEADER */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 50px auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,94,20,0.15)', color: '#FF5E14', border: '1px solid rgba(255,94,20,0.3)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Sparkles size={16} /> Restaurant &amp; Cafe CRM Console
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
            FoodyPay Web Console &amp; Merchant Operating System
          </h1>

          <p style={{ fontSize: '17px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            Manage table QR ordering, walk-in billing, kitchen KDS, retention CRM, and your own online ordering website from one unified cloud dashboard.
          </p>
        </div>

        {/* 3 CORE SERVICE PORTALS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          {/* CARD 1: POS & CRM DASHBOARD */}
          <div style={{ backgroundColor: '#111827', border: '1.5px solid #1F2937', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,94,20,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

            <div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(255,94,20,0.35)' }}>
                <Laptop size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                Merchant POS Web Console
              </h3>
              <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Access live table orders, billing reports, kitchen KDS, customer directory, and catalog editor.
              </p>
              <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.8 }}>
                <li>Live Order Ticker &amp; Alarm Audio</li>
                <li>Instant QR Table Billing &amp; GST Receipts</li>
                <li>Customer Retention &amp; Coupon Codes</li>
              </ul>
            </div>

            <Link
              to="/login"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#FF5E14', color: '#FFF', padding: '14px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(255,94,20,0.4)' }}
            >
              Log In to Web Console <ArrowRight size={18} />
            </Link>
          </div>

          {/* CARD 2: STORE REGISTER & WEBSITE BUILDER */}
          <div style={{ backgroundColor: '#111827', border: '1.5px solid #1F2937', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(16,185,129,0.35)' }}>
                <Store size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                Create Store &amp; Build Website
              </h3>
              <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Build your own restaurant website &amp; digital QR menu in just 15 seconds.
              </p>
              <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.8 }}>
                <li>Own Online Ordering Website ($0 Starter)</li>
                <li>Digital Menu &amp; QR Standee Generator</li>
                <li>Zero-code setup from Mobile or Laptop</li>
              </ul>
            </div>

            <Link
              to="/register"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#10B981', color: '#FFF', padding: '14px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
            >
              Create Restaurant Website (30s) <ArrowRight size={18} />
            </Link>
          </div>

          {/* CARD 3: DRIVER / DELIVERY PARTNER */}
          <div style={{ backgroundColor: '#111827', border: '1.5px solid #1F2937', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#3B82F6', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(59,130,246,0.35)' }}>
                <Truck size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0' }}>
                FoodyPay Fleet &amp; Driver Portal
              </h3>
              <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Delivery drivers and fleet partners log in to track deliveries and log COD/UPI collections.
              </p>
              <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.8 }}>
                <li>Live Order Navigation &amp; Customer Calls</li>
                <li>Driver Cash Collection Logging</li>
                <li>Real-time Order Status Updates</li>
              </ul>
            </div>

            <Link
              to="/delivery-partner"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#3B82F6', color: '#FFF', padding: '14px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}
            >
              Driver Partner Login <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* FOOTER LINK BAR */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '18px', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#10B981" />
            <span style={{ fontSize: '13.5px', color: '#9CA3AF', fontWeight: 600 }}>FoodyPay OS • Official Restaurant &amp; Cafe CRM Infrastructure</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 700 }}>
            <Link to="/terms-and-conditions" style={{ color: '#FF5E14', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
            <Link to="/refund-policy" style={{ color: '#FF5E14', textDecoration: 'none' }}>Refund Policy</Link>
            <Link to="/blog" style={{ color: '#FF5E14', textDecoration: 'none' }}>E-Commerce Guides</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
