import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ShieldCheck } from 'lucide-react';

export default function GoogleSearchSitelinksShowcase() {
  return (
    <section style={{ backgroundColor: '#181A1B', color: '#E8EAED', padding: '48px 20px', borderTop: '1px solid #2D3134', borderBottom: '1px solid #2D3134', fontFamily: 'Roboto, Arial, sans-serif' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        
        {/* GOOGLE SEARCH BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#9AA0A6', fontSize: '13px', fontWeight: 600 }}>
          <Search size={16} color="#4285F4" />
          <span>Live Google Search Showcase — Search Listing for <strong>foodypay.in</strong></span>
        </div>

        {/* GOOGLE SEARCH RESULT CARD (Ref: User Image media_1791111933935.png) */}
        <div style={{ backgroundColor: '#202124', border: '1px solid #3C4043', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {/* HEADER DOMAIN ROW */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 900, fontSize: '14px' }}>
              FP
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#BDC1C6', fontWeight: 600 }}>FoodyPay OS</div>
              <div style={{ fontSize: '12px', color: '#9AA0A6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                https://www.foodypay.in <ChevronRight size={12} />
              </div>
            </div>
          </div>

          {/* MAIN TITLE LINK */}
          <h2 style={{ margin: '4px 0 8px 0', fontSize: '20px', fontWeight: 500, color: '#8AB4F8', lineHeight: 1.3 }}>
            <a href="/" style={{ color: '#8AB4F8', textDecoration: 'none' }}>
              FoodyPay — Build Your Website in 15 Secs &amp; Sell Online
            </a>
          </h2>

          {/* SNIPPET TEXT */}
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#BDC1C6', lineHeight: 1.5 }}>
            Create your free Website &amp; Digital QR Menu in just 15 secs with <strong>FoodyPay OS</strong>. Operate from Mobile or Desktop Web Console (`/crm`) at zero code. Share your Website &amp; sell online like Blinkit.
          </p>

          {/* SITELINKS LIST (6 GRID ITEMS MATCHING USER SCREENSHOT) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', borderTop: '1px solid #3C4043' }}>
            {/* ITEM 1: DOMAIN NAME */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #2D3134' }}>
              <Link to="/register" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Domain name &amp; Website Builder</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                Create your free Website in just 15 secs with FoodyPay Digital Showroom...
              </div>
            </div>

            {/* ITEM 2: ABOUT US */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #2D3134' }}>
              <Link to="/about-us" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>About Us</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                FoodyPay is a fast-growing technology start-up helping Indian restaurants &amp; cafes...
              </div>
            </div>

            {/* ITEM 3: WEB CONSOLE / CRM */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #2D3134' }}>
              <Link to="/crm" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Web Console &amp; CRM (/crm)</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                FoodyPay Web Console is the Desktop &amp; Mobile Web App for Restaurant Management...
              </div>
            </div>

            {/* ITEM 4: BLOGS BY FOODYPAY */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #2D3134' }}>
              <Link to="/blog" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Blogs by FoodyPay</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                From small startups to large cloud kitchens, cloud-based restaurant operating system...
              </div>
            </div>

            {/* ITEM 5: TERMS & CONDITIONS, REFUNDS */}
            <div style={{ padding: '14px 0', borderBottom: '1px solid #2D3134' }}>
              <Link to="/terms-and-conditions" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Terms &amp; Conditions, Refunds ...</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                Further, FoodyPay has developed a web application namely foodypay.in for merchant billing &amp; refunds...
              </div>
            </div>

            {/* ITEM 6: BEST ECOMMERCE PLATFORM FOR INDIAN BUSINESSES */}
            <div style={{ padding: '14px 0' }}>
              <Link to="/blog" style={{ fontSize: '16px', color: '#8AB4F8', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Best Ecommerce Platform for Restaurants in 2026</span>
                <ChevronRight size={18} color="#9AA0A6" />
              </Link>
              <div style={{ fontSize: '13px', color: '#9AA0A6', marginTop: '4px' }}>
                FoodyPay is a no-code, mobile-optimised e-commerce platform for Indian restaurants...
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
