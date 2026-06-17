import { useState, useEffect } from 'react'
import axios from 'axios'

// ── Constants ─────────────────────────────────────────
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const STATUS_STYLE = {
  New:           { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'In Progress': { bg: '#eff6ff', color: '#0070d2', border: '#bfdbfe' },
  Closed:        { bg: '#f5f5f5', color: '#666',    border: '#e0e0e0' },
  Escalated:     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const PRIORITY_STYLE = {
  Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  High:     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Medium:   { bg: '#eff6ff', color: '#0070d2', border: '#bfdbfe' },
  Low:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('cisco_support_token')}`
})

const Pill = ({ label, styleMap }) => {
  const st = styleMap?.[label] || { bg: '#f5f5f5', color: '#666', border: '#e0e0e0' }
  return (
    <span style={{
      background: st.bg, color: st.color,
      border: `1px solid ${st.border}`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: '0.72rem', fontWeight: 600,
      whiteSpace: 'nowrap'
    }}>{label}</span>
  )
}

// ── Main Component ────────────────────────────────────
export default function SupportPortal() {
  const [token, setToken]           = useState(localStorage.getItem('cisco_support_token') || '')
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('cisco_support_user') || 'null'))
  const [creds, setCreds]           = useState({ username: '', password: '' })
  const [view, setView]             = useState('dashboard')
  const [error, setError]           = useState('')
  const [msg, setMsg]               = useState('')
  const [loading, setLoading]       = useState(false)

  // Tickets
  const [tickets, setTickets]           = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketLoading, setTicketLoading]   = useState(false)

  // New ticket form
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [ticketForm, setTicketForm]       = useState({ subject: '', description: '', priority: 'Medium' })
  const [submitting, setSubmitting]       = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const flash = (m, isErr = false) => {
    if (isErr) setError(m); else setMsg(m)
    setTimeout(() => { setMsg(''); setError('') }, 4000)
  }

  // ── Auth ─────────────────────────────────────────────
  const login = async () => {
    setLoading(true); setError('')
    try {
      const res = await axios.post('/api/support/login', creds)
      localStorage.setItem('cisco_support_token', res.data.token)
      localStorage.setItem('cisco_support_user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setCurrentUser(res.data.user)
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid credentials')
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('cisco_support_token')
    localStorage.removeItem('cisco_support_user')
    setToken(''); setCurrentUser(null)
    setTickets([]); setSelectedTicket(null)
  }

  // ── Data ─────────────────────────────────────────────
  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/support/tickets', { headers: authHeaders() })
      setTickets(res.data)
    } catch { flash('Failed to load tickets', true) }
  }

  const fetchTicketDetail = async (sfId) => {
    setTicketLoading(true)
    try {
      const res = await axios.get(`/api/support/tickets/${sfId}`, { headers: authHeaders() })
      setSelectedTicket(res.data)
    } catch { flash('Failed to load ticket detail', true) }
    setTicketLoading(false)
  }

  const submitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.description) {
      flash('Please fill in subject and description', true); return
    }
    setSubmitting(true)
    try {
      await axios.post('/api/support/tickets', ticketForm, { headers: authHeaders() })
      flash('Ticket submitted successfully! Our TAC team will be in touch shortly.')
      setShowNewTicket(false)
      setTicketForm({ subject: '', description: '', priority: 'Medium' })
      fetchTickets()
    } catch (e) {
      flash(e.response?.data?.error || 'Failed to submit ticket', true)
    }
    setSubmitting(false)
  }

  useEffect(() => {
    if (token) fetchTickets()
  }, [token])

  // ── Stats ─────────────────────────────────────────────
  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === 'New').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    closed:     tickets.filter(t => t.status === 'Closed').length,
  }

  // ── Styles ─────────────────────────────────────────────
  const s = {
    input: { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: '0.88rem', marginBottom: 14, boxSizing: 'border-box', outline: 'none' },
    label: { fontSize: '0.78rem', fontWeight: 500, color: '#444', display: 'block', marginBottom: 4 },
    btn:   (bg='#00bceb', color='#fff') => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }),
    btnOut:{ background: 'transparent', color: '#666', border: '1px solid #e0e0e0', borderRadius: 6, padding: '7px 16px', fontSize: '0.85rem', cursor: 'pointer' },
    card:  (extra={}) => ({ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', ...extra }),
  }

  // ══════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════
  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a' }}>

      {/* Hero header */}
      <div style={{ background: '#1a1a1a', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, background: '#00bceb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
          Cisco Technologies
        </h1>
        <p style={{ color: '#00bceb', fontSize: '0.9rem', fontWeight: 500, marginBottom: 4 }}>
          Customer Support Hub
        </p>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          Track tickets, access knowledge base, manage your account
        </p>
      </div>

      {/* Login card */}
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 24px 48px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 10, padding: 28 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, color: '#1a1a1a' }}>
            Sign in to your account
          </h2>
          <label style={s.label}>Username</label>
          <input style={s.input} placeholder="your.username" value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button onClick={login} disabled={loading}
            style={{ ...s.btn(), width: '100%', padding: 12, fontSize: '0.95rem', marginTop: 4, justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: '#555' }}>
          Don't have access? Contact your IT administrator.
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: '0.78rem', color: '#444' }}>
          🔒 Secured by JWT · <a href="/" style={{ color: '#00bceb' }}>← Back to main site</a>
        </p>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════
  // TICKET DETAIL VIEW
  // ══════════════════════════════════════════════════════
  if (view === 'detail') return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Navbar */}
      <div style={{ background: '#1a1a1a', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#00bceb', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Support Hub</span>
          <span style={{ color: '#555' }}>·</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>{currentUser?.company}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { setView('tickets'); setSelectedTicket(null) }} style={s.btnOut}>
            ← Back to tickets
          </button>
          <button onClick={logout} style={{ ...s.btnOut, fontSize: '0.8rem' }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>
        {ticketLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading ticket...</div>
        ) : selectedTicket ? (
          <>
            {/* Ticket header */}
            <div style={{ ...s.card(), marginBottom: 16 }}>
              <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: '#00bceb', fontWeight: 700, fontSize: '1rem' }}>
                    {selectedTicket.ticket_number}
                  </span>
                  <Pill label={selectedTicket.status} styleMap={STATUS_STYLE} />
                  <Pill label={selectedTicket.priority} styleMap={PRIORITY_STYLE} />
                </div>
                <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600, marginBottom: 6 }}>
                  {selectedTicket.subject}
                </h1>
                <p style={{ color: '#888', fontSize: '0.82rem' }}>
                  Opened {selectedTicket.created ? new Date(selectedTicket.created).toLocaleString() : '—'}
                  {selectedTicket.contact_name && ` · by ${selectedTicket.contact_name}`}
                </p>
              </div>
              <div style={{ padding: '16px 24px' }}>
                <p style={{ fontSize: '0.82rem', color: '#888', fontWeight: 500, marginBottom: 6 }}>Description</p>
                <p style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.7 }}>{selectedTicket.description}</p>
              </div>
            </div>

            {/* Comments / Timeline */}
            <div style={s.card()}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Activity Timeline ({selectedTicket.comments?.length || 0} updates)
                </h2>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {selectedTicket.comments?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa', fontSize: '0.88rem' }}>
                    No updates yet — our TAC team will respond shortly
                  </div>
                )}
                {selectedTicket.comments?.map((c, i) => (
                  <div key={c.id || i} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: i < selectedTicket.comments.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <div style={{ width: 34, height: 34, background: '#00bceb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                      {c.author?.charAt(0) || 'T'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>{c.author}</span>
                        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                          {c.created ? new Date(c.created).toLocaleString() : ''}
                        </span>
                      </div>
                      <div style={{ background: '#f8f9fa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '10px 14px', fontSize: '0.88rem', color: '#333', lineHeight: 1.6 }}>
                        {c.body}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Status note */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginTop: 8, fontSize: '0.82rem', color: '#0369a1' }}>
                  💬 To add a comment or provide additional information, please reply to the email confirmation you received, or contact TAC directly at support@ciscotechnologies.com
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Ticket not found</div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════
  // MAIN PORTAL DASHBOARD
  // ══════════════════════════════════════════════════════
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Navbar */}
      <div style={{ background: '#1a1a1a', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#00bceb', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Cisco Technologies</span>
          <span style={{ color: '#555' }}>·</span>
          <span style={{ color: '#888', fontSize: '0.82rem' }}>Support Hub</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 500 }}>{currentUser?.full_name}</div>
            <div style={{ color: '#888', fontSize: '0.72rem' }}>{currentUser?.company}</div>
          </div>
          <div style={{ width: 30, height: 30, background: '#00bceb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <button onClick={logout} style={{ ...s.btnOut, fontSize: '0.8rem', color: '#aaa', borderColor: '#333' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Dark hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '36px 28px 40px' }}>
        <p style={{ color: '#00bceb', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Customer Support Hub
        </p>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>
          Hello {currentUser?.full_name?.split(' ')[0]}, how can we help?
        </h1>
        <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 24 }}>
          {currentUser?.company} · Manage your support tickets and track resolutions
        </p>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button onClick={() => setShowNewTicket(true)}
              style={{ background: '#00bceb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
              + New Ticket
            </button>
          )}
          <button onClick={() => setView('tickets')}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '9px 18px', fontSize: '0.85rem', cursor: 'pointer' }}>
            🎫 My Tickets
          </button>
          <button onClick={() => setView('kb')}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '9px 18px', fontSize: '0.85rem', cursor: 'pointer' }}>
            📚 Knowledge Base
          </button>
          <button onClick={() => setView('contact')}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '9px 18px', fontSize: '0.85rem', cursor: 'pointer' }}>
            📞 Contact TAC
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px' }}>

        {msg   && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.88rem' }}>✅ {msg}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.88rem' }}>⚠️ {error}</div>}

        {/* New ticket form */}
        {showNewTicket && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: 24, marginBottom: 20, borderTop: '3px solid #00bceb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>🎫 Raise a Support Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} style={s.btnOut}>Cancel</button>
            </div>
            <label style={s.label}>Subject *</label>
            <input style={s.input} placeholder="Brief description of the issue"
              value={ticketForm.subject}
              onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={s.label}>Priority</label>
                <select style={s.input} value={ticketForm.priority}
                  onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <label style={s.label}>Description *</label>
            <textarea rows={5} style={{ ...s.input, resize: 'vertical' }}
              placeholder="Please describe the issue in detail — include error messages, affected users, steps to reproduce..."
              value={ticketForm.description}
              onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} />

            {/* Severity guide */}
            <div style={{ background: '#f8faff', border: '1px solid #e0e8ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>Priority Guide</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  { p: 'Critical', d: 'Complete outage, all users affected', c: '#dc2626' },
                  { p: 'High',     d: 'Major degradation, most users affected', c: '#ea580c' },
                  { p: 'Medium',   d: 'Partial issue, some users affected', c: '#0070d2' },
                  { p: 'Low',      d: 'Minor issue, workaround available', c: '#16a34a' },
                ].map(x => (
                  <div key={x.p} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: x.c, fontWeight: 700, fontSize: '0.75rem', minWidth: 54 }}>{x.p}:</span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>{x.d}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={submitTicket} disabled={submitting}
              style={{ ...s.btn(), padding: '10px 24px', fontSize: '0.9rem' }}>
              {submitting ? '⏳ Submitting...' : '🎫 Submit Ticket'}
            </button>
          </div>
        )}

        {/* ── DASHBOARD VIEW ── */}
        {view === 'dashboard' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Tickets',  value: stats.total,      color: '#00bceb' },
                { label: 'Open',           value: stats.open,       color: '#16a34a' },
                { label: 'In Progress',    value: stats.inProgress, color: '#0070d2' },
                { label: 'Closed',         value: stats.closed,     color: '#888' },
              ].map(st => (
                <div key={st.label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px 20px', borderTop: `3px solid ${st.color}` }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: st.color }}>{st.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>{st.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

              {/* Recent tickets */}
              <div style={s.card()}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recent Tickets</h2>
                  <button onClick={() => setView('tickets')} style={{ fontSize: '0.8rem', color: '#00bceb', background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all →
                  </button>
                </div>
                <div>
                  {tickets.slice(0, 5).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: '0.85rem' }}>
                      No tickets yet
                      {isAdmin && <div style={{ marginTop: 8 }}><button onClick={() => setShowNewTicket(true)} style={{ ...s.btn(), fontSize: '0.82rem' }}>+ Submit your first ticket</button></div>}
                    </div>
                  )}
                  {tickets.slice(0, 5).map(t => (
                    <div key={t.sf_id}
                      onClick={() => { fetchTicketDetail(t.sf_id); setView('detail') }}
                      style={{ padding: '12px 18px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00bceb' }}>{t.ticket_number}</span>
                          <Pill label={t.status} styleMap={STATUS_STYLE} />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#333', fontWeight: 500 }}>{t.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>
                          {t.created ? new Date(t.created).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <Pill label={t.priority} styleMap={PRIORITY_STYLE} />
                      <span style={{ color: '#ccc', fontSize: '1rem' }}>›</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact + info panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Account info */}
                <div style={s.card()}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Your Account</h2>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#00bceb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                        {currentUser?.company?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser?.company}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Account ID #{currentUser?.account_id}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: 4 }}>
                      👤 {currentUser?.full_name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: 4 }}>
                      📧 {currentUser?.email}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: currentUser?.role === 'admin' ? '#7c3aed' : '#888', background: currentUser?.role === 'admin' ? '#f5f3ff' : '#f5f5f5', border: `1px solid ${currentUser?.role === 'admin' ? '#ddd6fe' : '#e0e0e0'}`, borderRadius: 20, padding: '2px 10px', display: 'inline-block', marginTop: 4, fontWeight: 600 }}>
                      {currentUser?.role}
                    </div>
                  </div>
                </div>

                {/* Contact TAC */}
                <div style={s.card()}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Contact TAC</h2>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    {[
                      { icon: '📧', label: 'Email', value: 'support@ciscotechnologies.com' },
                      { icon: '📞', label: 'Phone', value: '+1 (800) 555-0199' },
                      { icon: '🕐', label: 'Hours', value: 'Mon–Fri 8am–8pm EST' },
                      { icon: '⚡', label: 'Critical', value: '24/7 hotline available' },
                    ].map(c => (
                      <div key={c.label} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: '1rem', width: 20 }}>{c.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{c.label}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#333' }}>{c.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TICKETS VIEW ── */}
        {view === 'tickets' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
                All Tickets — {currentUser?.company} ({tickets.length})
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchTickets} style={s.btnOut}>↻ Refresh</button>
                {isAdmin && (
                  <button onClick={() => setShowNewTicket(true)} style={s.btn()}>+ New Ticket</button>
                )}
              </div>
            </div>

            <div style={s.card()}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['Ticket #','Subject','Priority','Status','Opened by','Date',''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: '0.88rem' }}>
                      No tickets yet
                      {isAdmin && <span> — <button onClick={() => setShowNewTicket(true)} style={{ background: 'none', border: 'none', color: '#00bceb', cursor: 'pointer', fontSize: '0.88rem' }}>Submit your first ticket</button></span>}
                    </td></tr>
                  )}
                  {tickets.map(t => (
                    <tr key={t.sf_id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      onClick={() => { fetchTicketDetail(t.sf_id); setView('detail') }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#00bceb', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {t.ticket_number || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: 260 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description?.slice(0, 60)}...</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Pill label={t.priority} styleMap={PRIORITY_STYLE} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Pill label={t.status} styleMap={STATUS_STYLE} />
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#555' }}>{t.contact}</td>
                      <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#aaa', whiteSpace: 'nowrap' }}>
                        {t.created ? new Date(t.created).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#ccc', fontSize: '1.1rem' }}>›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── KNOWLEDGE BASE VIEW ── */}
        {view === 'kb' && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Knowledge Base</h2>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 20 }}>
              Browse articles and guides for common UC & CC topics
            </p>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '20px 24px', textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>Knowledge Base Coming Soon</p>
              <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
                Articles will be available here once published in Salesforce Knowledge.
                In the meantime, contact our TAC team for guidance.
              </p>
              <button onClick={() => setView('contact')} style={{ ...s.btn(), marginTop: 16, fontSize: '0.85rem' }}>
                Contact TAC
              </button>
            </div>
          </div>
        )}

        {/* ── CONTACT VIEW ── */}
        {view === 'contact' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Contact TAC</h2>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 20 }}>
              Our Technical Assistance Center is here to help
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { icon: '📧', label: 'General Support', value: 'support@ciscotechnologies.com', sub: 'Response within 2 hours' },
                { icon: '📞', label: 'Phone Support', value: '+1 (800) 555-0199', sub: 'Mon–Fri 8am–8pm EST' },
                { icon: '⚡', label: 'Critical Issues', value: '+1 (800) 555-0911', sub: '24/7 emergency line' },
                { icon: '💬', label: 'Slack Channel', value: '#cisco-tac-support', sub: 'For premium accounts' },
              ].map(c => (
                <div key={c.label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{c.icon}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{c.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{c.sub}</div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '16px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.88rem', color: '#0369a1', marginBottom: 10 }}>
                  Need faster resolution? Raise a formal support ticket.
                </p>
                <button onClick={() => { setShowNewTicket(true); setView('dashboard') }} style={s.btn()}>
                  + Submit a Ticket
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}