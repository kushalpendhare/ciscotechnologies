import { useState } from 'react'
import axios from 'axios'

const info = [
  { icon: '📧', label: 'General Enquiries', value: 'info@ciscotechnologies.com' },
  { icon: '🛠️', label: 'Technical Support', value: 'support@ciscotechnologies.com' },
  { icon: '💼', label: 'Sales & Partnerships', value: 'sales@ciscotechnologies.com' },
  { icon: '📞', label: 'Phone', value: '+1 (800) 555-0199' },
  { icon: '🌐', label: 'Website', value: 'www.ciscotechnologies.com' },
  { icon: '🕐', label: 'Support Hours', value: 'Mon–Fri 8am–8pm EST' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!form.name || !form.email || !form.company || !form.message) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/contact', form)
      setSent(true)
      setForm({ name: '', email: '', company: '', phone: '', message: '' })
    } catch {
      setError('Something went wrong. Please try again or email us directly.')
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <p className="section-title">Contact Us</p>
      <p className="section-sub">Get in touch with our team of UC & CC specialists</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 32, alignItems: 'start', marginTop: 32 }}>

        {/* Left column — contact info, stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {info.map(i => (
            <div key={i.label} className="card card-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, margin: 0 }}>
              <span style={{ fontSize: '1.8rem' }}>{i.icon}</span>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>{i.label}</p>
                <p style={{ fontWeight: 600, color: '#1a1a1a' }}>{i.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right column — form */}
        <div className="card" style={{ margin: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Send Us a Message</p>

          {sent && <div className="alert alert-success">✅ Thanks! Our team will be in touch shortly.</div>}
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <label>Full Name *</label>
          <input placeholder="John Smith" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />

          <label>Email *</label>
          <input type="email" placeholder="john@company.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />

          <label>Company *</label>
          <input placeholder="Acme Corp" value={form.company}
            onChange={e => setForm({ ...form, company: e.target.value })} />

          <label>Phone</label>
          <input placeholder="+1 555 000 0000" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })} />

          <label>Message *</label>
          <textarea rows={4} placeholder="How can we help?" value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })} />

          <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', padding: 12 }}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>

      {/* Stack on small screens */}
      <style>{`
        @media (max-width: 860px) {
          .page > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}