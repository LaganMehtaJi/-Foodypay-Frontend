import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-wrap">
        <a className="logo" href="#top" aria-label="FoodyPay home">
          <video
            src="/Logo_Vidio.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="logo-video"
            title="FoodyPay"
          />
        </a>

        <div className="footer-center-tag">
          <span>FoodyPay — Next-Gen Restaurant Operating System &amp; POS. Scaling 1,200+ dining destinations across India &amp; Australia at <a href="https://foodypay.in" target="_blank" rel="noopener noreferrer" className="footer-site-link">foodypay.in ↗</a></span>
        </div>

        <div className="footer-right">
          <span>Faster orders. Happier diners. Higher profits.</span>
        </div>
      </div>
    </footer>
  );
}
