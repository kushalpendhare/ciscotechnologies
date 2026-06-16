import { useState } from 'react'
import axios from 'axios'
import PageHero from '../components/PageHero'
import Footer from '../components/Footer'

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
    <>
      <PageHero
        eyebrow="Get In Touch"
        title="Contact Us"
        subtitle="Reach our team of UC & CC specialists for consultations, support, or partnership enquiries."
      />

      <div className="page">
        <div className="contact-grid">
          <div className="contact-info-stack">
            {info.map(i => (
              <div key={i.label} className="card card-hover contact-info-item">
                <div className="contact-info-icon">{i.icon}</div>
                <div>
                  <p className="contact-info-label">{i.label}</p>
                  <p className="contact-info-value">{i.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card contact-form-card">
            <p className="contact-form-title">Send Us a Message</p>

            {sent && <div className="alert alert-success">Thanks! Our team will be in touch shortly.</div>}
            {error && <div className="alert alert-error">{error}</div>}

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

            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
