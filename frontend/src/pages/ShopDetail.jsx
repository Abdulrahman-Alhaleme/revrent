import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import { LoadingScreen, RimCard, StarRating } from '../components/shared'

export default function ShopDetail() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/shops/${id}`)
      .then(({ data }) => setShop(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingScreen />
  if (!shop) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
      <h2>المحل غير موجود</h2>
    </div>
  )

  return (
    <div>
      {/* Cover / Header */}
      <div style={{ height: 240, background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
        {shop.cover_image && (
          <img src={shop.cover_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        )}
        <div className="container" style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'flex-end', gap: 20, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 88, height: 88, borderRadius: 16, border: '3px solid rgba(255,255,255,0.3)', overflow: 'hidden', flexShrink: 0, background: shop.logo ? 'transparent' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shop.logo
              ? <img src={shop.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 40, fontWeight: 900, color: 'white' }}>{shop.name?.[0]}</span>}
          </div>
          <div style={{ color: 'white', paddingBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>{shop.name}</h1>
            <div style={{ display: 'flex', gap: 20, fontSize: 14, opacity: 0.9, flexWrap: 'wrap' }}>
              {shop.city && <span>📍 {shop.city}</span>}
              {shop.phone && <span>📞 {shop.phone}</span>}
              {shop.address && <span>🏠 {shop.address}</span>}
              {shop.rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--gold)' }}>★</span>
                  {Number(shop.rating).toFixed(1)} ({shop.total_reviews} تقييم)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px 60px' }}>
        {shop.description && (
          <div className="card" style={{ padding: 20, marginBottom: 32, lineHeight: 1.9, color: 'var(--text-muted)' }}>
            {shop.description}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>
            المصفات المتاحة
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 16, marginRight: 8 }}>({shop.rims?.length || 0})</span>
          </h2>
        </div>

        {!shop.rims?.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔧</div>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>لا توجد مصفات متاحة</h3>
            <p>تحقق لاحقاً، قد يضيف المحل مصفات جديدة</p>
          </div>
        ) : (
          <div className="grid-4">
            {shop.rims.map(rim => <RimCard key={rim.id} rim={rim} />)}
          </div>
        )}
      </div>
    </div>
  )
}
