// שליחת מיילים דרך EmailJS — אם לא מוגדר, ממשיך בלי לקרוס
import emailjs from 'emailjs-com'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// בדיקה אם EmailJS מוגדר
function isConfigured() {
  return SERVICE_ID && PUBLIC_KEY && SERVICE_ID !== '' && PUBLIC_KEY !== ''
}

export async function sendOwnerEmail(ticket) {
  if (!isConfigured()) return // אין הגדרות — ממשיך בלי מייל
  try {
    return await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_OWNER_TEMPLATE, {
      ticket_id: ticket.id,
      customer_name: ticket.name,
      customer_email: ticket.email,
      customer_phone: ticket.phone,
      issue_description: ticket.description,
      created_at: new Date().toLocaleString('he-IL'),
    }, PUBLIC_KEY)
  } catch (err) {
    console.warn('מייל לא נשלח (EmailJS לא מוגדר):', err)
  }
}

export async function sendCustomerEmail(ticket) {
  if (!isConfigured()) return
  try {
    return await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE, {
      customer_name: ticket.name,
      to_email: ticket.email,
      ticket_id: ticket.id,
      issue_description: ticket.description,
      resolved_at: new Date().toLocaleString('he-IL'),
    }, PUBLIC_KEY)
  } catch (err) {
    console.warn('מייל ללקוח לא נשלח:', err)
  }
}
