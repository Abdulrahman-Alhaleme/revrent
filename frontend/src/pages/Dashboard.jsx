import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { BookingStatusBadge, LoadingScreen } from '../components/shared'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [stats, setStats] = useState({ total: 0, active: 0, wishlist: 0 })
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/bookings/my'), api.get('/wishlist')])
      .then(([bRes, wRes]) => {
        const b = bRes.data.data || []
        setBookings(b.slice(0, 5))
        setStats({
          total: b.length,
          active: b.filter(x => ['confirmed', 'active'].includes(x.status)).length,
          wishlist: wRes.data.data?.length || 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleProfileSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('full_name', profileForm.full_name)
      if (profileForm.phone) fd.append('phone', profileForm.phone)
      const { data } = await api.put('/auth/profile', fd)
      updateUser(data.user)
      toast.success('تم تحديث الملف الشخصي')
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handlePwChange = async e => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) { toast.error('كلمة المرور الجديدة غير متطابقة'); return }
    if (pwForm.new_password.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return }
    setChangingPw(true)
    try {
      await api.put('/auth/password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('تم تغيير كلمة المرور')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    } finally {
      setChangingPw(false)
    }
  }

  if (loading) return <LoadingScreen />

  const roleLabel = { user: 'مستخدم', shop_owner: 'صاحب محل', admin: 'مدير النظام' }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
          <p style={{ opacity: 0.8 }}>{roleLabel[user?.role] || user?.role} · {user?.email}</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 36 }}>
          {[
            { label: 'إجمالي الحجوزات', value: stats.total, icon: '📋', color: 'var(--primary)' },
            { label: 'الحجوزات النشطة', value: stats.active, icon: '✅', color: '#065f46' },
            { label: 'المفضلة', value: stats.wishlist, icon: '❤️', color: 'var(--accent)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, color }}>{value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 32, alignItems: 'start' }}>
          {/* Recent bookings */}
          <div>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>📋 آخر الحجوزات</h2>
              {bookings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>لا توجد حجوزات بعد</p>
              ) : bookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.rim_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {b.start_date?.slice(0, 10)} → {b.end_date?.slice(0, 10)}
                    </div>
                    <div style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{b.total_amount} د.أ</div>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              ))}
            </div>

            {/* Change password */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🔑 تغيير كلمة المرور</h2>
              <form onSubmit={handlePwChange}>
                <div className="form-group">
                  <label className="form-label">كلمة المرور الحالية</label>
                  <input type="password" className="form-control" value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">كلمة المرور الجديدة</label>
                  <input type="password" className="form-control" value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">تأكيد كلمة المرور</label>
                  <input type="password" className="form-control" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                </div>
                <button type="submit" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} disabled={changingPw}>
                  {changingPw ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </button>
              </form>
            </div>
          </div>

          {/* Edit profile */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>✏️ تعديل الملف الشخصي</h2>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">الاسم الكامل</label>
                <input className="form-control" value={profileForm.full_name}
                  onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهاتف</label>
                <input className="form-control" value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="07xxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-control" value={user?.email} disabled style={{ opacity: 0.55 }} />
              </div>
              <div className="form-group">
                <label className="form-label">نوع الحساب</label>
                <input className="form-control" value={roleLabel[user?.role] || user?.role} disabled style={{ opacity: 0.55 }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
