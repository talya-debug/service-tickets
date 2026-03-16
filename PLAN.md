# מערכת ניהול קריאות שירות

## מטרה
מערכת פשוטה לניהול קריאות שירות — לקוחות פותחים קריאה, בעל עסק מנהל ומסמן טיפול.

## טק סטאק
- React + Vite + Tailwind CSS
- Firebase Firestore (מסד נתונים)
- EmailJS (שליחת מיילים)
- Vercel (אחסון)

## שני דפים
1. `/` — דף לקוחות (ציבורי) — טופס פתיחת קריאה
2. `/admin` — לוח בקרה (מוגן בסיסמה) — ניהול כל הקריאות

## זרימת עבודה
לקוח פותח קריאה → Firebase שומר → מייל לבעל עסק
בעל עסק לוחץ "טופל" → Firebase מתעדכן → מייל ללקוח

## מבנה קבצים
```
src/
├── pages/
│   ├── CustomerForm.jsx
│   └── AdminDashboard.jsx
├── components/
│   └── TicketCard.jsx
├── lib/
│   ├── firebase.js
│   └── email.js
└── App.jsx
```

## שלבי בנייה
- [x] PLAN.md
- [ ] Vite + React + Tailwind
- [ ] דף לקוחות
- [ ] לוח בקרה
- [ ] חיבור Firebase
- [ ] חיבור EmailJS
- [ ] GitHub + Vercel
