import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: searchParams.get('role') === 'shop_owner' ? 'shop_owner' : 'user',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('تم إنشاء الحساب بنجاح، أهلاً بك!')
      if (form.role === 'shop_owner') navigate('/shop-dashboard')
      else if (form.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🔧</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>إنشاء حساب</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>انضم إلى RevRent اليوم</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم الكامل *</label>
            <input name="full_name" className="form-control" placeholder="محمد أحمد" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني *</label>
            <input name="email" type="email" className="form-control" placeholder="example@email.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور *</label>
            <input name="password" type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">رقم الهاتف (اختياري)</label>
            <input name="phone" className="form-control" placeholder="07xxxxxxxx" value={form.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">نوع الحساب</label>
            <select name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="user">مستخدم عادي — أريد استئجار مصفات</option>
              <option value="shop_owner">صاحب محل — أريد تأجير مصفاتي</option>
            </select>
          </div>
          <button
            type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px 0' }}
            disabled={loading}
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: 14 }}>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}
