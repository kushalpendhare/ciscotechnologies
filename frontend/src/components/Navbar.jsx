import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/partners', label: 'Partners' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="navbar-title">Cisco Technologies</span>
            <span className="navbar-subtitle">UC & CC Transformation</span>
          </div>
        </Link>

        <div className="navbar-links">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-link${pathname === l.to ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
          <a href="https://support.ciscotechnologies.com" className="navbar-cta">
            Support Portal
          </a>
        </div>

        <button
          type="button"
          className={`navbar-toggle${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`navbar-mobile${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="navbar-mobile-inner">
          {links.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-mobile-link${pathname === l.to ? ' active' : ''}`}
              style={{ '--i': i }}
            >
              {l.label}
            </Link>
          ))}
          <a href="https://support.ciscotechnologies.com" className="navbar-mobile-cta">
            Support Portal
          </a>
        </div>
      </div>
    </nav>
  )
}
