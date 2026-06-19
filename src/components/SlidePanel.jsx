import { useEffect } from 'react';

const PANEL_CONTENT = {
  about: {
    title: 'About Us',
    html: `
      <div class="slide-section">
        <h3>Who we are</h3>
        <p>Code Generator is a free, AI-powered tool that converts Figma designs into clean, production-ready code — instantly, with no account required.</p>
        <p>We believe the gap between design and code should be zero. Our mission is to help designers and developers ship faster together.</p>
      </div>
      <div class="slide-stat-row">
        <div class="slide-stat"><div class="slide-stat-num">10K+</div><div class="slide-stat-lbl">Banners generated</div></div>
        <div class="slide-stat"><div class="slide-stat-num">5</div><div class="slide-stat-lbl">Output formats</div></div>
        <div class="slide-stat"><div class="slide-stat-num">100%</div><div class="slide-stat-lbl">Free forever</div></div>
      </div>
      <div class="slide-section">
        <h3>What we support</h3>
        <p>HTML + CSS, React + CSS Modules, React + Tailwind, React + Inline Styles, and Vue + CSS — all generated from a single Figma URL in seconds.</p>
      </div>
    `
  },
  contact: {
    title: 'Contact Us',
    html: `
      <div class="slide-section">
        <h3>Get in touch</h3>
        <p>Have a question, suggestion, or found a bug? We read every message and reply within 24 hours.</p>
        <p style="margin-top:12px;">Use the feedback form or open a GitHub issue — we'll get back to you shortly.</p>
      </div>
    `
  }
};

export default function SlidePanel({ isOpen, panelKey, onClose }) {
  const data = PANEL_CONTENT[panelKey] || { title: '', html: '' };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className={`slide-overlay${isOpen ? ' open' : ''}`} onClick={onClose}></div>
      <div className={`slide-panel${isOpen ? ' open' : ''}`}>
        <div className="slide-panel-header">
          <div className="slide-panel-title">{data.title}</div>
          <button className="slide-close" onClick={onClose}>✕</button>
        </div>
        <div
          className="slide-panel-body"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </div>
    </>
  );
}
