import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { LoadingScreen, EmptyState, RimCard } from '../components/shared'

export default function Wishlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/wishlist')
      setItems(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>❤️ المفضلة</h1>
          <p>المصفات التي حفظتها لوقت لاحق</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {loading ? <LoadingScreen /> : items.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="قائمة المفضلة فارغة"
            message="أضف مصفات إلى مفضلتك من صفحة المصفات بالضغط على قلب المصفة"
            action={
              <button className="btn btn-primary" onClick={() => navigate('/rims')}>
                تصفح المصفات
              </button>
            }
          />
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>{items.length} مصفة محفوظة</p>
            <div className="grid-4">
              {items.map(rim => (
                <RimCard key={rim.id} rim={{ ...rim, saved: true }} onWishlistToggle={load} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
