const solutions = [
  {
    badge: 'badge-blue', badgeText: 'Unified Communications',
    title: 'Cisco Webex Calling', partner: 'Cisco',
    desc: 'Cloud-based calling solution replacing traditional PBX with enterprise-grade features.',
    features: ['Auto-attendant & IVR', 'Mobile & desktop apps', 'PSTN replacement', 'E911 compliance'],
  },
  {
    badge: 'badge-orange', badgeText: 'Contact Center',
    title: 'Genesys Cloud CX', partner: 'Genesys',
    desc: 'All-in-one cloud contact center platform with omnichannel routing and AI.',
    features: ['Voice, chat, email, SMS', 'AI-powered routing', 'Real-time dashboards', 'Open APIs'],
  },
  {
    badge: 'badge-purple', badgeText: 'Workforce Management',
    title: 'NICE CXone WFM', partner: 'NICE',
    desc: 'Intelligent workforce management, scheduling, and quality assurance platform.',
    features: ['AI forecasting', 'Agent scheduling', 'QA & recording', 'Performance analytics'],
  },
  {
    badge: 'badge-green', badgeText: 'Managed Services',
    title: 'On-Premises Support', partner: 'Cisco / Avaya',
    desc: 'Proactive managed services keeping your on-prem UC infrastructure healthy 24/7.',
    features: ['24/7 monitoring', 'Patch management', 'Incident response', 'Capacity planning'],
  },
  {
    badge: 'badge-blue', badgeText: 'Migration',
    title: 'Avaya to Cloud', partner: 'Avaya',
    desc: 'Structured migration path from Avaya Aura to modern cloud communications.',
    features: ['Zero downtime cutover', 'Number porting', 'User training', 'Hybrid bridge period'],
  },
  {
    badge: 'badge-orange', badgeText: 'Analytics',
    title: 'CX Analytics & BI', partner: 'All Platforms',
    desc: 'Custom reporting and business intelligence across your entire CC estate.',
    features: ['Cross-platform reporting', 'Custom KPI dashboards', 'Voice of customer', 'Agent performance'],
  },
]

export default function Solutions() {
  return (
    <div className="page">
      <p className="section-title">Our Solutions</p>
      <p className="section-sub">Purpose-built offerings across UC, CC, and managed services</p>

      <div className="grid-2">
        {solutions.map(s => (
          <div key={s.title} className="card">
            <span className={`badge ${s.badge}`}>{s.badgeText}</span>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{s.title}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>{s.desc}</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.features.map(f => (
                <li key={f} style={{ color: '#64748b', fontSize: '0.85rem' }}>✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}