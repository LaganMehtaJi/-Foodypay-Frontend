import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, Truck, Laptop, Utensils, CheckCircle, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PricingCalculator from '../components/PricingCalculator';

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

        {/* PRICING RECEIPT CARDS SECTION */}
        <PricingCalculator onOpenSignup={(plan) => navigate('/register', { state: { selectedPlan: plan } })} />

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
