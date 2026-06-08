import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RimCard, LoadingScreen } from '../components/shared';
import api from '../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ rims: 120, shops: 35, users: 500 });

  useEffect(() => {
    Promise.all([
      api.get('/rims?limit=8&sort=popular'),
      api.get('/rims/categories'),
    ]).then(([rimsRes, catsRes]) => {
      setFeatured(rimsRes.data.data || []);
      setCategories(catsRes.data.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/rims?search=${encodeURIComponent(search)}`);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white', padding: '80px 0 100px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(233,69,96,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,166,35,0.1) 0%, transparent 40%)' }} />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(233,69,96,0.2)', border: '1px solid rgba(233,69,96,0.4)', borderRadius: 20, padding: '6px 20px', marginBottom: 24, fontSize: 14, color: '#f5a623' }}>
            🔥 أكبر منصة لتأجير مصفات السيارات في الأردن
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 20 }}>
            اعثر على <span style={{ color: '#e94560' }}>مصفة مثالية</span><br />لسيارتك اليوم
          </h1>
          <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 600, margin: '0 auto 40px' }}>
            تواصل مباشرة مع محلات التأجير، احجز بسهولة، وانطلق بستايل
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 600, margin: '0 auto', gap: 0 }}>
            <input
              type="text"
              placeholder="ابحث عن مصفة (الحجم، الماركة، المحل...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '16px 20px', fontSize: 16, borderRadius: '12px 0 0 12px', border: 'none', outline: 'none', fontFamily: 'Cairo', direction: 'rtl' }}
            />
            <button type="submit" className="btn btn-primary btn-lg" style={{ borderRadius: '0 12px 12px 0', gap: 8 }}>
              🔍 بحث
            </button>
          </form>
          {/* Quick filters */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {['17"', '18"', '19"', '20"', '22"'].map(size => (
              <button key={size} onClick={() => navigate(`/rims?size=${size}`)}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Cairo', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 60, padding: '28px 20px', flexWrap: 'wrap' }}>
          {[
            { n: '500+', label: 'مستخدم نشط' },
            { n: '35+', label: 'محل معتمد' },
            { n: '120+', label: 'مصفة متاحة' },
            { n: '98%', label: 'رضا العملاء' },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#e94560' }}>{n}</div>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '60px 0 20px' }}>
        <div className="container">
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>تصفح حسب الفئة</h2>
          <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 36 }}>اختر النوع الذي يناسب ذوقك</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat.id}
                onClick={() => navigate(`/rims?category_id=${cat.id}`)}
                style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 12, padding: '16px 28px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Cairo', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e94560'; e.currentTarget.style.color = '#e94560'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.transform = 'none'; }}
              >
                {cat.name_ar || cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rims */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>المصفات الأكثر طلباً</h2>
              <p style={{ color: '#6b7280' }}>اختيارات موثوقة من محلات معتمدة</p>
            </div>
            <button onClick={() => navigate('/rims')} className="btn btn-outline">عرض الكل ←</button>
          </div>
          {featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
              <p>لا توجد مصفات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid-4">
              {featured.map(rim => <RimCard key={rim.id} rim={rim} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#1a1a2e', color: 'white', padding: '70px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>كيف يعمل RevRent؟</h2>
          <p style={{ opacity: 0.7, marginBottom: 50, fontSize: 16 }}>3 خطوات بسيطة للحصول على مصفة أحلامك</p>
          <div className="grid-3">
            {[
              { icon: '🔍', step: '01', title: 'ابحث واختر', desc: 'تصفح مئات المصفات من محلات معتمدة وفلتر حسب الحجم والسعر والمدينة' },
              { icon: '📅', step: '02', title: 'احجز بسهولة', desc: 'اختر التواريخ المناسبة واحجز في ثوانٍ مع نظام دفع آمن' },
              { icon: '🚗', step: '03', title: 'استمتع بالرحلة', desc: 'استلم مصفتك من المحل أو اطلب التوصيل وانطلق بستايل' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
                <div style={{ color: '#e94560', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>الخطوة {step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{title}</h3>
                <p style={{ opacity: 0.7, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#e94560', color: 'white', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>هل لديك محل تأجير مصفات؟</h2>
          <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 32 }}>انضم إلينا الآن واعرض مصفاتك لآلاف العملاء</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={() => navigate('/register?role=shop_owner')} className="btn btn-dark btn-lg">سجل كصاحب محل</button>
            <button onClick={() => navigate('/rims')} className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>استكشف المصفات</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f0f23', color: 'rgba(255,255,255,0.6)', padding: '30px 0', textAlign: 'center', fontSize: 14 }}>
        <p>© 2025 RevRent · جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
