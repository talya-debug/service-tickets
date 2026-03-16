// ניתוב ראשי — לקוחות / מנהל
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerForm from './pages/CustomerForm'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
