import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function RimCard({ rim, onWishlistToggle }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(rim.saved || false);
  const [toggling, setToggling] = useState(false);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); navigate('/login'); return; }
    setToggling(true);
    try {
      const { data } = await api.post('/wishlist', { rim_id: rim.id });
      setSaved(data.saved);
      toast.success(data.message);
      onWishlistToggle?.();
    } catch { toast.error('حدث خطأ'); }
    finally { setToggling(false); }
  };

  return (
    <div className="rim-card" onClick={() => navigate(`/rims/${rim.id}`)}>
      <div style={{ position: 'relative' }}>
        <img
          src={rim.primary_image ? rim.primary_image : '/placeholder-rim.svg'}
          alt={rim.name}
          className="rim-card-image"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=مصفة'; }}
        />
        {rim.is_featured && <span className="badge badge-warning" style={{ position: 'absolute', top: 12, right: 12 }}>⭐ مميز</span>}
        <button
          onClick={handleWishlist}
          disabled={toggling}
          style={{ position: 'absolute', top: 12, left: 12, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        >
          {saved ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="rim-card-body">
        <div className="rim-card-name">{rim.name}</div>
        <div className="rim-card-meta">
          {rim.brand && `${rim.brand} • `}
          {rim.size && `${rim.size} • `}
          {rim.shop_name}
          {rim.city && ` • ${rim.city}`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="rim-card-price">
            {rim.price_per_day} د.أ <span>/ يوم</span>
          </div>
          {rim.material && <span className="badge badge-neutral">{materialAr[rim.material] || rim.material}</span>}
        </div>
      </div>
    </div>
  );
}

const materialAr = { alloy: 'ألومنيوم', steel: 'فولاذ', forged_aluminum: 'مطروق', carbon: 'كربون' };

export function StarRating({ rating, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars" style={{ cursor: onChange ? 'pointer' : 'default', fontSize: size }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(s)}
          style={{ color: s <= (hover || rating) ? '#f5a623' : '#d1d5db' }}
        >★</span>
      ))}
    </div>
  );
}

export function BookingStatusBadge({ status }) {
  const labels = {
    pending: 'قيد الانتظار', confirmed: 'مؤكد', active: 'نشط',
    completed: 'مكتمل', cancelled: 'ملغي', rejected: 'مرفوض'
  };
  return <span className={`badge status-${status}`}>{labels[status] || status}</span>;
}

export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="loading-spinner" />
      <span style={{ color: '#6b7280', fontSize: 15 }}>جاري التحميل...</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3>{title}</h3>
      {message && <p style={{ marginTop: 8, marginBottom: 20 }}>{message}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
