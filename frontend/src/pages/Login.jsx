import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success('تم تسجيل الدخول بنجاح')
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'shop_owner') navigate('/shop-dashboard', { replace: true })
      else navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🔧</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>تسجيل الدخول</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>أهلاً بك في RevRent</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              name="email" type="email" className="form-control"
              placeholder="example@email.com"
              value={form.email} onChange={handleChange} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              name="password" type="password" className="form-control"
              placeholder="••••••••"
              value={form.password} onChange={handleChange} required
            />
          </div>
          <button
            type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px 0' }}
            disabled={loading}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: 14 }}>
          ليس لديك حساب؟{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>إنشاء حساب</Link>
        </p>
      </div>
    </div>
  )
}
