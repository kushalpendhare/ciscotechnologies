import { useState } from 'react'
import axios from 'axios'

const categories = ['Network Issue', 'UC Platform', 'Contact Center', 'Voice Quality', 'Authentication', 'Hardware', 'Other']
const severities = ['Low', 'Medium', 'High', 'Critical']

export default function Support() {
  const [form, setForm] = useState({ requester: '', email: '', phone: '', severity: 'Medium', category: 'UC Platform', description: '' })
  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!form.requester || !form.email || !form.description) {
      setError('Please fill in Name, Email and Description.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/ticket', form)
      setTicket(res.data.ticket_id)
      setForm({ requester: '', email: '', phone: '', severity: 'Medium', category: 'UC Platform', description: '' })
    } catch {
      setError('Failed to submit ticket. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <p className="section-title">Raise a Support Ticket</p>
      <p className="section-sub">Our TAC team typically responds within 2 hours</p>

      {ticket && (
        <div className="alert alert-success">
          ✅ Ticket submitted successfully! Your ticket ID is <strong>#{ticket}</strong>. Keep this for reference.
        </div>
      )}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="card">
        <label>Full Name *</label>
        <input placeholder="John Smith" value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} />

        <label>Email Address *</label>
        <input type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

        <label>Phone Number</label>
        <input placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Severity</label>
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {severities.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <label>Description *</label>
        <textarea rows={5} placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', padding: '12px' }}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </div>
  )
}