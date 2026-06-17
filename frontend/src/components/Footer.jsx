import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="site-footer-name">Cisco Technologies</p>
            <p className="site-footer-tagline">UC & CC Transformation</p>
          </div>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link to="/solutions">Solutions</Link>
          <Link to="/partners">Partners</Link>
          <Link to="/case-studies">Case Studies</Link>
          <Link to="/contact">Contact</Link>
          <a href="https://support.ciscotechnologies.com">Support</a>
        </nav>
      </div>
      <p className="site-footer-copy">© 2025 Cisco Technologies. Lab environment — internal DevOps learning use.</p>
    </footer>
  )
}
