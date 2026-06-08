import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RimCard, LoadingScreen, EmptyState } from '../components/shared';
import api from '../utils/api';

const sizes = ['14"','15"','16"','17"','18"','19"','20"','21"','22"'];
const materials = { alloy: 'ألومنيوم', steel: 'فولاذ', forged_aluminum: 'مطروق', carbon: 'كربون' };

export default function RimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rims, setRims] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    size: searchParams.get('size') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: '',
    max_price: '',
    city: '',
    sort: 'newest',
    page: 1,
  });

  useEffect(() => {
    api.get('/rims/categories').then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const fetchRims = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null));
      const { data } = await api.get('/rims', { params });
      setRims(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRims(); }, [fetchRims]);

  const updateFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }} className="rims-layout">
      {/* Mobile filter overlay */}
      <div className={`filters-overlay ${showFilters ? 'visible' : ''}`} onClick={() => setShowFilters(false)} />

      {/* Sidebar Filters */}
      <aside className={`filters-sidebar ${showFilters ? 'mobile-open' : ''}`} style={{ width: 260, flexShrink: 0, padding: '24px 0 24px 20px', background: 'white', borderLeft: '1px solid #e5e7eb', position: 'sticky', top: 68, height: 'calc(100vh - 68px)', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>🎛️ الفلاتر</h3>
            <button className="mobile-filter-close btn btn-sm btn-outline" onClick={() => setShowFilters(false)} style={{ padding: '4px 10px' }}>✕ إغلاق</button>
          </div>

          {/* Sort */}
          <div className="form-group">
            <label className="form-label">الترتيب</label>
            <select className="form-control" value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
              <option value="newest">الأحدث</option>
              <option value="price_asc">السعر: الأقل أولاً</option>
              <option value="price_desc">السعر: الأعلى أولاً</option>
              <option value="popular">الأكثر مشاهدة</option>
            </select>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">الفئة</label>
            <select className="form-control" value={filters.category_id} onChange={e => updateFilter('category_id', e.target.value)}>
              <option value="">جميع الفئات</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>)}
            </select>
          </div>

          {/* Size */}
          <div className="form-group">
            <label className="form-label">الحجم</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sizes.map(s => (
                <button key={s} onClick={() => updateFilter('size', filters.size === s ? '' : s)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: `2px solid ${filters.size === s ? '#e94560' : '#e5e7eb'}`, background: filters.size === s ? '#fff0f3' : 'white', color: filters.size === s ? '#e94560' : '#1a1a2e', fontFamily: 'Cairo', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="form-label">السعر / يوم (د.أ)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" className="form-control" placeholder="من" value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
              <input type="number" className="form-control" placeholder="إلى" value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
            </div>
          </div>

          {/* City */}
          <div className="form-group">
            <label className="form-label">المدينة</label>
            <input type="text" className="form-control" placeholder="عمان، إربد..." value={filters.city} onChange={e => updateFilter('city', e.target.value)} />
          </div>

          <button onClick={() => setFilters({ search: '', size: '', category_id: '', min_price: '', max_price: '', city: '', sort: 'newest', page: 1 })}
            className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            🔄 إعادة تعيين
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px 24px 24px 0', minWidth: 0 }}>
        {/* Mobile filter button */}
        <button className="mobile-filter-btn btn btn-outline" onClick={() => setShowFilters(true)} style={{ gap: 8 }}>
          🎛️ الفلاتر
          {(filters.size || filters.category_id || filters.min_price || filters.max_price || filters.city) && (
            <span style={{ background: '#e94560', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>
          )}
        </button>

        {/* Search bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <input type="text" className="form-control" placeholder="🔍 ابحث عن مصفة..." value={filters.search} onChange={e => updateFilter('search', e.target.value)}
              style={{ padding: '13px 20px', fontSize: 16, paddingRight: 48, borderRadius: 12 }}
              onKeyDown={e => e.key === 'Enter' && fetchRims()}
            />
          </div>
        </div>

        {/* Results count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            {loading ? 'جاري البحث...' : `${pagination.total || 0} نتيجة`}
          </p>
        </div>

        {loading ? <LoadingScreen /> :
          rims.length === 0 ? (
            <EmptyState icon="🔧" title="لا توجد مصفات" message="جرب تعديل الفلاتر أو البحث بكلمات مختلفة" />
          ) : (
            <>
              <div className="grid-3">
                {rims.map(rim => <RimCard key={rim.id} rim={rim} />)}
              </div>
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                      style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${filters.page === p ? '#e94560' : '#e5e7eb'}`, background: filters.page === p ? '#e94560' : 'white', color: filters.page === p ? 'white' : '#1a1a2e', fontFamily: 'Cairo', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        }
      </main>
    </div>
  );
}
