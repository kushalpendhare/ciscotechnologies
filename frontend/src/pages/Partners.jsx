const partners = [
  {
    name: 'Cisco',
    logo: 'https://www.cisco.com/favicon.ico',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/320px-Cisco_logo_blue_2016.svg.png',
    color: '#00bceb',
    tier: 'Gold Partner',
    desc: 'The world\'s leading networking and UC vendor. We are certified in Cisco Webex Calling, CUCM, Cisco Contact Center Enterprise (UCCE/PCCE), and Cisco Unified Communications Manager.',
    specializations: ['Webex Calling', 'CUCM Administration', 'UCCE / PCCE', 'Cisco Expressway', 'Cisco Jabber'],
  },
  {
    name: 'Avaya',
    logo: 'https://www.avaya.com/favicon.ico',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Avaya_logo_2011.svg/320px-Avaya_logo_2011.svg.png',
    color: '#cc0000',
    tier: 'Authorized Partner',
    desc: 'Global leader in business communications. We specialize in Avaya Aura migrations, IX Messaging deployments, and cloud transformation projects helping customers move from on-prem Avaya to modern platforms.',
    specializations: ['Avaya Aura', 'IX Messaging', 'Avaya Cloud Office', 'Migration Services', 'Contact Center Elite'],
  },
  {
    name: 'Genesys',
    logo: 'https://www.genesys.com/favicon.ico',
    logoFull: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Genesys_logo.svg/320px-Genesys_logo.svg.png',
    color: '#ff4f1f',
    tier: 'Certified Partner',
    desc: 'The leader in omnichannel customer experience. We design and deploy Genesys Cloud CX for enterprises requiring AI-powered routing, workforce engagement, and real-time analytics.',
    specializations: ['Genesys Cloud CX', 'Omnichannel Routing', 'WEM Suite', 'AI & Bots', 'Reporting & Analytics'],
  },
  {
    name: 'NICE',
    logo: 'https://www.nice.com/favicon.ico',
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
      {/* Header */}
      <div style={{ background: '#1a1a1a', padding: '64px 24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#00bceb', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Technology Partnerships</p>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>Our Technology Partners</h1>
        <p style={{ color: '#aaa', maxWidth: 600, margin: '0 auto', fontSize: '1rem', lineHeight: 1.7 }}>
          We hold certifications across the industry's leading UC and Contact Center platforms, giving our clients access to unbiased, best-fit technology recommendations.
        </p>
      </div>

      <div className="page">
        {/* Partner Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 64 }}>
          {partners.map((p, i) => (
            <div key={p.name} className="card" style={{ borderLeft: `4px solid ${p.color}`, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0 }}>
                {/* Left */}
                <div style={{ background: '#fafafa', borderRight: '1px solid #e0e0e0', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
                  <img
                    src={p.logoFull}
                    alt={p.name}
                    style={{ height: 48, width: 'auto', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                  <div style={{ display: 'none', fontSize: '1.8rem', fontWeight: 800, color: p.color }}>{p.name}</div>
                  <span style={{ background: tierColors[p.tier] + '20', color: tierColors[p.tier], padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{p.tier}</span>
                </div>
                {/* Right */}
                <div style={{ padding: '32px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>{p.name}</h2>
                  <p style={{ color: '#555', lineHeight: 1.7, marginBottom: 20, fontSize: '0.95rem' }}>{p.desc}</p>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Specializations</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {p.specializations.map(s => (
                        <span key={s} style={{ background: '#f0f0f0', color: '#444', padding: '4px 12px', borderRadius: 4, fontSize: '0.82rem', fontWeight: 500 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Become a client CTA */}
        <div style={{ background: '#e6f7fc', border: '1px solid #b3e8f7', borderRadius: 8, padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Not sure which platform is right for you?</p>
          <p style={{ color: '#555', marginBottom: 24 }}>Our technology-agnostic consultants help you choose the best fit for your organization.</p>
          <a href="/contact" className="btn btn-primary">Talk to a Specialist</a>
        </div>
      </div>

      <footer>
        <p>© 2025 Cisco Technologies. All rights reserved.</p>
      </footer>
    </>
  )
}