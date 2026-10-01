import React from 'react';

const FEATURES = [
  { icon: '', title: 'Own Online Ordering Website', desc: 'Customers order directly from home for delivery & takeaway. Live for 1 week free on Starter plan — 0% aggregator commission.' },
  { icon: '️', title: 'Dynamic Visual Menu', desc: 'Instant pricing updates, 86 out-of-stock dishes in 1 tap, and high-definition food presentation.' },
  { icon: '🪑', title: 'Interactive Floor & Tables', desc: 'Visual seating maps, live occupancy states, party bill mergers, and smooth guest transfers.' },
  { icon: '', title: 'Retention CRM & Loyalty', desc: 'Automated repeat offers, birthday rewards, digital cashbacks, and gamified dining perks.' },
  { icon: '', title: 'Role-Based Staff Access', desc: 'Encrypted PIN logins, waiter tablet restrictions, manager void approvals & audit logs.' },
  { icon: '', title: 'Shift & Cash Reconciliation', desc: 'Float management, blind cash counts, automated end-of-shift Z-reports & variance alerts.' },
  { icon: '', title: 'Inventory & Food Costing', desc: 'Live ingredient deduction, wastage logs, supplier invoices, and real-time recipe margins.' },
  { icon: '', title: 'Multi-Outlet Analytics', desc: 'Live revenue telemetry, hourly rush heatmaps, GST tax exports, and net profit clarity.' },
];

export default function ControlGrid() {
  return (
    <section id="control" className="control-section">
      <div className="wrap">
        <h2>Complete Restaurant Command Center</h2>
        <p className="lead">
          Full visibility over dining tables, billing ledger, staff performance, and automated guest CRM from a single unified screen.
        </p>

        {/* MANAGED CRM & ANALYTICS VISUAL SHOWCASE */}
        <div className="control-crm-showcase-card">
          <div className="crm-showcase-media">
            <img
              src="/Section-Images/crm-analytics.png"
              alt="FoodyPay Managed CRM and Real-Time Business Intelligence Dashboard"
              className="crm-showcase-img"
              loading="lazy"
            />
            <div className="crm-float-pill">
              <span className="live-sparkle-dot" />
              <span> Real-Time Managed CRM &amp; Live Telemetry</span>
            </div>
          </div>
          <div className="crm-showcase-content">
            <span className="chip"> Growth Engine</span>
            <h3>Automate Guest Retention with Built-in Restaurant CRM</h3>
            <p>
              FoodyPay logs diner phone numbers safely with every QR scan and counter bill. Automatically send personalized WhatsApp birthday wishes, re-engagement offers to guests who haven't visited in 30 days, and analyze live gross margins per dish.
            </p>
            <div className="crm-stats-row">
              <div className="crm-stat-box">
                <b>+38%</b>
                <span>Repeat Dine-In Rate</span>
              </div>
              <div className="crm-stat-box">
                <b>100%</b>
                <span>Automated CRM Sync</span>
              </div>
              <div className="crm-stat-box">
                <b>₹0</b>
                <span>Third-Party SMS Fees</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ctl">
          {FEATURES.map((feat, i) => (
            <div key={i}>
              <i>{feat.icon}</i>
              <div>
                <b>{feat.title}</b>
                <span>{feat.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
