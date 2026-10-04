import React, { useState } from 'react';

const FX = 88;
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export default function PricingCalculator({ onOpenSignup, onShowToast }) {
  const [qrSales, setQrSales] = useState(200000);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [consultName, setConsultName] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultType, setConsultType] = useState('Full White-Label Solution');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultError, setConsultError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const freeCost = qrSales * 0.02;
  const proCost = 35 * FX + qrSales * 0.01;
  const maxCost = 75 * FX;

  const rows = [
    { name: 'Free', cost: freeCost },
    { name: 'Pro', cost: proCost },
    { name: 'Max', cost: maxCost }
  ];

  const minCost = Math.min(...rows.map((r) => r.cost));
  const maxBarCost = Math.max(...rows.map((r) => r.cost), 1);

  // Copy Email Handler
  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('Product@foodypay.in');
    }
    setCopiedEmail(true);
    if (onShowToast) {
      onShowToast(' Product@foodypay.in copied to clipboard!');
    }
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Appointment Form Submit
  const handleSubmitAppointment = (e) => {
    e.preventDefault();
    if (!consultName.trim() || !consultPhone.trim()) {
      setConsultError('Please enter your restaurant name and phone number.');
      return;
    }
    setConsultError('');
    setIsSubmitted(true);

    // Auto-open WhatsApp with pre-filled message to +91 7496888449
    const targetPhone = '917496888449';
    const waMsg = `Hello FoodyPay Team! ️\n\nI want to *Request for create Account / Consultation* for the *Custom / White-Label Plan*.\n\n *Inquiry Details:*\n• Restaurant / Brand: ${consultName.trim()}\n• Contact Phone: ${consultPhone.trim()}\n• Solution Type: ${consultType}\n• Requirements: ${consultNotes.trim() || 'Custom features / White-labeling'}\n\nPlease get in touch with available slots and custom pricing. Thank you!`;
    const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(waMsg)}`;
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Could not auto-open WhatsApp:', err);
    }

    const subject = encodeURIComponent(`Appointment Inquiry: ${consultName} - ${consultType}`);
    const body = encodeURIComponent(
      `Hello FoodyPay Product Team,\n\nI would like to book an appointment / consultation to discuss:\n` +
      `• Restaurant / Brand: ${consultName}\n` +
      `• Contact Phone / WhatsApp: ${consultPhone}\n` +
      `• Solution Type: ${consultType}\n` +
      `• Requirements / Features Needed:\n${consultNotes.trim() || 'Custom requirements'}\n\n` +
      `Please let me know your available slots.\n\nThank you!`
    );

    // Open email client
    window.location.href = `mailto:Product@foodypay.in?subject=${subject}&body=${body}`;

    if (onShowToast) {
      onShowToast(' Consultation request initiated! Connecting with Product@foodypay.in');
    }

    setTimeout(() => {
      setIsAppointmentOpen(false);
      setIsSubmitted(false);
      setConsultName('');
      setConsultPhone('');
      setConsultNotes('');
    }, 2200);
  };

  return (
    <section className="pricing" id="pricing">
      <div className="wrap">
        <h2>Predictable, High-Margin Pricing</h2>
        <p className="lead">
          Never pay for software you don't use. Start completely free with zero monthly subscription, get your <strong>own online ordering website live for 1 week</strong> to accept direct orders from home, or scale with flat-rate tiers.
        </p>

        <div className="plans">
          {/* FREE PLAN */}
          <article className="receipt">
            <span className="docket-promo-pill"> Website Live 1 Week Free</span>
            <h3>Starter Free</h3>
            <div className="price">
              $0<small> / month</small>
            </div>
            <div className="rate-line">2% on QR orders · ₹0 Monthly</div>
            <ul>
              <li><strong>Own Online Ordering Website</strong> (Live for 1 week — let customers order from home)</li>
              <li>Counter &amp; walk-in billing ₹0</li>
              <li>Full visual QR menu &amp; ordering</li>
              <li>Pay-as-you-grow prepaid wallet</li>
            </ul>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenSignup('Free')}
            >
              Start free forever
            </button>
            <div className="bars" aria-hidden="true" />
          </article>

          {/* PRO PLAN */}
          <article className="receipt hot">
            <span className="ribbon">Most Popular</span>
            <h3>Growth Pro</h3>
            <div className="price">
              $35<small> / month</small>
            </div>
            <div className="rate-line">1% on QR orders · Lower Fee</div>
            <ul>
              <li>Everything in Starter Free</li>
              <li><strong>Permanent Live Online Website</strong> for direct home delivery &amp; takeaway</li>
              <li>50% lower QR commission rate</li>
              <li>Advanced GST tax &amp; sales reports</li>
              <li>Retention CRM, coupons &amp; happy hour</li>
              <li>Priority 24/7 technical support</li>
            </ul>
            <button
              type="button"
              className="btn primary"
              onClick={() => onOpenSignup('35 Dollar')}
            >
              Choose Growth Pro ($35)
            </button>
            <div className="bars" aria-hidden="true" />
          </article>

          {/* MAX PLAN */}
          <article className="receipt">
            <h3>Enterprise Max</h3>
            <div className="price">
              $75<small> / month</small>
            </div>
            <div className="rate-line">0% Commission · Flat Monthly</div>
            <ul>
              <li>Everything in Growth Pro</li>
              <li>0% commission on all QR &amp; online orders</li>
              <li><strong>Custom Domain Website</strong> (order.yourbrand.com)</li>
              <li>Multi-outlet &amp; franchise control</li>
              <li>Custom restaurant branding</li>
              <li>Dedicated VIP account manager</li>
            </ul>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenSignup('75 Dollar')}
            >
              Choose Enterprise Max ($75)
            </button>
            <div className="bars" aria-hidden="true" />
          </article>
        </div>

        {/* WHITE-LABEL & BESPOKE CUSTOM FEATURES CARD */}
        <div className="custom-solution-card">
          <div className="custom-solution-badge-row">
            <span className="custom-badge-pill"> BESPOKE &amp; ENTERPRISE</span>
            <span className="custom-badge-pill outline">WHITE-LABEL &amp; CUSTOM FEATURE PURCHASE</span>
          </div>

          <div className="custom-solution-grid">
            <div className="custom-solution-info">
              <h3>Need Full White-Label or Custom-Built Features?</h3>
              <p>
                Operating a multi-unit restaurant chain, food court, luxury resort, or unique concept? 
                FoodyPay offers <strong>private white-label solutions</strong> (your domain, private logos, bespoke diner UI) 
                and <strong>custom software engineering</strong> tailored specifically to your operational blueprint.
              </p>

              <div className="custom-perks-grid">
                <div className="custom-perk-item">
                  <span className="perk-icon">️</span>
                  <div>
                    <b>100% White-Label Branding</b>
                    <span>Deploy under your restaurant's domain &amp; private branding with zero FoodyPay watermarks.</span>
                  </div>
                </div>

                <div className="custom-perk-item">
                  <span className="perk-icon"></span>
                  <div>
                    <b>Purchase &amp; Build Custom Features</b>
                    <span>Commission bespoke workflows, specialized hardware printer drivers, or custom ERP &amp; Tally integrations.</span>
                  </div>
                </div>

                <div className="custom-perk-item">
                  <span className="perk-icon"></span>
                  <div>
                    <b>Direct Product Team Access</b>
                    <span>Partner 1-on-1 with our founding software architects with custom SLAs and private repository sync.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION & BOOK APPOINTMENT CARD */}
            <div className="custom-action-card">
              <div className="action-card-header">
                <span className="calendar-icon"></span>
                <div>
                  <b>Book an Appointment / Consultation</b>
                  <span>Connect directly with our engineering team</span>
                </div>
              </div>

              {/* DIRECT EMAIL DISPLAY */}
              <div className="direct-email-box">
                <span className="email-meta-label">DIRECT INQUIRY &amp; PROPOSALS</span>
                <div className="email-address-row">
                  <span className="email-text">Product@foodypay.in</span>
                  <button
                    type="button"
                    className="btn-copy-email"
                    onClick={handleCopyEmail}
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? ' Copied!' : ' Copy'}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="custom-btn-group">
                <button
                  type="button"
                  className="btn primary custom-full-btn"
                  onClick={() => onOpenSignup('Custom')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                   Request Custom Plan on WhatsApp
                </button>

                <a
                  href="mailto:Product@foodypay.in?subject=Custom%20Solution%20%26%20White%20Label%20Inquiry%20-%20FoodyPay&body=Hello%20FoodyPay%20Product%20Team%2C%0A%0AI%20am%20interested%20in%20discussing%20a%20custom%20solution%20%2F%20white-label%20%2F%20new%20feature%20purchase%20for%20our%20restaurant.%0A%0A-%20Restaurant%20%2F%20Brand%20Name%3A%20%0A-%20Number%20of%20Outlets%3A%20%0A-%20Contact%20Phone%20%2F%20WhatsApp%3A%20%0A-%20Requirements%20(White-Label%2C%20Custom%20Feature%2C%20Integration)%3A%20%0A%0APlease%20let%20me%20know%20your%20available%20slots%20for%20an%20appointment.%0A%0AThanks!"
                  className="btn custom-full-btn"
                >
                  ️ Email Product Team Directly
                </a>

                <button
                  type="button"
                  className="btn custom-full-btn book-consult-btn"
                  onClick={() => setIsAppointmentOpen(true)}
                >
                   Book Appointment on Web
                </button>
              </div>

              <div className="response-guarantee">
                <span></span> Guaranteed response from our product architects within 4 hours.
              </div>
            </div>
          </div>
        </div>

        {/* BOOK APPOINTMENT MODAL */}
        {isAppointmentOpen && (
          <div className="modal-backdrop" onClick={() => setIsAppointmentOpen(false)}>
            <div
              className="modal-dialog appointment-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="close"
                onClick={() => setIsAppointmentOpen(false)}
                aria-label="Close"
              >
                ×
              </button>

              {!isSubmitted ? (
                <div>
                  <span className="chip"> Enterprise &amp; Custom Engineering</span>
                  <h3>Book an Appointment / Consultation</h3>
                  <p className="modal-sub">
                    Directly discuss white-label deployment, custom feature acquisition, or franchise rollout with our product team at <strong>Product@foodypay.in</strong>.
                  </p>

                  <form onSubmit={handleSubmitAppointment}>
                    <label className="field">
                      Restaurant / Chain name
                      <input
                        type="text"
                        placeholder="e.g. Royal Palace Dine & Lounge"
                        value={consultName}
                        onChange={(e) => setConsultName(e.target.value)}
                        autoFocus
                        required
                      />
                    </label>

                    <label className="field">
                      Contact Phone / WhatsApp
                      <input
                        type="tel"
                        placeholder="e.g. 98765 43210"
                        value={consultPhone}
                        onChange={(e) => setConsultPhone(e.target.value)}
                        required
                      />
                    </label>

                    <label className="field">
                      Requirement Type
                      <select
                        className="appointment-select"
                        value={consultType}
                        onChange={(e) => setConsultType(e.target.value)}
                      >
                        <option value="Full White-Label Solution">Full White-Label Branding (Custom Domain &amp; Apps)</option>
                        <option value="Custom Feature Development / Purchase">Purchase / Build New Custom Features</option>
                        <option value="ERP & Accounting Integration">ERP / Accounting Integration (Tally, SAP, Marg)</option>
                        <option value="Multi-Outlet Franchise Architecture">Multi-Outlet Franchise Architecture</option>
                        <option value="Other Bespoke Requirement">Other Bespoke Requirement</option>
                      </select>
                    </label>

                    <label className="field">
                      Describe your requirements (Optional)
                      <textarea
                        className="appointment-textarea"
                        rows="3"
                        placeholder="Tell us what custom features or white-labeling you need..."
                        value={consultNotes}
                        onChange={(e) => setConsultNotes(e.target.value)}
                      />
                    </label>

                    {consultError && <div className="hint error-text">{consultError}</div>}

                    <div className="modal-footer-box">
                      <div className="modal-email-note">
                        Inquiry routes directly to <strong>Product@foodypay.in</strong>
                      </div>
                      <button
                        type="submit"
                        className="btn primary"
                        style={{ width: '100%', marginTop: '10px' }}
                      >
                         Confirm Appointment &amp; Email Team
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="appointment-success-box">
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}></div>
                  <h3>Appointment Request Sent!</h3>
                  <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
                    Your consultation request has been prepared and routed to <strong>Product@foodypay.in</strong>. Our product architects will review your requirements and reach out within 4 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPARISON SLIDER */}
        <div className="fit">
          <div>
            <h3>Cost Optimizer: Which plan saves you the most?</h3>
            <p>Drag the slider to your estimated monthly QR volume. The most profitable option is highlighted with a star.</p>
          </div>
          <div className="panel">
            <label htmlFor="qrS">
              Monthly QR sales <b>{inr(qrSales)}</b>
            </label>
            <input
              type="range"
              id="qrS"
              min="0"
              max="3000000"
              step="10000"
              value={qrSales}
              onChange={(e) => setQrSales(Number(e.target.value))}
            />
            
            <div className="cmp">
              {rows.map((r) => {
                const isBest = r.cost === minCost;
                const barWidth = Math.max(4, (r.cost / maxBarCost) * 100);
                return (
                  <div key={r.name} className={`cmp-row ${isBest ? 'best' : ''}`}>
                    <span>{r.name}</span>
                    <div className="bar">
                      <i style={{ width: `${barWidth}%` }} />
                    </div>
                    <b>
                      {inr(r.cost)}
                    </b>
                  </div>
                );
              })}
            </div>
            
            <div className="fx">
              Converted at ₹{FX}/$1. Counter orders are always ₹0 on every single plan.
            </div>
          </div>
        </div>

        {/* WALLET & NO PRESSURE */}
        <div className="wallet">
          <div>
            <h3>Fair Prepaid Wallet</h3>
            <ul>
              <li>Instant top-up via UPI, cards or netbanking</li>
              <li>Automated GST invoice provided for every top-up</li>
              <li>Fees deducted only when bills settle — never on placed orders</li>
              <li>Full refund protection: voided items credit fees straight back</li>
            </ul>
          </div>
          <div>
            <h3>Zero Lock-In Guarantee</h3>
            <p>
              Every plan gives you the full interconnected guest, kitchen, billing and reporting system. Upgrade, downgrade or switch anytime with zero cancellation penalties.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
