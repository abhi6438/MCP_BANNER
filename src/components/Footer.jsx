export default function Footer({ onOpenPanel }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand-name">
        <div className="footer-brand-icon">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        Code Generator
      </div>
      <div className="footer-sep"></div>
      <div className="footer-links">
        <a href="#" className="footer-link">Home</a>
        <a href="#" className="footer-link" onClick={e => { e.preventDefault(); onOpenPanel('about'); }}>About</a>
        <a href="#" className="footer-link" onClick={e => { e.preventDefault(); onOpenPanel('contact'); }}>Contact</a>
        <a href="/privacy" className="footer-link">Privacy</a>
      </div>
      <div className="footer-copyright">
        &copy; {new Date().getFullYear()} Code Generator &nbsp;&middot;&nbsp; Free Forever · AI-Powered · No Account Needed
      </div>
    </footer>
  );
}
