const info = [
  { icon: '📧', label: 'General Enquiries', value: 'info@ciscotechnologies.com' },
  { icon: '🛠️', label: 'Technical Support', value: 'support@ciscotechnologies.com' },
  { icon: '💼', label: 'Sales & Partnerships', value: 'sales@ciscotechnologies.com' },
  { icon: '📞', label: 'Phone', value: '+1 (800) 555-0199' },
  { icon: '🌐', label: 'Website', value: 'www.ciscotechnologies.com' },
  { icon: '🕐', label: 'Support Hours', value: 'Mon–Fri 8am–8pm EST' },
]

export default function Contact() {
  return (
    <div className="page">
      <p className="section-title">Contact Us</p>
      <p className="section-sub">Get in touch with our team of UC & CC specialists</p>

      <div className="grid-2" style={{ marginBottom: 48 }}>
        {info.map(i => (
          <div key={i.label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ fontSize: '1.8rem' }}>{i.icon}</span>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>{i.label}</p>
              <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{i.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Office Location</p>
        <p style={{ color: '#64748b', marginBottom: 16 }}>Headquarters</p>
        <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>
          CiscoTechnologies Inc.<br />
          123 Innovation Drive, Suite 400<br />
          San Jose, CA 95134<br />
          United States
        </p>
      </div>
    </div>
  )
}