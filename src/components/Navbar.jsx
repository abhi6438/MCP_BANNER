export default function Navbar({ onOpenPanel }) {
  return (
    <nav className="navbar">
      <a href="#" className="navbar-brand">
        <div className="navbar-brand-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        Code Generator
      </a>
      <div className="navbar-links">
        <a href="#" className="nav-link active" onClick={e => e.preventDefault()}>Home</a>
        <a href="#" className="nav-link" onClick={e => { e.preventDefault(); onOpenPanel('about'); }}>About</a>
        <a href="#" className="nav-link" onClick={e => { e.preventDefault(); onOpenPanel('contact'); }}>Contact</a>
        <a href="/privacy" className="nav-link">Privacy</a>
      </div>
      <div className="navbar-actions">
        <span className="nav-free-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          Free Forever · AI-Powered · No Account Needed
        </span>
      </div>
    </nav>
  );
}
