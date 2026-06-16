import { useState, useEffect } from 'react'
import axios from 'axios'

// ── Constants ─────────────────────────────────────────
const ROLES_AGENT    = ['admin', 'agent', 'viewer']
const ROLES_CUSTOMER = ['admin', 'viewer']
const PLANS          = ['standard', 'premium', 'enterprise']
const BADGES         = [
  { value: 'badge-blue',   label: 'Blue — UC/Cisco' },
  { value: 'badge-orange', label: 'Orange — Contact Center' },
  { value: 'badge-purple', label: 'Purple — WFM/Analytics' },
  { value: 'badge-green',  label: 'Green — Managed Services' },
]
const PRIORITY_COLORS = {
  High:     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Medium:   { bg: '#eff6ff', color: '#0070d2', border: '#bfdbfe' },
  Low:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}
const STATUS_COLORS = {
  New:         { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'In Progress':{ bg: '#eff6ff', color: '#0070d2', border: '#bfdbfe' },
  Closed:      { bg: '#f5f5f5', color: '#666',    border: '#e0e0e0' },
  Escalated:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const emptyAccount  = { company_name: '', plan: 'standard', phone: '', description: '' }
const emptyUser     = { full_name: '', username: '', email: '', password: '', role: 'viewer' }
const emptyAgent    = { full_name: '', username: '', email: '', password: '', role: 'agent' }
const emptyStudy    = { title: '', client: '', summary: '', outcome: '', badge: 'badge-blue' }

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('cisco_admin_token')}`
})

const Badge = ({ label, colors }) => (
  <span style={{
    background: colors?.bg || '#f5f5f5',
    color: colors?.color || '#666',
    border: `1px solid ${colors?.border || '#e0e0e0'}`,
    borderRadius: 20, padding: '2px 10px',
    fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap'
  }}>{label}</span>
)

// ── Main Component ────────────────────────────────────
export default function AdminPortal() {
  const [token, setToken]       = useState(localStorage.getItem('cisco_admin_token') || '')
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('cisco_admin_user') || 'null'))
  const [creds, setCreds]       = useState({ username: '', password: '' })
  const [view, setView]         = useState('customers')
  const [msg, setMsg]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Customer management state
  const [accounts, setAccounts]         = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accountUsers, setAccountUsers] = useState([])
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showUserForm, setShowUserForm]   = useState(false)
  const [editAccount, setEditAccount]   = useState(null)
  const [editUser, setEditUser]         = useState(null)
  const [accountForm, setAccountForm]   = useState(emptyAccount)
  const [userForm, setUserForm]         = useState(emptyUser)

  // Agent management state
  const [agents, setAgents]         = useState([])
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [editAgent, setEditAgent]   = useState(null)
  const [agentForm, setAgentForm]   = useState(emptyAgent)

  // Case study state
  const [studies, setStudies]         = useState([])
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [editStudy, setEditStudy]     = useState(null)
  const [studyForm, setStudyForm]     = useState(emptyStudy)

  // Ticket state
  const [tickets, setTickets]         = useState([])
  const [ticketFilter, setTicketFilter] = useState('all')

  const isAdmin = currentUser?.role === 'admin'

  const flash = (m, isErr = false) => {
    if (isErr) setError(m); else setMsg(m)
    setTimeout(() => { setMsg(''); setError('') }, 4000)
  }

  // ── Login ────────────────────────────────────────────
  const login = async () => {
    setLoading(true); setError('')
    try {
      const res = await axios.post('/api/admin/login', creds)
      localStorage.setItem('cisco_admin_token', res.data.token)
      localStorage.setItem('cisco_admin_user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setCurrentUser(res.data.user)
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid credentials')
    }
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('cisco_admin_token')
    localStorage.removeItem('cisco_admin_user')
    setToken(''); setCurrentUser(null)
  }

  // ── Data fetchers ─────────────────────────────────────
  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/admin/accounts', { headers: authHeaders() })
      setAccounts(res.data)
    } catch { flash('Failed to load accounts', true) }
  }

  const fetchAccountUsers = async (accountId) => {
    try {
      const res = await axios.get(`/api/admin/accounts/${accountId}/users`, { headers: authHeaders() })
      setAccountUsers(res.data)
    } catch { flash('Failed to load users', true) }
  }

  const fetchAgents = async () => {
    try {
      const res = await axios.get('/api/admin/agents', { headers: authHeaders() })
      setAgents(res.data)
    } catch { flash('Failed to load agents', true) }
  }

  const fetchStudies = async () => {
    try {
      const res = await axios.get('/api/admin/case-studies', { headers: authHeaders() })
      setStudies(res.data)
    } catch { flash('Failed to load case studies', true) }
  }

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/admin/tickets', { headers: authHeaders() })
      setTickets(res.data)
    } catch { flash('Failed to load tickets', true) }
  }

  useEffect(() => {
    if (!token) return
    fetchAccounts()
    fetchStudies()
    if (isAdmin) fetchAgents()
  }, [token])

  useEffect(() => {
    if (!token) return
    if (view === 'tickets') fetchTickets()
  }, [view])

  useEffect(() => {
    if (selectedAccount) fetchAccountUsers(selectedAccount.id)
  }, [selectedAccount])

  // ── Account CRUD ──────────────────────────────────────
  const saveAccount = async () => {
    try {
      if (editAccount) {
        await axios.put(`/api/admin/accounts/${editAccount.id}`, accountForm, { headers: authHeaders() })
        flash('Account updated')
      } else {
        await axios.post('/api/admin/accounts', accountForm, { headers: authHeaders() })
        flash('Account created — also added to Salesforce ✅')
      }
      setShowAccountForm(false); setEditAccount(null); setAccountForm(emptyAccount)
      fetchAccounts()
    } catch (e) { flash(e.response?.data?.error || 'Failed', true) }
  }

  const deleteAccount = async (id) => {
    if (!window.confirm('Delete this account and all its users?')) return
    try {
      await axios.delete(`/api/admin/accounts/${id}`, { headers: authHeaders() })
      flash('Account deleted')
      if (selectedAccount?.id === id) setSelectedAccount(null)
      fetchAccounts()
    } catch { flash('Failed to delete', true) }
  }

  // ── User CRUD ─────────────────────────────────────────
  const saveUser = async () => {
    try {
      if (editUser) {
        await axios.put(`/api/admin/users/${editUser.id}`, userForm, { headers: authHeaders() })
        flash('User updated')
      } else {
        await axios.post(`/api/admin/accounts/${selectedAccount.id}/users`, userForm, { headers: authHeaders() })
        flash('User created')
      }
      setShowUserForm(false); setEditUser(null); setUserForm(emptyUser)
      fetchAccountUsers(selectedAccount.id)
    } catch (e) { flash(e.response?.data?.error || 'Failed', true) }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: authHeaders() })
      flash('User deleted')
      fetchAccountUsers(selectedAccount.id)
    } catch { flash('Failed', true) }
  }

  const toggleUser = async (user) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, { ...user, active: !user.active }, { headers: authHeaders() })
      flash(`${user.full_name} ${!user.active ? 'enabled' : 'disabled'}`)
      fetchAccountUsers(selectedAccount.id)
    } catch { flash('Failed', true) }
  }

  // ── Agent CRUD ────────────────────────────────────────
  const saveAgent = async () => {
    try {
      if (editAgent) {
        await axios.put(`/api/admin/agents/${editAgent.id}`, agentForm, { headers: authHeaders() })
        flash('Agent updated')
      } else {
        await axios.post('/api/admin/agents', agentForm, { headers: authHeaders() })
        flash('Agent created')
      }
      setShowAgentForm(false); setEditAgent(null); setAgentForm(emptyAgent)
      fetchAgents()
    } catch (e) { flash(e.response?.data?.error || 'Failed', true) }
  }

  const deleteAgent = async (id) => {
    if (!window.confirm('Delete this agent?')) return
    try {
      await axios.delete(`/api/admin/agents/${id}`, { headers: authHeaders() })
      flash('Agent deleted'); fetchAgents()
    } catch (e) { flash(e.response?.data?.error || 'Failed', true) }
  }

  // ── Case Study CRUD ───────────────────────────────────
  const saveStudy = async () => {
    try {
      if (editStudy) {
        await axios.put(`/api/admin/case-studies/${editStudy.id}`, studyForm, { headers: authHeaders() })
        flash('Case study updated')
      } else {
        await axios.post('/api/admin/case-studies', studyForm, { headers: authHeaders() })
        flash('Case study created')
      }
      setShowStudyForm(false); setEditStudy(null); setStudyForm(emptyStudy)
      fetchStudies()
    } catch { flash('Failed', true) }
  }

  const deleteStudy = async (id) => {
    if (!window.confirm('Delete this case study?')) return
    try {
      await axios.delete(`/api/admin/case-studies/${id}`, { headers: authHeaders() })
      flash('Deleted'); fetchStudies()
    } catch { flash('Failed', true) }
  }

  // ── Filtered tickets ──────────────────────────────────
  const filteredTickets = ticketFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === ticketFilter)

  // ── Styles ────────────────────────────────────────────
  const s = {
    page:    { background: '#f5f5f5', minHeight: '100vh' },
    topbar:  { background: '#1a1a1a', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tabbar:  { background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 28px', display: 'flex' },
    tab:     (active) => ({ padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.88rem', fontWeight: active ? 600 : 400, color: active ? '#00bceb' : '#666', borderBottom: active ? '2px solid #00bceb' : '2px solid transparent', transition: 'all .15s' }),
    body:    { padding: '24px 28px' },
    card:    { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
    ch:      { padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cb:      { padding: '0 18px' },
    btn:     (color='#00bceb') => ({ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
    btnOut:  { background: 'transparent', color: '#666', border: '1px solid #e0e0e0', borderRadius: 6, padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer' },
    input:   { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: '0.88rem', marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
    label:   { fontSize: '0.78rem', fontWeight: 500, color: '#555', display: 'block', marginBottom: 4 },
    grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    form:    { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: 20, marginBottom: 16, borderTop: '3px solid #00bceb' },
    tr:      (hover) => ({ background: hover ? '#fafafa' : '#fff', transition: 'background .1s' }),
  }

  // ── Login screen ──────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: '#00bceb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Admin Portal</h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>Cisco Technologies — Internal Access Only</p>
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.88rem' }}>⚠️ {error}</div>}
        <div style={{ background: '#fff', borderRadius: 10, padding: 24 }}>
          <label style={s.label}>Username</label>
          <input style={s.input} placeholder="admin" value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button onClick={login} disabled={loading}
            style={{ ...s.btn(), width: '100%', justifyContent: 'center', padding: 12, fontSize: '0.95rem', marginTop: 4 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.78rem', color: '#555' }}>
          🔒 Protected by JWT · Internal use only
        </p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'customers', label: '🏢 Customer Management' },
    { key: 'tickets',   label: '🎫 Ticket Management' },
    { key: 'studies',   label: '📋 Case Studies' },
    { key: 'agents',    label: '👥 TAC Team', adminOnly: true },
  ].filter(t => !t.adminOnly || isAdmin)

  return (
    <div style={s.page}>

      {/* Top bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#00bceb', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>Cisco Technologies</span>
          <span style={{ color: '#555' }}>|</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Admin Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>{currentUser?.full_name}</div>
            <div style={{ color: '#00bceb', fontSize: '0.72rem' }}>{currentUser?.role}</div>
          </div>
          <button onClick={logout} style={s.btnOut}>Logout</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={s.tabbar}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setView(t.key)} style={s.tab(view === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.body}>
        {msg   && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.88rem' }}>✅ {msg}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.88rem' }}>⚠️ {error}</div>}

        {/* ═══════════════════════════════════════════════
            CUSTOMER MANAGEMENT
        ═══════════════════════════════════════════════ */}
        {view === 'customers' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedAccount ? '1fr 1fr' : '1fr', gap: 16 }}>

            {/* Account list */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Customer Accounts ({accounts.length})
                </h2>
                {isAdmin && (
                  <button style={s.btn()} onClick={() => { setEditAccount(null); setAccountForm(emptyAccount); setShowAccountForm(!showAccountForm) }}>
                    + Onboard Company
                  </button>
                )}
              </div>

              {/* Account form */}
              {showAccountForm && (
                <div style={s.form}>
                  <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>
                    {editAccount ? '✏️ Edit Account' : '🏢 Onboard New Company'}
                  </p>
                  <div style={s.grid2}>
                    <div>
                      <label style={s.label}>Company Name *</label>
                      <input style={s.input} placeholder="ABC Inc" value={accountForm.company_name}
                        onChange={e => setAccountForm({ ...accountForm, company_name: e.target.value })} />
                    </div>
                    <div>
                      <label style={s.label}>Plan</label>
                      <select style={s.input} value={accountForm.plan}
                        onChange={e => setAccountForm({ ...accountForm, plan: e.target.value })}>
                        {PLANS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Phone</label>
                      <input style={s.input} placeholder="+1 555 000 0000" value={accountForm.phone}
                        onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <label style={s.label}>Description</label>
                      <input style={s.input} placeholder="Brief description" value={accountForm.description}
                        onChange={e => setAccountForm({ ...accountForm, description: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: '0.8rem', color: '#0070d2' }}>
                    ℹ️ Company will also be created in Salesforce automatically
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={s.btn()} onClick={saveAccount}>
                      {editAccount ? 'Save Changes' : 'Create Account'}
                    </button>
                    <button style={s.btnOut} onClick={() => { setShowAccountForm(false); setEditAccount(null) }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts list */}
              <div style={s.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Company</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Plan</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Users</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>SF Linked</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: '0.88rem' }}>
                        No accounts yet — onboard your first customer!
                      </td></tr>
                    )}
                    {accounts.map(a => (
                      <tr key={a.id} onClick={() => setSelectedAccount(a)}
                        style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: selectedAccount?.id === a.id ? '#e6f7fc' : '#fff' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{a.company_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>#{a.id}</div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ fontSize: '0.78rem', background: '#f0f9ff', color: '#0070d2', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 8px' }}>
                            {a.plan}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 500, color: '#00bceb' }}>
                          {a.user_count}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {a.sf_account_id
                            ? <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✅ Linked</span>
                            : <span style={{ fontSize: '0.75rem', color: '#ea580c' }}>⚠️ Not linked</span>
                          }
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: a.active ? '#16a34a' : '#dc2626' }}>
                            {a.active ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                            {isAdmin && (
                              <>
                                <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() => { setEditAccount(a); setAccountForm({ company_name: a.company_name, plan: a.plan, phone: '', description: '' }); setShowAccountForm(true) }}>
                                  Edit
                                </button>
                                <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '4px 10px', color: '#dc2626', borderColor: '#fecaca' }}
                                  onClick={() => deleteAccount(a.id)}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User panel — shows when account selected */}
            {selectedAccount && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedAccount.company_name}</h2>
                    <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>Users under this account</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={s.btn()} onClick={() => { setEditUser(null); setUserForm(emptyUser); setShowUserForm(!showUserForm) }}>
                      + Add User
                    </button>
                    <button style={s.btnOut} onClick={() => setSelectedAccount(null)}>✕</button>
                  </div>
                </div>

                {/* User form */}
                {showUserForm && (
                  <div style={s.form}>
                    <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>
                      {editUser ? '✏️ Edit User' : `➕ Add User to ${selectedAccount.company_name}`}
                    </p>
                    <div style={s.grid2}>
                      <div>
                        <label style={s.label}>Full Name *</label>
                        <input style={s.input} placeholder="John Smith" value={userForm.full_name}
                          onChange={e => setUserForm({ ...userForm, full_name: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.label}>Username *</label>
                        <input style={s.input} placeholder="jsmith" value={userForm.username}
                          disabled={!!editUser}
                          onChange={e => setUserForm({ ...userForm, username: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.label}>Email *</label>
                        <input style={s.input} type="email" placeholder="john@abcinc.com" value={userForm.email}
                          onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.label}>Role</label>
                        <select style={s.input} value={userForm.role}
                          onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                          {ROLES_CUSTOMER.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={s.label}>{editUser ? 'New Password (blank = no change)' : 'Password *'}</label>
                        <input style={s.input} type="password" placeholder="Min 8 characters" value={userForm.password}
                          onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: '0.78rem', color: '#666' }}>
                      <strong>admin</strong> — can create tickets, manage company users |
                      <strong> viewer</strong> — read-only, can view tickets only
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.btn()} onClick={saveUser}>{editUser ? 'Save' : 'Create User'}</button>
                      <button style={s.btnOut} onClick={() => { setShowUserForm(false); setEditUser(null) }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div style={s.card}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Name</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Username</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Role</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Status</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountUsers.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#aaa', fontSize: '0.85rem' }}>
                          No users yet — add the first user for {selectedAccount.company_name}
                        </td></tr>
                      )}
                      {accountUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: u.active ? 1 : 0.5 }}>
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#555' }}>{u.username}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.role === 'admin' ? '#7c3aed' : '#666', background: u.role === 'admin' ? '#f5f3ff' : '#f5f5f5', border: `1px solid ${u.role === 'admin' ? '#ddd6fe' : '#e0e0e0'}`, borderRadius: 20, padding: '2px 8px' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.active ? '#16a34a' : '#dc2626' }}>
                              {u.active ? '● Active' : '● Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '3px 8px' }}
                                onClick={() => { setEditUser(u); setUserForm({ ...u, password: '' }); setShowUserForm(true) }}>
                                Edit
                              </button>
                              <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '3px 8px', color: u.active ? '#ea580c' : '#16a34a' }}
                                onClick={() => toggleUser(u)}>
                                {u.active ? 'Disable' : 'Enable'}
                              </button>
                              <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '3px 8px', color: '#dc2626', borderColor: '#fecaca' }}
                                onClick={() => deleteUser(u.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TICKET MANAGEMENT
        ═══════════════════════════════════════════════ */}
        {view === 'tickets' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total',       value: tickets.length,                                    color: '#00bceb' },
                { label: 'New',         value: tickets.filter(t => t.status === 'New').length,    color: '#16a34a' },
                { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, color: '#0070d2' },
                { label: 'Closed',      value: tickets.filter(t => t.status === 'Closed').length, color: '#666' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter + refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all','New','In Progress','Closed','Escalated'].map(f => (
                  <button key={f} onClick={() => setTicketFilter(f)}
                    style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: '0.8rem', cursor: 'pointer', fontWeight: ticketFilter === f ? 600 : 400, background: ticketFilter === f ? '#00bceb' : '#fff', color: ticketFilter === f ? '#fff' : '#666', borderColor: ticketFilter === f ? '#00bceb' : '#e0e0e0' }}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
              <button style={s.btnOut} onClick={fetchTickets}>↻ Refresh from Salesforce</button>
            </div>

            <div style={s.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['Ticket #','Company','Contact','Subject','Priority','Status','Created','SF Link'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                      No tickets found
                    </td></tr>
                  )}
                  {filteredTickets.map(t => (
                    <tr key={t.sf_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#00bceb', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {t.ticket_number || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: 500 }}>{t.company}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '0.82rem' }}>{t.contact_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#888' }}>{t.contact_email}</div>
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                        <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={t.priority} colors={PRIORITY_COLORS[t.priority]} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={t.status} colors={STATUS_COLORS[t.status]} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap' }}>
                        {t.created ? new Date(t.created).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <a href={`https://ciscotechnologies-dev-ed.develop.lightning.force.com/lightning/r/Case/${t.sf_id}/view`}
                          target="_blank" rel="noreferrer"
                          style={{ fontSize: '0.78rem', color: '#00bceb', textDecoration: 'none' }}>
                          Open in SF ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════
            CASE STUDIES
        ═══════════════════════════════════════════════ */}
        {view === 'studies' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Case Studies ({studies.length})</h2>
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>Manage success stories shown on the public website</p>
              </div>
              <button style={s.btn()} onClick={() => { setEditStudy(null); setStudyForm(emptyStudy); setShowStudyForm(!showStudyForm) }}>
                + New Case Study
              </button>
            </div>

            {showStudyForm && (
              <div style={s.form}>
                <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>
                  {editStudy ? '✏️ Edit Case Study' : '➕ New Case Study'}
                </p>
                <div style={s.grid2}>
                  <div>
                    <label style={s.label}>Project Title *</label>
                    <input style={s.input} placeholder="e.g. Avaya to Cisco Migration" value={studyForm.title}
                      onChange={e => setStudyForm({ ...studyForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Client Name *</label>
                    <input style={s.input} placeholder="e.g. Financial Services Co." value={studyForm.client}
                      onChange={e => setStudyForm({ ...studyForm, client: e.target.value })} />
                  </div>
                </div>
                <label style={s.label}>Summary *</label>
                <textarea rows={3} style={{ ...s.input, resize: 'vertical' }} placeholder="What was done for the client..."
                  value={studyForm.summary} onChange={e => setStudyForm({ ...studyForm, summary: e.target.value })} />
                <label style={s.label}>Business Outcome *</label>
                <input style={s.input} placeholder="e.g. Reduced telephony costs by 40%" value={studyForm.outcome}
                  onChange={e => setStudyForm({ ...studyForm, outcome: e.target.value })} />
                <label style={s.label}>Badge</label>
                <select style={s.input} value={studyForm.badge}
                  onChange={e => setStudyForm({ ...studyForm, badge: e.target.value })}>
                  {BADGES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn()} onClick={saveStudy}>{editStudy ? 'Save Changes' : 'Create'}</button>
                  <button style={s.btnOut} onClick={() => { setShowStudyForm(false); setEditStudy(null) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
              {studies.map(cs => (
                <div key={cs.id} style={s.card}>
                  <div style={{ background: 'linear-gradient(135deg,#00bceb,#0078d4)', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem' }}>
                        #{cs.id} · {cs.published ? 'Published' : 'Draft'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditStudy(cs); setStudyForm({ title: cs.title, client: cs.client, summary: cs.summary, outcome: cs.outcome, badge: cs.badge }); setShowStudyForm(true) }}
                          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
                          ✏️
                        </button>
                        <button onClick={() => deleteStudy(cs.id)}
                          style={{ background: 'rgba(220,38,38,0.3)', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
                          🗑
                        </button>
                      </div>
                    </div>
                    <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{cs.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{cs.client}</p>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{cs.summary}</p>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px' }}>
                      <p style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>📈 {cs.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════
            TAC TEAM (admin only)
        ═══════════════════════════════════════════════ */}
        {view === 'agents' && isAdmin && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>TAC Team ({agents.length})</h2>
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>Manage internal staff access to this admin portal</p>
              </div>
              <button style={s.btn()} onClick={() => { setEditAgent(null); setAgentForm(emptyAgent); setShowAgentForm(!showAgentForm) }}>
                + Add Team Member
              </button>
            </div>

            {showAgentForm && (
              <div style={s.form}>
                <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>{editAgent ? '✏️ Edit Agent' : '➕ Add Team Member'}</p>
                <div style={s.grid2}>
                  <div>
                    <label style={s.label}>Full Name *</label>
                    <input style={s.input} placeholder="Jane Doe" value={agentForm.full_name}
                      onChange={e => setAgentForm({ ...agentForm, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Username *</label>
                    <input style={s.input} placeholder="jdoe" value={agentForm.username} disabled={!!editAgent}
                      onChange={e => setAgentForm({ ...agentForm, username: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Email *</label>
                    <input style={s.input} type="email" placeholder="jane@ciscotechnologies.com" value={agentForm.email}
                      onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Role</label>
                    <select style={s.input} value={agentForm.role}
                      onChange={e => setAgentForm({ ...agentForm, role: e.target.value })}>
                      {ROLES_AGENT.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>{editAgent ? 'New Password (blank = no change)' : 'Password *'}</label>
                    <input style={s.input} type="password" value={agentForm.password}
                      onChange={e => setAgentForm({ ...agentForm, password: e.target.value })} />
                  </div>
                  {editAgent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                      <input type="checkbox" id="active" checked={agentForm.active ?? true}
                        onChange={e => setAgentForm({ ...agentForm, active: e.target.checked })} />
                      <label htmlFor="active" style={{ ...s.label, marginBottom: 0 }}>Active</label>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button style={s.btn()} onClick={saveAgent}>{editAgent ? 'Save' : 'Create'}</button>
                  <button style={s.btnOut} onClick={() => { setShowAgentForm(false); setEditAgent(null) }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={s.card}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['Name','Username','Email','Role','Status','Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: a.active ? 1 : 0.5 }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, fontSize: '0.85rem' }}>{a.full_name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#555' }}>{a.username}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#888' }}>{a.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: a.role === 'admin' ? '#7c3aed' : a.role === 'agent' ? '#0070d2' : '#666', background: a.role === 'admin' ? '#f5f3ff' : a.role === 'agent' ? '#eff6ff' : '#f5f5f5', border: '1px solid', borderColor: a.role === 'admin' ? '#ddd6fe' : a.role === 'agent' ? '#bfdbfe' : '#e0e0e0', borderRadius: 20, padding: '2px 8px' }}>
                          {a.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 600, color: a.active ? '#16a34a' : '#dc2626' }}>
                        {a.active ? '● Active' : '● Disabled'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '3px 8px' }}
                            onClick={() => { setEditAgent(a); setAgentForm({ ...a, password: '' }); setShowAgentForm(true) }}>
                            Edit
                          </button>
                          {a.username !== 'admin' && (
                            <button style={{ ...s.btnOut, fontSize: '0.75rem', padding: '3px 8px', color: '#dc2626', borderColor: '#fecaca' }}
                              onClick={() => deleteAgent(a.id)}>
                              Delete
                            </button>
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