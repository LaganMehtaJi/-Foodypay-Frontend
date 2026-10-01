import React, { useState } from 'react';

export default function GuestExperience() {
  const [rating, setRating] = useState(0);

  const handleStarClick = (starIndex) => {
    setRating(starIndex);
  };

  return (
    <section className="guest" id="guest">
      <div className="wrap">
        <h2>Frictionless Guest Experience</h2>
        <p className="lead">Zero app downloads. Zero registration barriers. Diners scan the table QR, open your rich visual food catalog on their mobile phone, and pay the moment they are done.</p>

        {/* VISUAL SPOTLIGHT: QR ON TABLE & MOBILE CATALOG IN CUSTOMER HAND */}
        <div className="guest-visual-spotlight-grid">
          <div className="guest-spotlight-card">
            <div className="spotlight-img-frame">
              <img
                src="/Section-Images/catalog-hand.png"
                alt="Customer holding smartphone with open food catalog at restaurant table"
                className="spotlight-photo"
                loading="lazy"
              />
              <div className="spotlight-overlay-badge">
                <span className="live-sparkle-dot" />
                <span> Food Catalog in Customer's Hand</span>
              </div>
            </div>
            <div className="spotlight-body">
              <h4>Interactive Mobile Digital Catalog</h4>
              <p>Guests view appetizing high-definition dish photos, customize toppings, check spice levels &amp; order with zero friction right from their table.</p>
              <div className="spotlight-meta-tags">
                <span> Real Food Photos</span>
                <span> 1-Tap Cart</span>
                <span> Veg / Non-Veg Badges</span>
              </div>
            </div>
          </div>

          <div className="guest-spotlight-card">
            <div className="spotlight-img-frame">
              <img
                src="/Section-Images/qr-table.png"
                alt="QR Code on dining table for instant contactless food ordering"
                className="spotlight-photo"
                loading="lazy"
              />
              <div className="spotlight-overlay-badge">
                <span className="live-sparkle-dot" />
                <span>🪑 QR Code on Table for Orders</span>
              </div>
            </div>
            <div className="spotlight-body">
              <h4>Instant Table QR Stand</h4>
              <p>Place sleek acrylic QR stands on every table. Diners simply point their phone camera to instantly unlock your restaurant's digital storefront.</p>
              <div className="spotlight-meta-tags">
                <span> Zero App Download</span>
                <span>⏱️ Cuts Wait Time by 40%</span>
                <span> Instant UPI Payment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="guest-grid">
          <ol className="flow">
            <li>
              <div>
                <b>Instant Table QR Scan</b>
                <span>Launches immediately in any mobile browser with zero app installation.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Interactive Visual Menu</b>
                <span>Appetizing photos, spice levels, dietary tags &amp; live item availability.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Live Kitchen Tracker</b>
                <span>Real-time status transparency: Placed  Preparing  Ready  Served.</span>
              </div>
            </li>
            <li>
              <div>
                <b>One-Tap Waiter Summon</b>
                <span>Guests can request assistance or water with a gentle table notification.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Smart Loyalty &amp; Rewards</b>
                <span>Automated cashback points, return coupons &amp; gamified happy hour perks.</span>
              </div>
            </li>
            <li>
              <div>
                <b>Private Reputation Shield</b>
                <span>Negative feedback is routed privately to the manager; 5-star diners go to Google.</span>
              </div>
            </li>
          </ol>

          <div className="fb">
            <h3>Private Reputation Guardian</h3>
            <p>Tap a star to see how FoodyPay protects your restaurant rating automatically.</p>
            
            <div className="stars" role="group" aria-label="Rate your meal">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={rating >= star ? 'on' : ''}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  onClick={() => handleStarClick(star)}
                >
                  
                </button>
              ))}
            </div>

            <div className="fb-out">
              {rating === 0 && (
                <>
                  <b>Interactive Reputation Routing</b>
                  Happy guests are automatically prompted to leave glowing public Google reviews.
                </>
              )}
              {rating > 0 && rating <= 3 && (
                <>
                  <b>Guest sees: We're on it right away. </b>
                  Feedback is routed privately to the owner's dashboard with table and order details — protecting you from public 1-star reviews.
                </>
              )}
              {rating >= 4 && (
                <>
                  <b>Guest sees: Thank you so much! </b>
                  They are invited to share their experience on Google Maps / Zomato with bonus loyalty points.
                </>
              )}
            </div>

            <div className="perks">
              <span>Points</span>
              <span>Coupons</span>
              <span>Happy hour</span>
              <span>Mini games</span>
            </div>
          </div>
        </div>

        <p className="tag" style={{ marginTop: '36px' }}>
          Turn first-time diners into passionate lifetime regulars.
        </p>
      </div>
    </section>
  );
}
