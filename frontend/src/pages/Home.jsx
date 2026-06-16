import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Footer from '../components/Footer'

const slides = [
  {
    tag: 'Unified Communications',
    title: <>Modernize Your <span>Communications</span> Infrastructure</>,
    desc: 'We help enterprises migrate from legacy PBX systems to cloud-first unified communications platforms with zero business disruption.',
    icon: '📞',
    cta: { label: 'Explore Solutions', to: '/solutions' }
  },
  {
    tag: 'Contact Center',
    title: <>Transform Your <span>Customer Experience</span></>,
    desc: 'Deploy omnichannel contact center solutions powered by Cisco, Genesys, and NICE — from design to go-live in weeks.',
    icon: '🎧',
    cta: { label: 'View Case Studies', to: '/case-studies' }
  },
  {
    tag: 'Managed Services',
    title: <><span>24/7</span> Managed Support for On-Premises UC</>,
    desc: 'Proactive monitoring, patching, and incident response keeping your on-prem Cisco and Avaya infrastructure healthy around the clock.',
    icon: '🛡️',
    cta: { label: 'Our Partners', to: '/partners' }
  },
  {
    tag: 'Cloud Migration',
    title: <>Your Journey to the <span>Cloud</span> Starts Here</>,
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
      <div className="hero-slider">
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide ${i === active ? 'active' : ''}`}>
            <div>
              <span className="badge badge-blue">{s.tag}</span>
              <h1>{s.title}</h1>
              <p>{s.desc}</p>
              <Link to={s.cta.to} className="btn btn-primary">{s.cta.label}</Link>
            </div>
            <div className="hero-visual">
              <div className="hero-visual-grid" aria-hidden="true" />
              <div className="hero-visual-glow" aria-hidden="true" />
              <span className="hero-visual-icon">{s.icon}</span>
            </div>
          </div>
        ))}
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={`slider-dot ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stats-bar-inner">
          {stats.map(s => (
            <div key={s.label}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page">
        <div className="section-header centered" style={{ marginBottom: 56 }}>
          <span className="section-eyebrow">Our Expertise</span>
          <p className="section-title">What We Do</p>
          <p className="section-sub">Full lifecycle services from design to managed support</p>
        </div>

        <div className="grid-3" style={{ marginBottom: 80 }}>
          {services.map((s, i) => (
            <div key={s.title} className="card service-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="service-icon">{s.icon}</div>
              <p className="service-title">{s.title}</p>
              <p className="service-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="cta-banner">
          <div>
            <p className="cta-banner-title">Ready to transform your communications?</p>
            <p className="cta-banner-sub">Talk to one of our UC & CC specialists today.</p>
          </div>
          <div className="cta-banner-actions">
            <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
            <Link to="/solutions" className="btn btn-ghost-light">View Solutions</Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
