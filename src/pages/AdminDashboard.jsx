// לוח בקרה לבעלת העסק — ניהול קריאות שירות
import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sendCustomerEmail } from '../lib/email'

// סיסמת כניסה — שנה את הערך הזה
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

// =========== לוגין ===========
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">כניסת מנהל</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            placeholder="סיסמה"
            className="border border-slate-200 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-red-500 text-sm">סיסמה שגויה</p>}
          <button
            type="submit"
            className="bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  )
}

// =========== כרטיס קריאה ===========
function TicketCard({ ticket, onResolve }) {
  const [resolving, setResolving] = useState(false)

  async function handleResolve() {
    setResolving(true)
    try {
      // עדכון סטטוס ב-Firebase
      await updateDoc(doc(db, 'tickets', ticket.id), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
      })
      // שליחת מייל ללקוח
      await sendCustomerEmail(ticket)
      onResolve(ticket.id)
    } catch (err) {
      console.error('שגיאה בסגירת קריאה:', err)
    } finally {
      setResolving(false)
    }
  }

  const isOpen = ticket.status === 'open'
  const date = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate().toLocaleDateString('he-IL')
    : '—'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${isOpen ? 'border-slate-100' : 'border-green-100 opacity-70'}`}>
      {/* שורה עליונה */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{ticket.name}</h3>
          <p className="text-sm text-slate-400">{date}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {isOpen ? 'פתוח' : 'טופל'}
        </span>
      </div>

      {/* תיאור */}
      <p className="text-slate-600 text-sm leading-relaxed">{ticket.description}</p>

      {/* פרטי קשר */}
      <div className="text-sm text-slate-400 flex flex-col gap-1">
        <span>✉️ {ticket.email}</span>
        {ticket.phone && <span>📞 {ticket.phone}</span>}
      </div>

      {/* כפתור טיפול */}
      {isOpen && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          className="mt-1 bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {resolving ? 'מסמן...' : '✅ סמן כטופל ושלח מייל ללקוח'}
        </button>
      )}
    </div>
  )
}

// =========== לוח בקרה ראשי ===========
export default function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('open') // open | resolved | all

  useEffect(() => {
    if (!loggedIn) return

    // מאזין לשינויים ב-Firebase בזמן אמת
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setTickets(data)
    })

    return () => unsubscribe()
  }, [loggedIn])

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  // סינון לפי סטטוס
  const filtered = tickets.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* כותרת */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">מערכת קריאות שירות</h1>
          <p className="text-slate-400 text-sm">{openCount} קריאות פתוחות</p>
        </div>
        <button
          onClick={() => setLoggedIn(false)}
          className="text-slate-400 hover:text-white text-sm transition"
        >
          יציאה
        </button>
      </header>

      {/* סינון */}
      <div className="px-6 py-4 flex gap-2">
        {['open', 'resolved', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {{ open: 'פתוחות', resolved: 'טופלו', all: 'הכל' }[f]}
          </button>
        ))}
      </div>

      {/* רשימת קריאות */}
      <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-slate-400 col-span-full text-center mt-8">אין קריאות להצגה</p>
        ) : (
          filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onResolve={(id) => setTickets((prev) =>
                prev.map((t) => (t.id === id ? { ...t, status: 'resolved' } : t))
              )}
            />
          ))
        )}
      </div>
    </div>
  )
}
