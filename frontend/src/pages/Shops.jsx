import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { LoadingScreen, EmptyState } from '../components/shared'

export default function Shops() {
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [pagination, setPagination] = useState({})
  const [page, setPage] = useState(1)

  const fetchShops = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (search) params.search = search
      if (city) params.city = city
      const { data } = await api.get('/shops', { params })
      setShops(data.data || [])
      setPagination(data.pagination || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, city])

  useEffect(() => { fetchShops() }, [page])

  const handleSearch = e => {
    e.preventDefault()
    setPage(1)
    fetchShops()
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>🏪 المحلات المعتمدة</h1>
          <p>تصفح أفضل محلات تأجير مصفات السيارات</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <input
            className="form-control" placeholder="🔍 ابحث عن محل..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 2, minWidth: 200 }}
          />
          <input
            className="form-control" placeholder="📍 المدينة (عمان، إربد...)"
            value={city} onChange={e => setCity(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <button type="submit" className="btn btn-primary">بحث</button>
          {(search || city) && (
            <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setCity(''); setPage(1); }}>مسح</button>
          )}
        </form>

        {loading ? <LoadingScreen /> : shops.length === 0 ? (
          <EmptyState icon="🏪" title="لا توجد محلات" message="لم يتم العثور على محلات مطابقة لبحثك" />
        ) : (
          <>
            <div className="grid-3">
              {shops.map(shop => (
                <div
                  key={shop.id}
                  className="card"
                  style={{ overflow: 'hidden', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => navigate(`/shops/${shop.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '' }}
                >
                  <div style={{ height: 140, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {shop.cover_image && (
                      <img src={shop.cover_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {shop.logo ? (
                        <img src={shop.logo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)' }} />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏪</div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontWeight: 800, marginBottom: 4, fontSize: 17 }}>{shop.name}</h3>
                    {shop.city && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>📍 {shop.city}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {shop.rating > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14 }}>
                          <span style={{ color: 'var(--gold)', fontSize: 16 }}>★</span>
                          <span style={{ fontWeight: 700 }}>{Number(shop.rating).toFixed(1)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({shop.total_reviews})</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-light)', fontSize: 13 }}>لا توجد تقييمات</span>}
                      <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>
                        {shop.available_rims} مصفة
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p} onClick={() => setPage(p)}
                    style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${page === p ? 'var(--accent)' : 'var(--border)'}`, background: page === p ? 'var(--accent)' : 'white', color: page === p ? 'white' : 'var(--text)', fontFamily: 'Cairo', fontWeight: 700, cursor: 'pointer', transition: 'var(--transition)' }}
                  >{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
