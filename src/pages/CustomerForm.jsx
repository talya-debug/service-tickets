// דף לקוחות — פתיחת קריאת שירות | TALYA OSHER
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { sendOwnerEmail } from '../lib/email'

async function uploadImages(files, ticketId) {
  const urls = []
  for (const file of files) {
    const storageRef = ref(storage, `tickets/${ticketId}/${Date.now()}_${file.name || 'paste.png'}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    urls.push(url)
  }
  return urls
}

export default function CustomerForm() {
  const [searchParams] = useSearchParams()
  const project = searchParams.get('project') || 'כללי'

  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '', type: 'bug' })
  const [pastedImages, setPastedImages] = useState([])
  const [status, setStatus] = useState('idle')
  const [ticketId, setTicketId] = useState('')
  const fileInputRef = useRef()

  // הדבקה מהמחשב (Ctrl+V)
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      const imageFiles = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push({ file, preview: URL.createObjectURL(file) })
        }
      }
      if (imageFiles.length > 0)
        setPastedImages(prev => [...prev, ...imageFiles].slice(0, 5))
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // העלאת קבצים מהנייד/גלריה
  function handleFileInput(e) {
    const files = Array.from(e.target.files)
    const imageFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }))
    setPastedImages(prev => [...prev, ...imageFiles].slice(0, 5))
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      // שמירת הטיקט — זה העיקר
      const docRef = await addDoc(collection(db, 'tickets'), {
        ...form, project, status: 'open', images: [], createdAt: serverTimestamp(),
      })

      // מציגים הצלחה מיד
      setTicketId(docRef.id.slice(0, 6).toUpperCase())
      setStatus('success')

      // תמונות ומייל ברקע
      if (pastedImages.length > 0) {
        uploadImages(pastedImages.map(i => i.file), docRef.id)
          .then(urls => updateDoc(doc(db, 'tickets', docRef.id), { images: urls }))
          .catch(err => console.warn('העלאת תמונות נכשלה:', err))
      }
      sendOwnerEmail({ ...form, id: docRef.id, createdAt: { toDate: () => new Date() } })
        .catch(() => {})

    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  // ===== מסך הצלחה =====
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <Header />
        <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.10)', padding: 40, textAlign: 'center', direction: 'rtl' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 10px' }}>הקריאה נפתחה בהצלחה!</h2>
            <div style={{ background: '#eef2ff', borderRadius: 12, padding: '14px 20px', margin: '0 0 14px', display: 'inline-block', minWidth: 200 }}>
              <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>מספר פנייה</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#4338ca', letterSpacing: '0.15em' }}>#{ticketId}</div>
            </div>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, margin: '0 0 28px' }}>
              קיבלנו את הפנייה שלך ונחזור אליך בהקדם.<br/>שמור את מספר הפנייה לצורך מעקב.
            </p>
            <button
              onClick={() => { setForm({ name: '', email: '', phone: '', description: '', type: 'bug' }); setPastedImages([]); setStatus('idle'); setTicketId('') }}
              style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              פתח קריאה נוספת
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== הטופס =====
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      <div style={{ maxWidth: 540, margin: '28px auto', padding: '0 16px', paddingBottom: 40 }}>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.10)', overflow: 'hidden', direction: 'rtl' }}>

          {/* Card Header */}
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)', padding: '22px 24px' }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, marginBottom: 10 }}>
              {project}
            </span>
            <h1 style={{ color: '#fff', fontSize: 21, fontWeight: 800, margin: '0 0 4px' }}>פתיחת קריאת שירות</h1>
            <p style={{ color: '#c7d2fe', fontSize: 12, margin: 0 }}>מלא את הפרטים ונחזור אליך בהקדם</p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px 24px 28px' }}>

            {/* ===== סוג הפנייה ===== */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>סוג הפנייה *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { val: 'bug', emoji: '🐛', title: 'תקלה', sub: 'בעיה במערכת' },
                  { val: 'dev', emoji: '✨', title: 'פיתוח', sub: 'שינוי / תוספת' },
                ].map(({ val, emoji, title, sub }) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, type: val })}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 12, border: '2px solid',
                      borderColor: form.type === val ? '#6366f1' : '#e2e8f0',
                      background: form.type === val ? '#eef2ff' : '#f8fafc',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.type === val ? '#4338ca' : '#374151' }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ===== שם מלא ===== */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>שם מלא *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="ישראל ישראלי" style={inputStyle} />
            </div>

            {/* ===== מייל ===== */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>מייל *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="mail@example.com" style={inputStyle} />
            </div>

            {/* ===== טלפון ===== */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>טלפון</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="050-0000000" style={inputStyle} />
            </div>

            {/* ===== תיאור ===== */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                {form.type === 'bug' ? 'תיאור התקלה *' : 'תיאור הבקשה *'}
              </label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={4}
                placeholder={form.type === 'bug'
                  ? 'תאר את התקלה בפירוט — מה קרה, מתי, באיזה שלב...'
                  : 'תאר את השינוי או התוספת הרצויה...'}
                style={{ ...inputStyle, resize: 'none', height: 110 }} />
            </div>

            {/* ===== צילומי מסך ===== */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>
                צילומי מסך <span style={{ color: '#94a3b8', fontWeight: 400 }}>(אופציונלי)</span>
              </label>

              {/* כפתור העלאה — עובד בנייד ובמחשב */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc',
                border: '1.5px dashed #c7d2fe', borderRadius: 12, padding: '13px 16px',
                cursor: 'pointer', marginBottom: 8,
              }}>
                <span style={{ fontSize: 20 }}>📎</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  <strong style={{ color: '#4338ca' }}>בחר תמונה</strong> מהגלריה / קבצים
                </span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: 'none' }} />
              </label>

              {/* הדבקה מהמחשב */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '10px 16px' }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>או Ctrl+V להדבקת צילום מסך (מהמחשב)</span>
              </div>

              {/* תצוגת תמונות */}
              {pastedImages.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  {pastedImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img.preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid #e0e7ff' }} />
                      <button type="button" onClick={() => setPastedImages(p => p.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===== שליחה ===== */}
            <button type="submit" disabled={status === 'loading'}
              style={{ width: '100%', background: status === 'loading' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 16, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {status === 'loading' ? <><SpinnerIcon /> שולח...</> : 'שלח קריאה ←'}
            </button>

            {status === 'error' && (
              <p style={{ color: '#ef4444', textAlign: 'center', fontSize: 13, marginTop: 12, background: '#fef2f2', padding: '8px 0', borderRadius: 8 }}>
                משהו השתבש — נסה שוב
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

// ===== Header =====
function Header() {
  return (
    <div style={{ background: '#0f172a', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>T</div>
      <div>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.15em' }}>TALYA OSHER</div>
        <div style={{ color: '#818cf8', fontSize: 11 }}>בונים תשתיות לעסקים</div>
      </div>
    </div>
  )
}

// ===== סטיילים =====
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6
}
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px',
  fontSize: 14, color: '#1e293b', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif', direction: 'rtl'
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  )
}
