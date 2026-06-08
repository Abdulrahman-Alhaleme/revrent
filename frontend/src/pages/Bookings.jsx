import { useState, useEffect } from 'react'
import api from '../utils/api'
import { BookingStatusBadge, LoadingScreen, EmptyState } from '../components/shared'
import toast from 'react-hot-toast'

const TABS = [
  { key: '', label: 'الكل' },
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'confirmed', label: 'مؤكد' },
  { key: 'active', label: 'نشط' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'cancelled', label: 'ملغي' },
]

export default function Bookings() {
  const [tab, setTab] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = tab ? { status: tab } : {}
      const { data } = await api.get('/bookings/my', { params })
      setBookings(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [tab])

  const cancelBooking = async (id) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return
    try {
      await api.put(`/bookings/${id}/status`, { status: 'cancelled' })
      toast.success('تم إلغاء الحجز')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>📋 حجوزاتي</h1>
          <p>تتبع جميع طلبات الحجز الخاصة بك</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="tabs" style={{ overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingScreen /> : bookings.length === 0 ? (
          <EmptyState icon="📋" title="لا توجد حجوزات" message="لم يتم العثور على حجوزات في هذه الفئة" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <img
                  src={b.rim_image || ''}
                  alt=""
                  onError={e => { e.target.style.display = 'none' }}
                  style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: '#f3f4f6' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: 16 }}>{b.rim_name}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{b.shop_name}</div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>

                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: 12 }}>
                    <span>من: <strong style={{ color: 'var(--text)' }}>{b.start_date?.slice(0, 10)}</strong></span>
                    <span>إلى: <strong style={{ color: 'var(--text)' }}>{b.end_date?.slice(0, 10)}</strong></span>
                    <span>المدة: <strong style={{ color: 'var(--text)' }}>{b.total_days} يوم</strong></span>
                    {b.delivery_required && <span style={{ color: 'var(--accent)' }}>🚗 مع توصيل</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{b.total_amount} د.أ</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 6 }}>(يشمل رسوم الخدمة)</span>
                    </div>
                    {b.status === 'pending' && (
                      <button onClick={() => cancelBooking(b.id)} className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>
                        إلغاء الحجز
                      </button>
                    )}
                  </div>

                  {b.notes && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ملاحظة: {b.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
