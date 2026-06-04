import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const fallback = [
  { id: 1, title: 'Avaya to Cisco Migration', client: 'Financial Services Co.', summary: 'Full UC migration from Avaya to Cisco Webex Calling across 3 sites, 1,800 users migrated with zero downtime cutover.', outcome: 'Reduced telephony costs by 40%', badge: 'badge-blue', icon: '🏦', duration: '6 months', users: '1,800' },
  { id: 2, title: 'Genesys Cloud CC Deployment', client: 'Retail Chain', summary: 'Deployed Genesys Cloud for a 500-seat contact center with omnichannel routing across voice, chat, and email.', outcome: 'CSAT improved from 72% to 89%', badge: 'badge-orange', icon: '🛒', duration: '4 months', users: '500' },
  { id: 3, title: 'NICE WFM Implementation', client: 'Healthcare Provider', summary: 'Workforce management rollout across 3 contact centers, 1,200 agents. Included AI forecasting and schedule optimization.', outcome: 'Schedule adherence improved by 25%', badge: 'badge-purple', icon: '🏥', duration: '3 months', users: '1,200' },
  { id: 4, title: 'Cisco UCCE Upgrade', client: 'Insurance Group', summary: 'Major version upgrade of Cisco UCCE across 4 sites. Included CVP scripting refresh and Finesse agent desktop migration.', outcome: 'First call resolution up 18%', badge: 'badge-green', icon: '🏢', duration: '5 months', users: '320' },
]

function CaseCard({ study, index }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="case-card" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`
    }}>
      <div className="case-card-top">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2.4rem' }}>{study.icon || '📋'}</span>
          <span className={`badge ${study.badge || 'badge-blue'}`} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Case Study</span>
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: 16, marginBottom: 4 }}>{study.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Client: {study.client}</p>
      </div>
      <div className="case-card-body">
        <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 16 }}>{study.summary}</p>
        {(study.duration || study.users) && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            {study.duration && <span style={{ fontSize: '0.8rem', color: '#888' }}>⏱ {study.duration}</span>}
            {study.users && <span style={{ fontSize: '0.8rem', color: '#888' }}>👥 {study.users} users</span>}
          </div>
        )}
        <div className="outcome-box">
          <p style={{ color: '#007a3d', fontSize: '0.88rem', fontWeight: 600 }}>📈 Outcome: {study.outcome}</p>
        </div>
      </div>
    </div>
  )
}

export default function CaseStudies() {
  const [studies, setStudies] = useState(fallback)

  useEffect(() => {
    axios.get('/api/case-studies')
      .then(r => { if (Array.isArray(r.data) && r.data.length) setStudies(r.data) })
      .catch(() => {})
  }, [])

  return (
    <>
      <div style={{ background: '#1a1a1a', padding: '64px 24px 48px', textAlign: 'center' }}>
        <p style={{ color: '#00bceb', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Client Success</p>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>Case Studies</h1>
        <p style={{ color: '#aaa', maxWidth: 540, margin: '0 auto' }}>Real outcomes delivered for our clients across UC, CC, and managed services.</p>
      </div>

      <div className="page">
        <div className="grid-2">
          {studies.map((s, i) => <CaseCard key={s.id || i} study={s} index={i} />)}
        </div>
      </div>

      <footer><p>© 2025 Cisco Technologies. All rights reserved.</p></footer>
    </>
  )
}