import { useState, useEffect } from 'react'
import api from '../utils/api'
import { LoadingScreen } from '../components/shared'
import toast from 'react-hot-toast'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [pendingShops, setPendingShops] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, shopsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/shops?status=pending'),
      ])
      setStats(statsRes.data.data)
      setPendingShops(shopsRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const approveShop = async (id, approve) => {
    try {
      await api.put(`/shops/${id}/approve`, { approve })
      toast.success(approve ? 'تم اعتماد المحل' : 'تم رفض المحل')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>⚙️ لوحة الإدارة</h1>
          <p>إدارة المنصة، المحلات، والمستخدمين</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {/* Stats */}
        {stats && (
          <div className="grid-4" style={{ marginBottom: 40 }}>
            {[
              { label: 'المستخدمون', value: stats.users, icon: '👥', color: 'var(--primary)' },
              { label: 'المحلات', value: `${stats.shops} (${stats.pending_shops || 0} انتظار)`, icon: '🏪', color: '#1e40af' },
              { label: 'المصفات', value: stats.rims, icon: '🔧', color: '#065f46' },
              { label: 'الإيرادات', value: `${Number(stats.revenue || 0).toFixed(0)} د.أ`, icon: '💰', color: '#92400e' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1.3 }}>{value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pending shops */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800 }}>
              محلات تنتظر الموافقة
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 15, marginRight: 8 }}>({pendingShops.length})</span>
            </h2>
          </div>

          {pendingShops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>لا توجد محلات تنتظر الموافقة</h3>
              <p>جميع المحلات تمت مراجعتها</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingShops.map(shop => (
                <div
                  key={shop.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fffbeb', flexWrap: 'wrap', gap: 12 }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden', flexShrink: 0 }}>
                      {shop.logo
                        ? <img src={shop.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🏪'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{shop.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                        {shop.owner_name && `👤 ${shop.owner_name}`}
                        {shop.city && ` · 📍 ${shop.city}`}
                      </div>
                      {shop.phone && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>📞 {shop.phone}</div>}
                      {shop.description && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2, maxWidth: 400 }}>{shop.description.slice(0, 100)}{shop.description.length > 100 ? '...' : ''}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approveShop(shop.id, true)} className="btn btn-sm" style={{ background: '#d1fae5', color: '#065f46' }}>
                      ✅ اعتماد
                    </button>
                    <button onClick={() => approveShop(shop.id, false)} className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>
                      ❌ رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
