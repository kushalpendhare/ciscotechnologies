import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/partners', label: 'Partners' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#00bceb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>Cisco Technologies</span>
            <div style={{ fontSize: '0.65rem', color: '#888', lineHeight: 1, marginTop: 1 }}>UC & CC Transformation</div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '6px 14px', borderRadius: 4, fontSize: '0.88rem',
              color: pathname === l.to ? '#00bceb' : '#444',
              background: pathname === l.to ? '#e6f7fc' : 'transparent',
              fontWeight: pathname === l.to ? 600 : 400,
              borderBottom: pathname === l.to ? '2px solid #00bceb' : '2px solid transparent',
              transition: 'all .15s'
            }}>{l.label}</Link>
          ))}
          <a href="https://support.ciscotechnologies.com" style={{
            marginLeft: 8, padding: '8px 18px', borderRadius: 4,
            background: '#00bceb', color: '#fff', fontWeight: 600, fontSize: '0.88rem'
          }}>Support Portal</a>
        </div>
      </div>
    </nav>
  )
}