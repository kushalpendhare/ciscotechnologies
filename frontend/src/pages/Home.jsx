import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const slides = [
  {
    tag: 'Unified Communications',
    title: 'Modernize Your Communications Infrastructure',
    desc: 'We help enterprises migrate from legacy PBX systems to cloud-first unified communications platforms with zero business disruption.',
    icon: '📞',
    cta: { label: 'Explore Solutions', to: '/solutions' }
  },
  {
    tag: 'Contact Center',
    title: 'Transform Your Customer Experience',
    desc: 'Deploy omnichannel contact center solutions powered by Cisco, Genesys, and NICE — from design to go-live in weeks.',
    icon: '🎧',
    cta: { label: 'View Case Studies', to: '/case-studies' }
  },
  {
    tag: 'Managed Services',
    title: '24/7 Managed Support for On-Premises UC',
    desc: 'Proactive monitoring, patching, and incident response keeping your on-prem Cisco and Avaya infrastructure healthy around the clock.',
    icon: '🛡️',
    cta: { label: 'Our Partners', to: '/partners' }
  },
  {
    tag: 'Cloud Migration',
    title: 'Your Journey to the Cloud Starts Here',
    desc: 'Structured migration paths from Avaya Aura, Cisco CUCM, or any legacy platform to modern cloud communications.',
    icon: '☁️',
    cta: { label: 'Contact Us', to: '/contact' }
  },
]

const services = [
  { icon: '🔄', title: 'UC Transformation', desc: 'End-to-end migration from legacy PBX to modern unified communications.' },
  { icon: '📞', title: 'Contact Center Design', desc: 'Architect and deploy multi-channel contact center solutions.' },
  { icon: '🛠️', title: 'Managed Services', desc: 'Proactive monitoring and support for on-premises UC infrastructure.' },
  { icon: '☁️', title: 'Cloud Migration', desc: 'Seamless lift-and-shift or phased migration to cloud platforms.' },
  { icon: '📊', title: 'WFM & Analytics', desc: 'Workforce management, reporting, and AI-driven insights.' },
  { icon: '🔐', title: 'Security & Compliance', desc: 'Secure your communications with zero-trust architecture.' },
]

const stats = [
  { value: '200+', label: 'Deployments' },
  { value: '15+', label: 'Years Experience' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '24/7', label: 'Support Coverage' },
]

export default function Home() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActive(p => (p + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Hero Slider */}
      <div className="hero-slider" style={{ borderBottom: '1px solid #e0e0e0' }}>
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide ${i === active ? 'active' : ''}`}>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: 16 }}>{s.tag}</span>
              <h1>{s.title}</h1>
              <p>{s.desc}</p>
              <Link to={s.cta.to} className="btn btn-primary">{s.cta.label}</Link>
            </div>
            <div className="hero-visual">{s.icon}</div>
          </div>
        ))}
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button key={i} className={`slider-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: '#00bceb', padding: '24px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page">
        {/* Services */}
        <div style={{ marginBottom: 80 }}>
          <p className="section-title">What We Do</p>
          <p className="section-sub">Full lifecycle services from design to managed support</p>
          <div className="grid-3">
            {services.map((s, i) => (
              <div key={s.title} className="card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{s.icon}</div>
                <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8, color: '#1a1a1a' }}>{s.title}</p>
                <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Ready to transform your communications?</p>
            <p style={{ color: '#aaa' }}>Talk to one of our UC & CC specialists today.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
            <Link to="/solutions" className="btn btn-outline">View Solutions</Link>
          </div>
        </div>
      </div>

      <footer>
        <p>© 2025 Cisco Technologies. All rights reserved.</p>
        <p style={{ marginTop: 8 }}><Link to="/contact">Contact</Link> · <Link to="/support">Support</Link> · <Link to="/admin">Admin</Link></p>
      </footer>
    </>
  )
}