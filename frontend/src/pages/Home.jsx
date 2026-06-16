import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import ScrollReveal from '../components/ScrollReveal'

const slides = [
  {
    tag: 'Unified Communications',
    title: <>Modernize Your <span>Communications</span> Infrastructure</>,
    desc: 'We help enterprises migrate from legacy PBX systems to cloud-first unified communications platforms with zero business disruption.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Team collaborating in a modern video conference meeting',
    cta: { label: 'Explore Solutions', to: '/solutions' }
  },
  {
    tag: 'Contact Center',
    title: <>Transform Your <span>Customer Experience</span></>,
    desc: 'Deploy omnichannel contact center solutions powered by Cisco, Genesys, and NICE — from design to go-live in weeks.',
    image: 'https://images.unsplash.com/photo-1556745735-eef6f2a8c317?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Contact center agent assisting a customer with a headset',
    cta: { label: 'View Case Studies', to: '/case-studies' }
  },
  {
    tag: 'Managed Services',
    title: <><span>24/7</span> Managed Support for On-Premises UC</>,
    desc: 'Proactive monitoring, patching, and incident response keeping your on-prem Cisco and Avaya infrastructure healthy around the clock.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Network operations center with server infrastructure monitoring',
    cta: { label: 'Our Partners', to: '/partners' }
  },
  {
    tag: 'Cloud Migration',
    title: <>Your Journey to the <span>Cloud</span> Starts Here</>,
    desc: 'Structured migration paths from Avaya Aura, Cisco CUCM, or any legacy platform to modern cloud communications.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Global cloud connectivity and digital transformation concept',
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
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    slides.forEach(s => {
      const img = new Image()
      img.src = s.image
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setActive(p => (p + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index) => {
    setDirection(index > active ? 1 : -1)
    setActive(index)
  }

  return (
    <>
      <div className="hero-slider">
        <div className="hero-slides-stack">
          {slides.map((s, i) => (
            <article
              key={s.tag}
              className={`hero-slide${i === active ? ' active' : ''}${i < active ? ' before' : ''}${i > active ? ' after' : ''}`}
              aria-hidden={i !== active}
              data-direction={direction}
            >
              <div className="hero-slide-copy">
                <span className="badge badge-blue hero-badge">{s.tag}</span>
                <h1>{s.title}</h1>
                <p>{s.desc}</p>
                <Link to={s.cta.to} className="btn btn-primary hero-cta">{s.cta.label}</Link>
              </div>

              <figure className="hero-visual">
                <img
                  src={s.image}
                  alt={s.imageAlt}
                  className="hero-visual-img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className="hero-visual-overlay" aria-hidden="true" />
                <div className="hero-visual-shine" aria-hidden="true" />
              </figure>
            </article>
          ))}
        </div>

        <div className="slider-controls">
          <button
            type="button"
            className="slider-arrow slider-arrow-prev"
            aria-label="Previous slide"
            onClick={() => goToSlide((active - 1 + slides.length) % slides.length)}
          >
            ‹
          </button>
          <div className="slider-dots">
            {slides.map((s, i) => (
              <button
                key={s.tag}
                type="button"
                aria-label={`Go to slide: ${s.tag}`}
                className={`slider-dot${i === active ? ' active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="slider-arrow slider-arrow-next"
            aria-label="Next slide"
            onClick={() => goToSlide((active + 1) % slides.length)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stats-bar-inner">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} className="stat-item" delay={i * 0.08}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <div className="page">
        <ScrollReveal className="section-header centered section-header-reveal">
          <span className="section-eyebrow">Our Expertise</span>
          <p className="section-title">What We Do</p>
          <p className="section-sub">Full lifecycle services from design to managed support</p>
        </ScrollReveal>

        <div className="grid-3 services-grid">
          {services.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.07}>
              <div className="card service-card hover-lift">
                <div className="service-icon">{s.icon}</div>
                <p className="service-title">{s.title}</p>
                <p className="service-desc">{s.desc}</p>
                <span className="service-card-accent" aria-hidden="true" />
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="cta-banner hover-glow">
            <div>
              <p className="cta-banner-title">Ready to transform your communications?</p>
              <p className="cta-banner-sub">Talk to one of our UC & CC specialists today.</p>
            </div>
            <div className="cta-banner-actions">
              <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
              <Link to="/solutions" className="btn btn-ghost-light">View Solutions</Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <Footer />
    </>
  )
}
