import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration } from '../utils/soundEffects';

export function parsePlanMeta(plan) {
  const p = (plan || '').toLowerCase();
  if (p.includes('35') || p.includes('pro') || p.includes('growth')) {
    return {
      key: '35 Dollar',
      displayName: '$35 Dollar Plan (Growth Pro)',
      shortBadge: '⚡ $35 Dollar Plan',
      pricing: '$35 / month',
      whatsappTag: '35 Dollar Plan ($35/mo - Growth Pro)'
    };
  }
  if (p.includes('75') || p.includes('max') || p.includes('enterprise')) {
    return {
      key: '75 Dollar',
      displayName: '$75 Dollar Plan (Enterprise Max)',
      shortBadge: '🌟 $75 Dollar Plan',
      pricing: '$75 / month',
      whatsappTag: '75 Dollar Plan ($75/mo - Enterprise Max)'
    };
  }
  if (p.includes('custom') || p.includes('bespoke') || p.includes('white')) {
    return {
      key: 'Custom',
      displayName: 'Custom Plan (White-Label & Bespoke Features)',
      shortBadge: '🏢 Custom Plan',
      pricing: 'Custom / White-Label',
      whatsappTag: 'Custom Plan (White-Label & Bespoke Features)'
    };
  }
  return {
    key: 'Free',
    displayName: 'Free Plan ($0 / Forever Free)',
    shortBadge: '🟢 Free Plan ($0/mo)',
    pricing: '$0 / Forever',
    whatsappTag: 'Free Plan ($0/mo Forever)'
  };
}

export default function SignupModal({ isOpen, onClose, selectedPlan }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [activePlan, setActivePlan] = useState('Free');
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setCity('');
      setError('');
      setIsDone(false);
      setWhatsappLink('');
      setActivePlan(selectedPlan || 'Free');
    }
  }, [isOpen, selectedPlan]);

  if (!isOpen) return null;

  const currentPlanMeta = parsePlanMeta(activePlan);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCity = city.trim();

    if (!cleanName) {
      setError('Please enter your restaurant name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setError('');

    // Target WhatsApp Number: +91 7496888449
    const targetPhone = '917496888449';
    const planTag = currentPlanMeta.whatsappTag;

    const messageText = `Hello FoodyPay Team! 🍽️\n\nI want to *Request for create Account* on FoodyPay.\n\n📋 *Restaurant Details:*\n• Restaurant Name: ${cleanName}\n• Contact Number: +91 ${cleanPhone}\n${cleanCity ? `• City / Location: ${cleanCity}\n` : ''}• Selected Plan: *${planTag}*\n\nPlease help me set up my restaurant digital menu and QR code ordering system. Thank you!`;

    const generatedWaUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(messageText)}`;
    setWhatsappLink(generatedWaUrl);

    // Open WhatsApp in new tab / app
    try {
      window.open(generatedWaUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Could not auto-open WhatsApp:', err);
    }

    // Play celebration effects
    try {
      playMilestoneCelebration();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.4 },
        colors: ['#FF5E14', '#22C55E', '#25D366', '#FF9F43']
      });
    } catch (err) {
      // ignore
    }

    setIsDone(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="close" onClick={onClose} aria-label="Close">×</button>

        {!isDone ? (
          <div id="dForm">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="chip" style={{ margin: 0 }}>{currentPlanMeta.shortBadge}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--brand)' }}>{currentPlanMeta.pricing}</span>
            </div>

            <h3 style={{ marginTop: '6px' }}>Start with FoodyPay</h3>
            <p className="modal-sub" style={{ marginBottom: '10px' }}>
              Select your plan tier and enter details to connect with us on WhatsApp (+91 7496888449).
            </p>

            {/* INTERACTIVE PLAN SWITCHER TABS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                marginBottom: '16px',
                background: 'rgba(0,0,0,0.03)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              {[
                { id: 'Free', label: '🟢 Free', sub: '$0/mo' },
                { id: '35 Dollar', label: '⚡ $35', sub: '$35/mo' },
                { id: '75 Dollar', label: '🌟 $75', sub: '$75/mo' },
                { id: 'Custom', label: '🏢 Custom', sub: 'Bespoke' }
              ].map((p) => {
                const isSel = currentPlanMeta.key === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePlan(p.id)}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '8px',
                      border: isSel ? '2px solid var(--brand)' : '1px solid transparent',
                      background: isSel ? '#FFF2EB' : 'transparent',
                      color: isSel ? 'var(--brand)' : 'inherit',
                      cursor: 'pointer',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: isSel ? '800' : '600' }}>{p.label}</div>
                    <div style={{ fontSize: '0.68rem', color: isSel ? 'var(--brand)' : 'var(--muted)' }}>{p.sub}</div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field">
                Restaurant / Cafe Name *
                <input
                  type="text"
                  placeholder="e.g. Sharma's Kitchen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="organization"
                  autoFocus
                  required
                />
              </label>

              <label className="field">
                WhatsApp Phone Number *
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </label>

              <label className="field">
                City / Location (Optional)
                <input
                  type="text"
                  placeholder="e.g. Jaipur, Rajasthan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>

              {error && <div className="hint error-text" style={{ color: '#ef4444', marginTop: '6px', fontSize: '0.85rem' }}>{error}</div>}

              <button 
                type="submit" 
                className="btn primary" 
                style={{ 
                  width: '100%', 
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.96rem',
                  fontWeight: '700'
                }}
              >
                <span>💬</span> Request for create Account ({currentPlanMeta.shortBadge})
              </button>
            </form>
          </div>
        ) : (
          <div id="dDone" style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
            <h3>Request Sent, <span style={{ color: 'var(--brand)' }}>{name}</span>!</h3>
            <p className="modal-sub" style={{ margin: '10px 0 16px' }}>
              WhatsApp has been opened with your details for <b>{currentPlanMeta.displayName}</b>. Our team at <b>+91 7496888449</b> will assist you shortly.
            </p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn primary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#25D366',
                borderColor: '#25D366',
                color: '#fff',
                fontWeight: '700',
                padding: '12px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                marginBottom: '10px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
              }}
            >
              💬 Open WhatsApp Again
            </a>

            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              style={{ width: '100%', marginTop: '6px' }}
            >
              Done / Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

