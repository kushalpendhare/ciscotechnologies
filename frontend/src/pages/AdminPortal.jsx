import { useState, useEffect } from 'react'
import axios from 'axios'

const statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed']

export default function AdminPortal() {
  const [token, setToken] = useState(localStorage.getItem('cisco_token') || '')
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const login = async () => {
    setError('')
    try {
      const res = await axios.post('/api/login', creds)
      localStorage.setItem('cisco_token', res.data.token)
      setToken(res.data.token)
    } catch {
      setError('Invalid credentials. Access denied.')
    }
  }

  const logout = () => {
    localStorage.removeItem('cisco_token')
    setToken('')
    setTickets([])
  }

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTickets(res.data)
    } catch {
      setError('Session expired. Please log in again.')
      logout()
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/ticket/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMsg(`Ticket #${id} updated to ${status}`)
      fetchTickets()
    } catch {
      setError('Failed to update ticket.')
    }
  }

  useEffect(() => { if (token) fetchTickets() }, [token])

  const statusClass = s => ({
    'Open': 'status-open',
    'In Progress': 'status-inprogress',
    'Resolved': 'status-resolved',
    'Closed': 'status-closed'
  }[s] || '')

  // ── Login Screen ──
  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: '#00bceb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>TAC Admin Portal</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Cisco Technologies — Internal Use Only</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <label>Username</label>
          <input
            placeholder="admin"
            value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          <button className="btn btn-primary" onClick={login} style={{ width: '100%', padding: 12, marginTop: 4 }}>
            Login to Admin Portal
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: '#bbb' }}>
          🔒 Protected by Cloudflare Access + JWT
        </p>
      </div>
    </div>
  )

  // ── Dashboard ──
  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>TAC Ticket Queue</h1>
          <p style={{ color: '#888' }}>{tickets.length} ticket(s) in the system</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={fetchTickets}>↻ Refresh</button>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Severity</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#aaa', padding: 48 }}>
                  No tickets in the queue
                </td>
              </tr>
            )}
            {tickets.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 700, color: '#00bceb' }}>#{t.id}</td>
                <td style={{ fontWeight: 600 }}>{t.requester}</td>
                <td style={{ color: '#888', fontSize: '0.85rem' }}>{t.email}</td>
                <td>
                  <span className={`badge ${t.severity === 'Critical' || t.severity === 'High' ? 'badge-orange' : 'badge-blue'}`}>
                    {t.severity}
                  </span>
                </td>
                <td style={{ fontSize: '0.88rem' }}>{t.category}</td>
                <td style={{ maxWidth: 200, color: '#666', fontSize: '0.85rem' }}>
                  {t.description.slice(0, 60)}{t.description.length > 60 ? '...' : ''}
                </td>
                <td><span className={statusClass(t.status)}>{t.status}</span></td>
                <td style={{ color: '#aaa', fontSize: '0.8rem' }}>
                  {new Date(t.timestamp).toLocaleDateString()}
                </td>
                <td>
                  <select
                    value={t.status}
                    onChange={e => updateStatus(t.id, e.target.value)}
                    style={{ padding: '4px 8px', margin: 0, fontSize: '0.8rem' }}
                  >
                    {statusOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}