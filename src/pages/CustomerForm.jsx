// דף לקוחות — פתיחת קריאת שירות
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sendOwnerEmail } from '../lib/email'

export default function CustomerForm() {
  // קריאת שם הפרויקט מה-URL (לדוגמה: ?project=יעל-סיסו)
  const [searchParams] = useSearchParams()
  const project = searchParams.get('project') || 'כללי'

  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    try {
      // שמירה ב-Firebase כולל שם הפרויקט
      const docRef = await addDoc(collection(db, 'tickets'), {
        ...form,
        project,
        status: 'open',
        createdAt: serverTimestamp(),
      })

      // שליחת מייל לבעלת העסק
      await sendOwnerEmail({ ...form, id: docRef.id, createdAt: { toDate: () => new Date() } })

      setStatus('success')
      setForm({ name: '', email: '', phone: '', description: '' })
    } catch (err) {
      console.error('שגיאה בשמירת הקריאה:', err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">הקריאה נפתחה בהצלחה!</h2>
          <p className="text-slate-500 mb-6">נחזור אליך בהקדם. תקבל מייל כשהבעיה תטופל.</p>
          <button
            onClick={() => setStatus('idle')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            פתח קריאה נוספת
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* כותרת */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">פתיחת קריאת שירות</h1>
          <p className="text-slate-500 mt-1">מלא את הפרטים ונחזור אליך בהקדם</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* שם מלא */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="ישראל ישראלי"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* מייל */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כתובת מייל</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="israel@example.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* טלפון */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">טלפון</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="050-0000000"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* תיאור הבעיה */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תיאור הבעיה</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="תאר את הבעיה בפירוט..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          {/* כפתור שליחה */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 mt-2"
          >
            {status === 'loading' ? 'שולח...' : 'שלח קריאה'}
          </button>

          {status === 'error' && (
            <p className="text-red-500 text-center text-sm">משהו השתבש. נסה שוב.</p>
          )}
        </form>
      </div>
    </div>
  )
}
