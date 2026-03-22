// לוח בקרה — TALYA OSHER | מערכת קריאות שירות
import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sendCustomerEmail } from '../lib/email'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

const S = {
  page:     { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', direction: 'rtl' },
  header:   { background: '#0f172a', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo:     { display: 'flex', alignItems: 'center', gap: 12 },
  logoBox:  { width: 36, height: 36, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 },
  logoName: { color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.15em' },
  logoSub:  { color: '#818cf8', fontSize: 11 },
}

// =========== לוגין ===========
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) { onLogin() }
    else { setErr(true); setPw('') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoBox}>T</div>
          <div>
            <div style={S.logoName}>TALYA OSHER</div>
            <div style={S.logoSub}>בונים תשתיות לעסקים</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eef2ff', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>כניסה למערכת</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 28px' }}>הזן סיסמה להמשך</p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }} placeholder="סיסמה"
              style={{ border: err ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: 14, textAlign: 'center', outline: 'none', background: '#f8fafc', direction: 'rtl' }} />
            {err && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>סיסמה שגויה</p>}
            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              כניסה
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// =========== כרטיס קריאה ===========
function TicketCard({ ticket, onResolve }) {
  const [resolving, setResolving] = useState(false)
  const isOpen = ticket.status === 'open'
  const date = ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  async function handleResolve() {
    setResolving(true)
    try {
      await updateDoc(doc(db, 'tickets', ticket.id), { status: 'resolved', resolvedAt: serverTimestamp() })
      await sendCustomerEmail(ticket)
      onResolve(ticket.id)
    } catch (err) { console.error(err) }
    finally { setResolving(false) }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, opacity: isOpen ? 1 : 0.65, border: isOpen ? '1.5px solid #e2e8f0' : '1.5px solid #bbf7d0' }}>

      {/* שורה עליונה */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{ticket.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{date}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: isOpen ? '#fef3c7' : '#dcfce7', color: isOpen ? '#92400e' : '#166534' }}>
            {isOpen ? '🔴 פתוח' : '✅ טופל'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#eef2ff', color: '#6366f1' }}>
            {ticket.project || 'כללי'}
          </span>
          {ticket.type && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: ticket.type === 'bug' ? '#fef3c7' : '#f0fdf4', color: ticket.type === 'bug' ? '#92400e' : '#166534' }}>
              {ticket.type === 'bug' ? '🐛 תקלה' : '✨ פיתוח'}
            </span>
          )}
        </div>
      </div>

      {/* תיאור */}
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0, background: '#f8fafc', padding: '10px 14px', borderRadius: 10, borderRight: '3px solid #c7d2fe' }}>
        {ticket.description}
      </p>

      {/* תמונות */}
      {ticket.images?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ticket.images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '2px solid #e2e8f0', cursor: 'pointer' }} />
            </a>
          ))}
        </div>
      )}

      {/* פרטי קשר */}
      <div style={{ fontSize: 13, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>✉️ {ticket.email}</span>
        {ticket.phone && <span>📞 {ticket.phone}</span>}
      </div>

      {/* כפתור טיפול */}
      {isOpen && (
        <button onClick={handleResolve} disabled={resolving}
          style={{ background: resolving ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: resolving ? 'not-allowed' : 'pointer' }}>
          {resolving ? 'מסמן...' : '✅ סמן כטופל'}
        </button>
      )}
    </div>
  )
}

// =========== ניהול קישורים ===========
function LinksManager() {
  const [name, setName] = useState('')
  const [links, setLinks] = useState(() => { try { return JSON.parse(localStorage.getItem('client-links') || '[]') } catch { return [] } })
  const [copiedId, setCopiedId] = useState(null)

  const getUrl = (n) => `${window.location.origin}/?project=${encodeURIComponent(n)}`

  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n || links.find(l => l.name === n)) return
    const next = [...links, { id: Date.now(), name: n }]
    setLinks(next); localStorage.setItem('client-links', JSON.stringify(next)); setName('')
  }

  function del(id) {
    const next = links.filter(l => l.id !== id)
    setLinks(next); localStorage.setItem('client-links', JSON.stringify(next))
  }

  function copy(id, n) {
    navigator.clipboard.writeText(getUrl(n)); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ maxWidth: 680, padding: '32px 32px' }}>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>כל לקוח מקבל לינק ייחודי לטופס שירות עם שמו.</p>

      <form onSubmit={add} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם הלקוח / פרויקט"
          style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#1e293b', background: '#fff', outline: 'none', direction: 'rtl' }} />
        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + צור לינק
        </button>
      </form>

      {links.length === 0
        ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>עדיין לא נוצרו לינקים</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map(link => (
              <div key={link.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{link.name}</span>
                  <button onClick={() => del(link.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 13 }}>🗑 מחק</button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', marginBottom: 12, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getUrl(link.name)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copy(link.id, link.name)} style={{ flex: 1, background: copiedId === link.id ? '#dcfce7' : '#f1f5f9', color: copiedId === link.id ? '#166534' : '#475569', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {copiedId === link.id ? '✓ הועתק!' : '📋 העתק לינק'}
                  </button>
                  <button onClick={() => window.open(getUrl(link.name), '_blank')} style={{ flex: 1, background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    👁 תצוגה מקדימה
                  </button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// =========== לוח בקרה ראשי ===========
export default function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('open')
  const [projectFilter, setProjectFilter] = useState('all')
  const [tab, setTab] = useState('tickets')

  useEffect(() => {
    if (!loggedIn) return
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [loggedIn])

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  const openCount     = tickets.filter(t => t.status === 'open').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length
  const projects      = ['all', ...new Set(tickets.map(t => t.project || 'כללי'))]

  const filtered = tickets.filter(t => {
    const s = filter === 'all' || t.status === filter
    const p = projectFilter === 'all' || (t.project || 'כללי') === projectFilter
    return s && p
  })

  return (
    <div style={S.page}>

      {/* ===== Header ===== */}
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoBox}>T</div>
          <div>
            <div style={S.logoName}>TALYA OSHER</div>
            <div style={S.logoSub}>מערכת קריאות שירות</div>
          </div>
        </div>
        <button onClick={() => setLoggedIn(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
          יציאה
        </button>
      </div>

      {/* ===== כרטיסי סטטיסטיקה ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '24px 32px 0' }}>
        {[
          { label: 'קריאות פתוחות', value: openCount,         color: '#fbbf24', bg: '#fffbeb' },
          { label: 'טופלו',         value: resolvedCount,     color: '#34d399', bg: '#f0fdf4' },
          { label: 'סה"כ',          value: tickets.length,    color: '#818cf8', bg: '#eef2ff' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderRight: `4px solid ${stat.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ===== ניווט טאבים ===== */}
      <div style={{ display: 'flex', gap: 0, padding: '20px 32px 0', borderBottom: '2px solid #e2e8f0', margin: '0' }}>
        {[['tickets', '📋 קריאות שירות'], ['links', '🔗 קישורים ללקוחות']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #6366f1' : '2px solid transparent', color: tab === key ? '#6366f1' : '#64748b', fontWeight: tab === key ? 700 : 500, fontSize: 14, padding: '10px 20px', cursor: 'pointer', marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ===== תוכן לפי טאב ===== */}
      {tab === 'links' ? <LinksManager /> : (
        <div style={{ padding: '24px 32px 48px' }}>

          {/* סינונים */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            {/* סטטוס */}
            {[['open','פתוחות'], ['resolved','טופלו'], ['all','הכל']].map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ background: filter === f ? '#6366f1' : '#fff', color: filter === f ? '#fff' : '#475569', border: '1.5px solid', borderColor: filter === f ? '#6366f1' : '#e2e8f0', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {label}
              </button>
            ))}

            {/* סינון פרויקט — dropdown */}
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer', outline: 'none', direction: 'rtl' }}>
              {projects.map(p => (
                <option key={p} value={p}>{p === 'all' ? 'כל הפרויקטים' : p}</option>
              ))}
            </select>
          </div>

          {/* רשימת קריאות */}
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontSize: 15 }}>
                {tickets.length === 0 ? '📭 עדיין לא נפתחו קריאות שירות' : 'אין קריאות להצגה'}
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filtered.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket}
                    onResolve={id => setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t))} />
                ))}
              </div>
          }
        </div>
      )}
    </div>
  )
}
