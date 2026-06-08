import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => setUnread(data.unread || 0)).catch(() => {});
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar" ref={navRef} style={{ position: 'relative' }}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          🔧 Rim<span>Rent</span>
        </Link>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end>الرئيسية</NavLink>
          <NavLink to="/rims" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>المصفات</NavLink>
          <NavLink to="/shops" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>المحلات</NavLink>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Cairo', fontSize: 15 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {user.full_name?.[0]?.toUpperCase()}
                </div>
                <span className="navbar-user-name">{user.full_name?.split(' ')[0]}</span>
                {unread > 0 && <span style={{ background: '#e94560', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 200, padding: 8, zIndex: 200, color: '#1a1a2e' }} onMouseLeave={() => setMenuOpen(false)}>
                  <Link to="/dashboard" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>📊 لوحة التحكم</Link>
                  <Link to="/bookings" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>📋 حجوزاتي</Link>
                  {user.role === 'shop_owner' && <Link to="/shop-dashboard" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>🏪 لوحة المحل</Link>}
                  {user.role === 'admin' && <Link to="/admin" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>⚙️ الإدارة</Link>}
                  <Link to="/notifications" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>
                    🔔 الإشعارات {unread > 0 && `(${unread})`}
                  </Link>
                  <Link to="/wishlist" style={{ display: 'block', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }} onClick={() => setMenuOpen(false)}>❤️ المفضلة</Link>
                  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'right', padding: '10px 16px', borderRadius: 8, background: 'none', cursor: 'pointer', fontFamily: 'Cairo', fontSize: 14, fontWeight: 600, color: '#e94560' }}>🚪 تسجيل الخروج</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>تسجيل الدخول</Link>
              <Link to="/register" className="btn btn-primary btn-sm">إنشاء حساب</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="navbar-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="القائمة">
          <span style={mobileOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
          <span style={mobileOpen ? { opacity: 0, transform: 'scaleX(0)' } : {}} />
          <span style={mobileOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <NavLink to="/" className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`} end onClick={() => setMobileOpen(false)}>🏠 الرئيسية</NavLink>
        <NavLink to="/rims" className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>🔧 المصفات</NavLink>
        <NavLink to="/shops" className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>🏪 المحلات</NavLink>
        {!user && (
          <>
            <div className="navbar-mobile-divider" />
            <div className="navbar-mobile-actions">
              <Link to="/login" className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>إنشاء حساب</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
