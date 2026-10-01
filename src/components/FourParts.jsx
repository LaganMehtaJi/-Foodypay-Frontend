import React from 'react';

export default function FourParts() {
  return (
    <section id="how" className="how-section">
      <div className="wrap">
        <h2>Unified Ecosystem. Zero Disconnects.</h2>
        <p className="lead">
          From table QR scanning to kitchen preparation, managed CRM, and real-time ledger sync — FoodyPay unifies your entire restaurant. No juggling multiple tools, no lost tickets, no billing leaks.
        </p>

        <div className="parts">
          {/* PART 1: TABLE QR & ONLINE CATALOG */}
          <div className="part">
            <div className="part-media-box">
              <img
                src="/Section-Images/qr-table.png"
                alt="Table QR Code Stand for Food Orders"
                className="part-img"
                loading="lazy"
              />
              <span className="part-img-tag"> QR on Table</span>
            </div>
            <span className="part-num">01</span>
            <div className="part-icon-wrap"></div>
            <h3>Guest Table QR &amp; Web Store</h3>
            <p>Sleek FoodyPay QR tent card on every table. Diners scan and open your rich visual food catalog in their mobile browser with 0% app barrier.</p>
            <span className="who">Table QR &amp; Home Delivery</span>
          </div>

          {/* PART 2: DIGITAL FOOD CATALOG */}
          <div className="part">
            <div className="part-media-box">
              <img
                src="/Section-Images/catalog-hand.png"
                alt="Digital Food Catalog in Customer Hand"
                className="part-img"
                loading="lazy"
              />
              <span className="part-img-tag"> Catalog in Hand</span>
            </div>
            <span className="part-num">02</span>
            <div className="part-icon-wrap"></div>
            <h3>Interactive Mobile Catalog</h3>
            <p>Diners browse appetizing dish photos, select toppings, customize spice levels, and order directly from their phone with instant 1-tap cart.</p>
            <span className="who">Digital Catalog &amp; Cart</span>
          </div>

          {/* PART 3: LIVE KITCHEN KDS & COUNTER POS */}
          <div className="part">
            <div className="part-media-box">
              <img
                src="/Section-Images/kds-screen.png"
                alt="Counter POS Terminal and Live Kitchen KDS Display"
                className="part-img"
                loading="lazy"
              />
              <span className="part-img-tag"> POS &amp; KDS</span>
            </div>
            <span className="part-num">03</span>
            <div className="part-icon-wrap">‍</div>
            <h3>Rapid POS &amp; Live KDS</h3>
            <p>Lightning walk-in billing, cash drawer reconciliation, and live digital kitchen tickets with preparation countdowns and auditory alerts.</p>
            <span className="who">Counter POS &amp; Kitchen</span>
          </div>

          {/* PART 4: MANAGED CRM & ANALYTICS */}
          <div className="part">
            <div className="part-media-box">
              <img
                src="/Section-Images/crm-analytics.png"
                alt="FoodyPay Managed CRM and Restaurant Analytics Dashboard"
                className="part-img"
                loading="lazy"
              />
              <span className="part-img-tag"> Managed CRM</span>
            </div>
            <span className="part-num">04</span>
            <div className="part-icon-wrap"></div>
            <h3>Managed CRM &amp; Analytics</h3>
            <p>Track guest dining history, automated loyalty cashback, repeat customer retention campaigns, live gross margins &amp; hourly heatmaps.</p>
            <span className="who">Customer CRM &amp; Intelligence</span>
          </div>
        </div>

        <p className="tag">100% cloud synchronized · Zero latency across all dining tables, counter, kitchen &amp; CRM.</p>
      </div>
    </section>
  );
}
