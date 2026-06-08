import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen, StarRating } from '../components/shared'
import toast from 'react-hot-toast'


export default function RimDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rim, setRim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [booking, setBooking] = useState({ start_date: '', end_date: '', notes: '', delivery_required: false })
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    api.get(`/rims/${id}`)
      .then(({ data }) => setRim(data.data))
      .catch(() => toast.error('تعذر تحميل بيانات المصفة'))
      .finally(() => setLoading(false))
  }, [id])

  const totalDays = () => {
    if (!booking.start_date || !booking.end_date) return 0
    const diff = (new Date(booking.end_date) - new Date(booking.start_date)) / 86400000
    return diff > 0 ? Math.ceil(diff) : 0
  }
  const subtotal = () => totalDays() * (rim?.price_per_day || 0)
  const serviceFee = () => +(subtotal() * 0.05).toFixed(2)
  const total = () => +(subtotal() + serviceFee()).toFixed(2)

  const handleBook = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); navigate('/login'); return }
    if (!booking.start_date || !booking.end_date) { toast.error('يرجى تحديد تواريخ الحجز'); return }
    if (totalDays() <= 0) { toast.error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية'); return }
    setBookingLoading(true)
    try {
      await api.post('/bookings', { rim_id: rim.id, ...booking })
      toast.success('تم إرسال طلب الحجز بنجاح!')
      navigate('/bookings')
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!rim) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
      <h2>المصفة غير موجودة</h2>
    </div>
  )

  const images = rim.images?.length ? rim.images : []
  const mainSrc = images[activeImg]?.image_url || null
  const today = new Date().toISOString().split('T')[0]

  const specs = [
    ['الحجم', rim.size],
    ['الكمية المتاحة', rim.available_quantity],
  ].filter(([, v]) => v != null && v !== '')

  return (
    <div className="container" style={{ padding: '40px 20px 60px' }}>
      <div className="grid-2" style={{ gap: 40, alignItems: 'start' }}>

        {/* ── Left Column ── */}
        <div>
          {/* Main image */}
          <div className="rim-detail-main-img" style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10, background: '#f3f4f6', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {mainSrc ? (
              <img
                src={mainSrc} alt={rim.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = 'https://via.placeholder.com/600x380?text=مصفة' }}
              />
            ) : (
              <div style={{ fontSize: 80, opacity: 0.3 }}>🔧</div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {images.map((img, i) => (
                <img
                  key={i} src={img.image_url} alt=""
                  onClick={() => setActiveImg(i)}
                  style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: `2.5px solid ${activeImg === i ? 'var(--accent)' : 'transparent'}`, flexShrink: 0, transition: 'var(--transition)' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
          )}

          {/* Spec grid */}
          <div className="card" style={{ padding: 24, marginTop: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>تفاصيل المصفة</h2>
            {specs.length > 0 ? (
              <div className="grid-2" style={{ gap: 12 }}>
                {specs.map(([label, val]) => (
                  <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)' }}>لا توجد تفاصيل إضافية</p>}

            {/* Security & service badges */}
            {(rim.has_cameras || rim.has_security || rim.has_delivery || rim.has_insurance) && (
              <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {rim.has_cameras && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 13 }}>🎥 مؤمن بكاميرات</span>
                )}
                {rim.has_security && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: 13 }}>👮 يوجد حارس أمن</span>
                )}
                {rim.has_delivery && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#fefce8', color: '#a16207', fontWeight: 700, fontSize: 13 }}>🚚 توصيل وإرجاع</span>
                )}
                {rim.has_insurance && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: '#fdf4ff', color: '#7e22ce', fontWeight: 700, fontSize: 13 }}>🛡️ تأمين على المصفات</span>
                )}
              </div>
            )}

            {rim.description && (
              <div style={{ marginTop: 18, padding: 16, background: 'var(--bg)', borderRadius: 8, lineHeight: 1.9, color: 'var(--text-muted)' }}>
                {rim.description}
              </div>
            )}
          </div>

          {/* Reviews */}
          {rim.reviews?.length > 0 && (
            <div className="card" style={{ padding: 24, marginTop: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>
                التقييمات <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({rim.reviews.length})</span>
              </h2>
              {rim.reviews.map((rv, i) => (
                <div key={i} style={{ borderBottom: i < rim.reviews.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                      {rv.reviewer_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{rv.reviewer_name}</div>
                      <StarRating rating={rv.rating} />
                    </div>
                    {rv.title && <div style={{ fontWeight: 600, flex: 1, textAlign: 'left' }}>{rv.title}</div>}
                  </div>
                  {rv.comment && <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{rv.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="rim-booking-sticky" style={{ position: 'sticky', top: 88 }}>
          {/* Title + price */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{rim.name}</h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent)' }}>{rim.price_per_day}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>د.أ / يوم</span>
            </div>
            {rim.price_per_week && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 2 }}>أسبوعياً: <strong>{rim.price_per_week} د.أ</strong></div>
            )}
            {rim.price_per_month && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>شهرياً: <strong>{rim.price_per_month} د.أ</strong></div>
            )}
          </div>

          {/* Booking form */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 18 }}>📅 احجز الآن</h3>
            <div className="form-group">
              <label className="form-label">تاريخ البداية</label>
              <input type="date" className="form-control" min={today} value={booking.start_date}
                onChange={e => setBooking(b => ({ ...b, start_date: e.target.value, end_date: '' }))} />
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ الانتهاء</label>
              <input type="date" className="form-control"
                min={booking.start_date || today} value={booking.end_date}
                onChange={e => setBooking(b => ({ ...b, end_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات (اختياري)</label>
              <textarea className="form-control" placeholder="أي ملاحظات أو طلبات خاصة..."
                value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                style={{ minHeight: 72 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14, fontWeight: 600, userSelect: 'none' }}>
              <input type="checkbox" checked={booking.delivery_required}
                onChange={e => setBooking(b => ({ ...b, delivery_required: e.target.checked }))}
                style={{ width: 16, height: 16 }} />
              أحتاج خدمة التوصيل
            </label>

            {/* Price breakdown */}
            {totalDays() > 0 && (
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{rim.price_per_day} د.أ × {totalDays()} يوم</span>
                  <span style={{ fontWeight: 600 }}>{subtotal().toFixed(2)} د.أ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--text-muted)' }}>
                  <span>رسوم الخدمة (5%)</span>
                  <span>{serviceFee()} د.أ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span>المجموع</span>
                  <span style={{ color: 'var(--accent)' }}>{total()} د.أ</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBook} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'جاري الإرسال...' : 'احجز الآن'}
            </button>
          </div>

          {/* Shop info */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 14 }}>معلومات المحل</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              {rim.shop_logo ? (
                <img src={rim.shop_logo} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: 10, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
                  {rim.shop_name?.[0]}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{rim.shop_name}</div>
                {rim.city && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>📍 {rim.city}</div>}
                {rim.shop_rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <StarRating rating={Math.round(Number(rim.shop_rating))} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({rim.shop_total_reviews})</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(`/shops/${rim.shop_id}`)}
              className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}
            >
              عرض صفحة المحل
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
