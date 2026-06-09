import { useState, useEffect } from 'react'
import axios from 'axios'

const statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed']
const badgeOptions = [
  { value: 'badge-blue', label: 'Blue — UC/Cisco' },
  { value: 'badge-orange', label: 'Orange — Contact Center' },
  { value: 'badge-purple', label: 'Purple — WFM/Analytics' },
  { value: 'badge-green', label: 'Green — Managed Services' },
]
const roleOptions = ['admin', 'agent', 'viewer']
const emptyStudy = { title: '', client: '', summary: '', outcome: '', badge: 'badge-blue' }
const emptyAgent = { full_name: '', username: '', email: '', password: '', role: 'agent' }

const severityColor = s => ({ Critical: '#dc2626', High: '#ea580c', Medium: '#0078d4', Low: '#16a34a' }[s] || '#666')
const statusStyle = s => ({
  Open: { color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' },
  'In Progress': { color: '#0070d2', background: '#eff6ff', border: '1px solid #bfdbfe' },
  Resolved: { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' },
  Closed: { color: '#666', background: '#f5f5f5', border: '1px solid #e0e0e0' },
}[s] || {})

const roleStyle = r => ({
  admin: { color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe' },
  agent: { color: '#0078d4', background: '#eff6ff', border: '1px solid #bfdbfe' },
  viewer: { color: '#666', background: '#f5f5f5', border: '1px solid #e0e0e0' },
}[r] || {})

export default function AdminPortal() {
  const [view, setView] = useState('tickets')
  const [token, setToken] = useState(localStorage.getItem('cisco_token') || '')
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('cisco_user') || 'null'))
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [tickets, setTickets] = useState([])
  const [caseStudies, setCaseStudies] = useState([])
  const [agents, setAgents] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [editStudy, setEditStudy] = useState(null)
  const [editAgent, setEditAgent] = useState(null)
  const [studyForm, setStudyForm] = useState(emptyStudy)
  const [agentForm, setAgentForm] = useState(emptyAgent)
  const [expandedTicket, setExpandedTicket] = useState(null)
  const [ticketNotes, setTicketNotes] = useState({})

  const authHeaders = { Authorization: `Bearer ${token}` }
  const isAdmin = currentUser?.role === 'admin'
  const canEdit = ['admin', 'agent'].includes(currentUser?.role)

  const flash = (m, isErr = false) => {
    if (isErr) setError(m); else setMsg(m)
    setTimeout(() => { setMsg(''); setError('') }, 4000)
  }

  const login = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/login', creds)
      localStorage.setItem('cisco_token', res.data.token)
      localStorage.setItem('cisco_user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setCurrentUser(res.data.user)
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid credentials')
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('cisco_token')
    localStorage.removeItem('cisco_user')
    setToken(''); setCurrentUser(null)
    setTickets([]); setCaseStudies([]); setAgents([])
  }

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets', { headers: authHeaders })
      setTickets(res.data)
      const notes = {}
      res.data.forEach(t => { notes[t.id] = t.notes || '' })
      setTicketNotes(notes)
    } catch { flash('Session expired.', true); logout() }
  }

  const fetchCaseStudies = async () => {
    try {
      const res = await axios.get('/api/admin/case-studies', { headers: authHeaders })
      setCaseStudies(res.data)
    } catch { flash('Failed to load case studies.', true) }
  }

  const fetchAgents = async () => {
    try {
      const res = await axios.get('/api/admin/agents', { headers: authHeaders })
      setAgents(res.data)
    } catch { flash('Failed to load agents.', true) }
  }

  const updateTicket = async (id, status) => {
    try {
      await axios.put(`/api/ticket/${id}`, { status, notes: ticketNotes[id] || '' }, { headers: authHeaders })
      flash(`Ticket #${id} updated to ${status}`)
      fetchTickets()
    } catch { flash('Failed to update ticket.', true) }
  }

  const saveNotes = async (id) => {
    const ticket = tickets.find(t => t.id === id)
    try {
      await axios.put(`/api/ticket/${id}`, { status: ticket.status, notes: ticketNotes[id] || '' }, { headers: authHeaders })
      flash(`Notes saved for ticket #${id}`)
      fetchTickets()
    } catch { flash('Failed to save notes.', true) }
  }

  const saveStudy = async () => {
    try {
      if (editStudy) {
        await axios.put(`/api/admin/case-studies/${editStudy.id}`, studyForm, { headers: authHeaders })
        flash('Case study updated')
      } else {
        await axios.post('/api/admin/case-studies', studyForm, { headers: authHeaders })
        flash('Case study created')
      }
      setShowStudyForm(false); setEditStudy(null); setStudyForm(emptyStudy)
      fetchCaseStudies()
    } catch { flash('Failed to save.', true) }
  }

  const deleteStudy = async (id) => {
    if (!window.confirm('Delete this case study?')) return
    try {
      await axios.delete(`/api/admin/case-studies/${id}`, { headers: authHeaders })
      flash('Deleted'); fetchCaseStudies()
    } catch { flash('Failed to delete.', true) }
  }

  const saveAgent = async () => {
    try {
      if (editAgent) {
        await axios.put(`/api/admin/agents/${editAgent.id}`, { ...agentForm, active: agentForm.active ?? true }, { headers: authHeaders })
        flash('Agent updated')
      } else {
        await axios.post('/api/admin/agents', agentForm, { headers: authHeaders })
        flash('Agent created')
      }
      setShowAgentForm(false); setEditAgent(null); setAgentForm(emptyAgent)
      fetchAgents()
    } catch (e) {
      flash(e.response?.data?.message || 'Failed to save agent.', true)
    }
  }

  const toggleAgent = async (agent) => {
    try {
      await axios.put(`/api/admin/agents/${agent.id}`, { ...agent, active: !agent.active }, { headers: authHeaders })
      flash(`${agent.full_name} ${!agent.active ? 'enabled' : 'disabled'}`)
      fetchAgents()
    } catch { flash('Failed to update.', true) }
  }

  const deleteAgent = async (id) => {
    if (!window.confirm('Delete this agent? This cannot be undone.')) return
    try {
      await axios.delete(`/api/admin/agents/${id}`, { headers: authHeaders })
      flash('Agent deleted'); fetchAgents()
    } catch (e) { flash(e.response?.data?.message || 'Failed to delete.', true) }
  }

  useEffect(() => {
    if (token) { fetchTickets(); fetchCaseStudies(); if (isAdmin) fetchAgents() }
  }, [token])

  useEffect(() => {
    if (!token) return
    if (view === 'tickets') fetchTickets()
    else if (view === 'casestudies') fetchCaseStudies()
    else if (view === 'agents' && isAdmin) fetchAgents()
  }, [view])

  // ── Login ──────────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#00bceb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>TAC Admin Portal</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Cisco Technologies — Internal Use Only</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card">
          <label>Username</label>
          <input placeholder="username" value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button className="btn btn-primary" onClick={login} disabled={loading}
            style={{ width: '100%', padding: 12, marginTop: 4 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: '#bbb' }}>
          🔒 Protected by Cloudflare Access + JWT
        </p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'tickets', label: '🎫 Tickets', count: tickets.length, show: true },
    { key: 'casestudies', label: '📋 Case Studies', count: caseStudies.length, show: true },
    { key: 'agents', label: '👥 User Management', count: agents.length, show: isAdmin },
  ].filter(t => t.show)

  // ── Dashboard ──────────────────────────────────────
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#00bceb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>Cisco Technologies</span>
          <span style={{ color: '#ddd' }}>|</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Admin Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>{currentUser?.full_name}</div>
            <div style={{ ...roleStyle(currentUser?.role), borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'inline-block' }}>{currentUser?.role}</div>
          </div>
          <button className="btn btn-outline" onClick={logout} style={{ fontSize: '0.85rem' }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 32px', display: 'flex' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setView(t.key)} style={{
            padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: view === t.key ? 600 : 400,
            color: view === t.key ? '#00bceb' : '#666',
            borderBottom: view === t.key ? '2px solid #00bceb' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s'
          }}>
            {t.label}
            <span style={{ background: view === t.key ? '#e0f7fd' : '#f0f0f0', color: view === t.key ? '#0078a8' : '#888', borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>
        {msg && <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ {msg}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

        {/* ── TICKETS ── */}
        {view === 'tickets' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total', value: tickets.length, color: '#0078d4' },
                { label: 'Open', value: tickets.filter(t => t.status === 'Open').length, color: '#ea580c' },
                { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, color: '#0070d2' },
                { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length, color: '#16a34a' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '18px 20px', borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Support Ticket Queue</h2>
                <button className="btn btn-outline" onClick={fetchTickets} style={{ fontSize: '0.85rem' }}>↻ Refresh</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Customer</th><th>Contact</th><th>Severity</th>
                      <th>Category</th><th>Issue</th><th>Status</th><th>Date</th><th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>No tickets yet</td></tr>
                    )}
                    {tickets.map(t => (
                      <>
                        <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)}>
                          <td style={{ fontWeight: 700, color: '#00bceb' }}>#{t.id}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.requester}</td>
                          <td style={{ color: '#888', fontSize: '0.8rem' }}>
                            <div>{t.email}</div>
                            <div>{t.phone}</div>
                          </td>
                          <td>
                            <span style={{ background: severityColor(t.severity) + '15', color: severityColor(t.severity), border: `1px solid ${severityColor(t.severity)}30`, borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {t.severity}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{t.category}</td>
                          <td style={{ maxWidth: 200, color: '#555', fontSize: '0.82rem' }}>
                            {t.description.slice(0, 50)}{t.description.length > 50 ? '...' : ''}
                            {t.notes && <div style={{ color: '#0078d4', fontSize: '0.75rem', marginTop: 2 }}>📝 Has notes</div>}
                          </td>
                          <td>
                            <span style={{ ...statusStyle(t.status), borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ color: '#aaa', fontSize: '0.8rem' }}>{new Date(t.timestamp).toLocaleDateString()}</td>
                          <td onClick={e => e.stopPropagation()}>
                            {canEdit && (
                              <select value={t.status} onChange={e => updateTicket(t.id, e.target.value)}
                                style={{ padding: '5px 8px', margin: 0, fontSize: '0.8rem', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                                {statusOptions.map(s => <option key={s}>{s}</option>)}
                              </select>
                            )}
                          </td>
                        </tr>

                        {/* Expanded notes row */}
                        {expandedTicket === t.id && (
                          <tr key={`notes-${t.id}`}>
                            <td colSpan={9} style={{ background: '#f8faff', padding: '16px 20px', borderTop: '1px dashed #bfdbfe' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: 8 }}>Full Description</p>
                                  <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e8e8e8' }}>{t.description}</p>
                                </div>
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: 8 }}>📝 Internal Notes</p>
                                  {canEdit ? (
                                    <>
                                      <textarea
                                        rows={4}
                                        placeholder="Add internal notes, call log, follow-up actions..."
                                        value={ticketNotes[t.id] || ''}
                                        onChange={e => setTicketNotes({ ...ticketNotes, [t.id]: e.target.value })}
                                        style={{ marginBottom: 8, fontSize: '0.85rem' }}
                                      />
                                      <button className="btn btn-primary" onClick={() => saveNotes(t.id)} style={{ fontSize: '0.82rem', padding: '6px 16px' }}>
                                        Save Notes
                                      </button>
                                    </>
                                  ) : (
                                    <p style={{ fontSize: '0.85rem', color: '#555', background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e8e8e8' }}>
                                      {t.notes || 'No notes added'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── CASE STUDIES ── */}
        {view === 'casestudies' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Case Studies</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>Manage success stories on the public website</p>
              </div>
              {canEdit && (
                <button className="btn btn-primary" onClick={() => { setEditStudy(null); setStudyForm(emptyStudy); setShowStudyForm(true) }}>
                  + New Case Study
                </button>
              )}
            </div>

            {showStudyForm && (
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 24, marginBottom: 24, borderTop: '3px solid #00bceb' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{editStudy ? '✏️ Edit' : '➕ New'} Case Study</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label>Project Title *</label>
                    <input placeholder="e.g. Avaya to Cisco Migration" value={studyForm.title}
                      onChange={e => setStudyForm({ ...studyForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label>Client Name *</label>
                    <input placeholder="e.g. Financial Services Co." value={studyForm.client}
                      onChange={e => setStudyForm({ ...studyForm, client: e.target.value })} />
                  </div>
                </div>
                <label>Project Summary *</label>
                <textarea rows={3} placeholder="What was done for the client..." value={studyForm.summary}
                  onChange={e => setStudyForm({ ...studyForm, summary: e.target.value })} />
                <label>Business Outcome *</label>
                <input placeholder="e.g. Reduced costs by 40%" value={studyForm.outcome}
                  onChange={e => setStudyForm({ ...studyForm, outcome: e.target.value })} />
                <label>Badge Colour</label>
                <select value={studyForm.badge} onChange={e => setStudyForm({ ...studyForm, badge: e.target.value })}>
                  {badgeOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={saveStudy}>{editStudy ? 'Save Changes' : 'Create'}</button>
                  <button className="btn btn-outline" onClick={() => { setShowStudyForm(false); setEditStudy(null) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
              {caseStudies.map(cs => (
                <div key={cs.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #00bceb, #0078d4)', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600 }}>#{cs.id}</span>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditStudy(cs); setStudyForm({ title: cs.title, client: cs.client, summary: cs.summary, outcome: cs.outcome, badge: cs.badge }); setShowStudyForm(true) }}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}>✏️ Edit</button>
                          <button onClick={() => deleteStudy(cs.id)}
                            style={{ background: 'rgba(220,38,38,0.3)', border: 'none', borderRadius: 4, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}>🗑 Delete</button>
                        </div>
                      )}
                    </div>
                    <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{cs.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>Client: {cs.client}</p>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 12 }}>{cs.summary}</p>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px' }}>
                      <p style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>📈 {cs.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── USER MANAGEMENT (admin only) ── */}
        {view === 'agents' && isAdmin && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>User Management</h2>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>Manage portal access and roles</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setEditAgent(null); setAgentForm(emptyAgent); setShowAgentForm(true) }}>
                + Add User
              </button>
            </div>

            {showAgentForm && (
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 24, marginBottom: 24, borderTop: '3px solid #7c3aed' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{editAgent ? '✏️ Edit User' : '➕ Add New User'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label>Full Name *</label>
                    <input placeholder="John Smith" value={agentForm.full_name}
                      onChange={e => setAgentForm({ ...agentForm, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label>Username *</label>
                    <input placeholder="jsmith" value={agentForm.username} disabled={!!editAgent}
                      onChange={e => setAgentForm({ ...agentForm, username: e.target.value })}
                      style={{ opacity: editAgent ? 0.6 : 1 }} />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input type="email" placeholder="john@ciscotechnologies.com" value={agentForm.email}
                      onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label>Role *</label>
                    <select value={agentForm.role} onChange={e => setAgentForm({ ...agentForm, role: e.target.value })}>
                      {roleOptions.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>{editAgent ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input type="password" placeholder="Min 8 characters" value={agentForm.password}
                      onChange={e => setAgentForm({ ...agentForm, password: e.target.value })} />
                  </div>
                  {editAgent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                      <label style={{ marginBottom: 0 }}>Active</label>
                      <input type="checkbox" checked={agentForm.active ?? true}
                        onChange={e => setAgentForm({ ...agentForm, active: e.target.checked })} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 4, padding: '10px 14px', background: '#f5f3ff', borderRadius: 6, fontSize: '0.82rem', color: '#7c3aed', marginBottom: 16 }}>
                  <strong>Role permissions:</strong> admin = full access including user management · agent = tickets + case studies · viewer = read only
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" onClick={saveAgent}>{editAgent ? 'Save Changes' : 'Create User'}</button>
                  <button className="btn btn-outline" onClick={() => { setShowAgentForm(false); setEditAgent(null) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a.id} style={{ opacity: a.active ? 1 : 0.5 }}>
                      <td style={{ fontWeight: 600 }}>{a.full_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555' }}>{a.username}</td>
                      <td style={{ color: '#888', fontSize: '0.85rem' }}>{a.email}</td>
                      <td>
                        <span style={{ ...roleStyle(a.role), borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {a.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: a.active ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.82rem' }}>
                          {a.active ? '● Active' : '● Disabled'}
                        </span>
                      </td>
                      <td style={{ color: '#aaa', fontSize: '0.8rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditAgent(a); setAgentForm({ ...a, password: '' }); setShowAgentForm(true) }}
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: '4px 10px', color: '#0078d4', cursor: 'pointer', fontSize: '0.78rem' }}>Edit</button>
                          <button onClick={() => toggleAgent(a)}
                            style={{ background: a.active ? '#fff7ed' : '#f0fdf4', border: `1px solid ${a.active ? '#fed7aa' : '#bbf7d0'}`, borderRadius: 4, padding: '4px 10px', color: a.active ? '#ea580c' : '#16a34a', cursor: 'pointer', fontSize: '0.78rem' }}>
                            {a.active ? 'Disable' : 'Enable'}
                          </button>
                          {a.username !== 'admin' && (
                            <button onClick={() => deleteAgent(a.id)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '4px 10px', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem' }}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}