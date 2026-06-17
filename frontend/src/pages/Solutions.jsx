import PageHero from '../components/PageHero'
import Footer from '../components/Footer'
import ScrollReveal from '../components/ScrollReveal'

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
    <>
      <PageHero
        eyebrow="What We Offer"
        title="Our Solutions"
        subtitle="Purpose-built offerings across UC, CC, and managed services — designed for enterprise scale."
      />

      <div className="page">
        <div className="grid-2">
          {solutions.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.06}>
              <div className="card card-hover hover-lift">
                <span className={`badge ${s.badge}`}>{s.badgeText}</span>
                <p className="solution-title">{s.title}</p>
                <p className="solution-desc">{s.desc}</p>
                <ul className="feature-list">
                  {s.features.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <Footer />
    </>
  )
}
