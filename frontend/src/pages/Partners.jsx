import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import Footer from '../components/Footer'

const partners = [
  {
    name: 'Cisco',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/320px-Cisco_logo_blue_2016.svg.png',
    color: '#00bceb',
    tier: 'Gold Partner',
    desc: 'The world\'s leading networking and UC vendor. We are certified in Cisco Webex Calling, CUCM, Cisco Contact Center Enterprise (UCCE/PCCE), and Cisco Unified Communications Manager.',
    specializations: ['Webex Calling', 'CUCM Administration', 'UCCE / PCCE', 'Cisco Expressway', 'Cisco Jabber'],
  },
  {
    name: 'Avaya',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Avaya_logo_2011.svg/320px-Avaya_logo_2011.svg.png',
    color: '#cc0000',
    tier: 'Authorized Partner',
    desc: 'Global leader in business communications. We specialize in Avaya Aura migrations, IX Messaging deployments, and cloud transformation projects helping customers move from on-prem Avaya to modern platforms.',
    specializations: ['Avaya Aura', 'IX Messaging', 'Avaya Cloud Office', 'Migration Services', 'Contact Center Elite'],
  },
  {
    name: 'Genesys',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Genesys_logo.svg/320px-Genesys_logo.svg.png',
    color: '#ff4f1f',
    tier: 'Certified Partner',
    desc: 'The leader in omnichannel customer experience. We design and deploy Genesys Cloud CX for enterprises requiring AI-powered routing, workforce engagement, and real-time analytics.',
    specializations: ['Genesys Cloud CX', 'Omnichannel Routing', 'WEM Suite', 'AI & Bots', 'Reporting & Analytics'],
  },
  {
    name: 'NICE',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/NICE_Systems_logo.svg/320px-NICE_Systems_logo.svg.png',
    color: '#7b2d8b',
    tier: 'Authorized Partner',
    desc: 'The global leader in workforce management and quality analytics. We implement NICE CXone, WFM forecasting, quality monitoring, and AI-driven performance analytics for contact centers.',
    specializations: ['NICE CXone', 'Workforce Management', 'Quality Monitoring', 'Recording & Analytics', 'AI Performance'],
  },
]

const tierColors = {
  'Gold Partner': '#f5a623',
  'Certified Partner': '#00bceb',
  'Authorized Partner': '#666',
}

export default function Partners() {
  return (
    <>
      <PageHero
        eyebrow="Technology Partnerships"
        title="Our Technology Partners"
        subtitle="We hold certifications across the industry's leading UC and Contact Center platforms, giving our clients access to unbiased, best-fit technology recommendations."
      />

      <div className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 64 }}>
          {partners.map(p => (
            <div key={p.name} className="card partner-row-card" style={{ borderLeft: `4px solid ${p.color}` }}>
              <div className="partner-row-grid">
                <div className="partner-row-aside">
                  <img
                    src={p.logoFull}
                    alt={p.name}
                    style={{ height: 48, width: 'auto', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                  />
                  <div style={{ display: 'none', fontSize: '1.8rem', fontWeight: 800, color: p.color }}>{p.name}</div>
                  <span
                    className="partner-tier"
                    style={{ background: tierColors[p.tier] + '20', color: tierColors[p.tier] }}
                  >
                    {p.tier}
                  </span>
                </div>
                <div className="partner-row-body">
                  <h2>{p.name}</h2>
                  <p>{p.desc}</p>
                  <p className="partner-tags-label">Specializations</p>
                  <div className="partner-tags">
                    {p.specializations.map(s => (
                      <span key={s} className="partner-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="info-callout">
          <p className="info-callout-title">Not sure which platform is right for you?</p>
          <p className="info-callout-sub">Our technology-agnostic consultants help you choose the best fit for your organization.</p>
          <Link to="/contact" className="btn btn-primary">Talk to a Specialist</Link>
        </div>
      </div>

      <Footer />
    </>
  )
}
