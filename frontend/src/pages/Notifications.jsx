import { useState, useEffect } from 'react'
import api from '../utils/api'
import { LoadingScreen, EmptyState } from '../components/shared'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  booking_created: '📋',
  booking_confirmed: '✅',
  booking_rejected: '❌',
  booking_completed: '🏁',
  booking_cancelled: '🚫',
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifs(data.data || [])
      setUnread(data.unread || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      toast.success('تم تعليم الكل كمقروء')
      load()
    } catch {}
  }

  const formatDate = iso => {
    try {
      return new Date(iso).toLocaleDateString('ar-JO', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>🔔 الإشعارات</h1>
            <p style={{ opacity: 0.8 }}>
              {unread > 0 ? `${unread} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
              تعليم الكل كمقروء
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60, maxWidth: 720 }}>
        {loading ? <LoadingScreen /> : notifs.length === 0 ? (
          <EmptyState icon="🔔" title="لا توجد إشعارات" message="ستظهر إشعاراتك هنا عند حدوث أي نشاط على حسابك" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifs.map(n => (
              <div
                key={n.id}
                className="card"
                style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', background: n.is_read ? 'white' : '#fff5f7', borderColor: n.is_read ? 'var(--border)' : 'rgba(233,69,96,0.2)', transition: 'var(--transition)' }}
              >
                <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? 600 : 800, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{n.message}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 6 }}>{formatDate(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
