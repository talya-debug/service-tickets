// שליחת מיילים דרך EmailJS
import emailjs from 'emailjs-com'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// מייל לבעלת העסק כשנפתחת קריאה חדשה
export async function sendOwnerEmail(ticket) {
  return emailjs.send(
    SERVICE_ID,
    import.meta.env.VITE_EMAILJS_OWNER_TEMPLATE,
    {
      ticket_id: ticket.id,
      customer_name: ticket.name,
      customer_email: ticket.email,
      customer_phone: ticket.phone,
      issue_description: ticket.description,
      created_at: new Date(ticket.createdAt?.toDate()).toLocaleString('he-IL'),
    },
    PUBLIC_KEY
  )
}

// מייל ללקוח כשהקריאה טופלה
export async function sendCustomerEmail(ticket) {
  return emailjs.send(
    SERVICE_ID,
    import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE,
    {
      customer_name: ticket.name,
      to_email: ticket.email,
      ticket_id: ticket.id,
      issue_description: ticket.description,
      resolved_at: new Date().toLocaleString('he-IL'),
    },
    PUBLIC_KEY
  )
}
