import { useState, useEffect } from 'react'
import api from '../utils/api'
import { BookingStatusBadge, LoadingScreen, EmptyState, Modal } from '../components/shared'
import toast from 'react-hot-toast'

const TABS = ['نظرة عامة', 'مصفاتي', 'الحجوزات', 'إعدادات المحل']
const SIZES = ['14"', '15"', '16"', '17"', '18"', '19"', '20"', '21"', '22"']

const emptyRimForm = { name: '', size: '', price_per_day: '', has_cameras: false, has_security: false, has_delivery: false, has_insurance: false, quantity: 1, description: '' }

export default function ShopDashboard() {
  const [tab, setTab] = useState(0)
  const [shop, setShop] = useState(null)
  const [noShop, setNoShop] = useState(false)
  const [rims, setRims] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [rimModal, setRimModal] = useState(false)
  const [editingRim, setEditingRim] = useState(null)
  const [rimForm, setRimForm] = useState(emptyRimForm)
  const [shopForm, setShopForm] = useState({ name: '', description: '', address: '', city: '', phone: '' })
  const [createForm, setCreateForm] = useState({ name: '', description: '', address: '', city: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [bookingTab, setBookingTab] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const shopRes = await api.get('/shops/my')
      const s = shopRes.data.data
      setShop(s)
      setNoShop(false)
      setShopForm({ name: s.name || '', description: s.description || '', address: s.address || '', city: s.city || '', phone: s.phone || '' })
      const [rimsRes, bookRes] = await Promise.all([
        api.get('/rims/my-shop'),
        api.get('/bookings/shop'),
      ])
      setRims(rimsRes.data.data || [])
      setBookings(bookRes.data.data || [])
    } catch (err) {
      if (err.response?.status === 404) {
        setNoShop(true)
        setShop(null)
      } else {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleCreateShop = async e => {
    e.preventDefault()
    if (!createForm.name) { toast.error('اسم المحل مطلوب'); return }
    setCreating(true)
    try {
      const fd = new FormData()
      Object.entries(createForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
      await api.post('/shops', fd)
      toast.success('تم إنشاء المحل بنجاح! في انتظار موافقة الإدارة')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء إنشاء المحل')
    } finally {
      setCreating(false)
    }
  }

  const openAdd = () => { setEditingRim(null); setRimForm(emptyRimForm); setRimModal(true) }
  const openEdit = rim => {
    setEditingRim(rim)
    setRimForm({ name: rim.name, size: rim.size || '', price_per_day: rim.price_per_day, has_cameras: !!rim.has_cameras, has_security: !!rim.has_security, has_delivery: !!rim.has_delivery, has_insurance: !!rim.has_insurance, quantity: rim.quantity || 1, description: rim.description || '' })
    setRimModal(true)
  }

  const saveRim = async () => {
    if (!rimForm.name || !rimForm.price_per_day) { toast.error('الاسم والسعر اليومي مطلوبان'); return }
    setSaving(true)
    try {
      if (editingRim) {
        await api.put(`/rims/${editingRim.id}`, rimForm)
        toast.success('تم تحديث المصفة')
      } else {
        await api.post('/rims', { ...rimForm, shop_id: shop.id })
        toast.success('تم إضافة المصفة')
      }
      setRimModal(false)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const deleteRim = async id => {
    if (!window.confirm('هل تريد حذف هذه المصفة نهائياً؟')) return
    try {
      await api.delete(`/rims/${id}`)
      toast.success('تم حذف المصفة')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  }

  const toggleAvail = async rim => {
    try {
      await api.put(`/rims/${rim.id}`, { is_available: rim.is_available ? 0 : 1 })
      toast.success(rim.is_available ? 'تم إخفاء المصفة' : 'تم إظهار المصفة')
      loadAll()
    } catch {}
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status })
      toast.success('تم تحديث حالة الحجز')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  }

  const saveShop = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(shopForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
      await api.put('/shops', fd)
      toast.success('تم تحديث إعدادات المحل')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen />

  // ── No shop yet: show creation form ──
  if (noShop) return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>🏪 إنشاء محلك</h1>
          <p style={{ opacity: 0.85 }}>أنشئ ملف محلك لتبدأ بتأجير المصفات</p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60, maxWidth: 580 }}>
        <div className="card" style={{ padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56 }}>🏪</div>
            <h2 style={{ fontWeight: 900, marginTop: 12, marginBottom: 8 }}>أنشئ محلك الآن</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              بعد الإنشاء ستنتظر موافقة الإدارة، ثم يمكنك إضافة مصفاتك وبدء التأجير
            </p>
          </div>
          <form onSubmit={handleCreateShop}>
            <div className="form-group">
              <label className="form-label">اسم المحل *</label>
              <input className="form-control" placeholder="مثال: محل أبو أحمد للمصفات" value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">المدينة</label>
              <input className="form-control" placeholder="عمان، إربد، الزرقاء..." value={createForm.city}
                onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">العنوان التفصيلي</label>
              <input className="form-control" placeholder="الشارع والحي..." value={createForm.address}
                onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input className="form-control" placeholder="07xxxxxxxx" value={createForm.phone}
                onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">وصف المحل</label>
              <textarea className="form-control" placeholder="اكتب وصفاً مختصراً عن محلك وتخصصك..." value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }} disabled={creating}>
              {creating ? 'جاري الإنشاء...' : '🏪 إنشاء المحل'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const revenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + Number(b.total_amount || 0), 0)
  const filteredBookings = bookingTab ? bookings.filter(b => b.status === bookingTab) : bookings

  return (
    <div>
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>🏪 لوحة المحل</h1>
            <p style={{ opacity: 0.85 }}>
              {shop?.name || '—'} ·{' '}
              {shop?.is_approved
                ? <span style={{ color: '#6ee7b7' }}>✅ معتمد</span>
                : <span style={{ color: '#fcd34d' }}>⏳ ينتظر الموافقة</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="tabs" style={{ overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 0 && (
          <div>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              {[
                { label: 'المصفات', value: rims.length, icon: '🔧', color: 'var(--primary)' },
                { label: 'الحجوزات', value: bookings.length, icon: '📋', color: '#1e40af' },
                { label: 'الإيرادات', value: `${revenue.toFixed(0)} د.أ`, icon: '💰', color: '#065f46' },
                { label: 'التقييم', value: shop?.rating ? Number(shop.rating).toFixed(1) : '—', icon: '⭐', color: '#92400e' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>آخر الحجوزات</h3>
              {bookings.length === 0
                ? <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>لا توجد حجوزات بعد</p>
                : bookings.slice(0, 6).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>{b.rim_name}</span>
                      <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>— {b.user_name}</span>
                      <span style={{ color: 'var(--text-muted)' }}> · {b.total_days} يوم · {b.total_amount} د.أ</span>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── My Rims ── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800 }}>مصفاتي <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({rims.length})</span></h2>
              <button className="btn btn-primary" onClick={openAdd}>+ إضافة مصفة</button>
            </div>
            {rims.length === 0 ? <EmptyState icon="🔧" title="لا توجد مصفات" message="أضف مصفتك الأولى لتبدأ بالتأجير" action={<button className="btn btn-primary" onClick={openAdd}>إضافة مصفة</button>} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rims.map(rim => (
                  <div key={rim.id} className="card rim-row" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {rim.primary_image
                        ? <img src={rim.primary_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                        : <span style={{ fontSize: 32 }}>🔧</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{rim.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                        {[rim.size, rim.quantity > 1 ? `${rim.quantity} قطع` : null].filter(Boolean).join(' · ')}
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>{rim.price_per_day} د.أ / يوم</div>
                    </div>
                    <div className="rim-row-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => toggleAvail(rim)} className="btn btn-sm"
                        style={{ background: rim.is_available ? '#d1fae5' : '#f3f4f6', color: rim.is_available ? '#065f46' : 'var(--text-muted)' }}>
                        {rim.is_available ? '✅ متاح' : '🚫 مخفي'}
                      </button>
                      <button onClick={() => openEdit(rim)} className="btn btn-sm btn-outline">تعديل</button>
                      <button onClick={() => deleteRim(rim.id)} className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings ── */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontWeight: 800 }}>الحجوزات الواردة <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({bookings.length})</span></h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['', 'الكل'], ['pending', 'انتظار'], ['confirmed', 'مؤكد'], ['active', 'نشط'], ['completed', 'مكتمل']].map(([k, l]) => (
                  <button key={k} onClick={() => setBookingTab(k)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${bookingTab === k ? 'var(--accent)' : 'var(--border)'}`, background: bookingTab === k ? 'var(--accent)' : 'white', color: bookingTab === k ? 'white' : 'var(--text)', fontFamily: 'Cairo', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {filteredBookings.length === 0 ? <EmptyState icon="📋" title="لا توجد حجوزات" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredBookings.map(b => (
                  <div key={b.id} className="card" style={{ padding: 20 }}>
                    <div className="booking-detail-row" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontWeight: 800, marginBottom: 4 }}>{b.rim_name}</h3>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {b.user_name}{b.user_phone ? ` · 📞 ${b.user_phone}` : b.user_email ? ` · ${b.user_email}` : ''}
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          📅 {b.start_date?.slice(0, 10)} → {b.end_date?.slice(0, 10)} ({b.total_days} يوم)
                        </div>
                        <div style={{ fontWeight: 900, color: 'var(--accent)', marginTop: 4 }}>{b.total_amount} د.أ</div>
                        {b.delivery_required ? <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>🚗 يحتاج توصيل</div> : null}
                        {b.notes ? <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>ملاحظة: {b.notes}</div> : null}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <BookingStatusBadge status={b.status} />
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {b.status === 'pending' && (<>
                            <button onClick={() => updateStatus(b.id, 'confirmed')} className="btn btn-sm" style={{ background: '#d1fae5', color: '#065f46' }}>✅ تأكيد</button>
                            <button onClick={() => updateStatus(b.id, 'rejected')} className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>❌ رفض</button>
                          </>)}
                          {b.status === 'confirmed' && (
                            <button onClick={() => updateStatus(b.id, 'active')} className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af' }}>▶ تفعيل</button>
                          )}
                          {b.status === 'active' && (
                            <button onClick={() => updateStatus(b.id, 'completed')} className="btn btn-sm" style={{ background: '#e0e7ff', color: '#3730a3' }}>🏁 إتمام</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Shop Settings ── */}
        {tab === 3 && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontWeight: 800, marginBottom: 20 }}>إعدادات المحل</h2>
            <div className="card" style={{ padding: 28 }}>
              <form onSubmit={saveShop}>
                {[
                  { name: 'name', label: 'اسم المحل', required: true },
                  { name: 'city', label: 'المدينة' },
                  { name: 'address', label: 'العنوان التفصيلي' },
                  { name: 'phone', label: 'رقم الهاتف' },
                ].map(({ name, label, required }) => (
                  <div key={name} className="form-group">
                    <label className="form-label">{label}{required && ' *'}</label>
                    <input className="form-control" value={shopForm[name]}
                      onChange={e => setShopForm(f => ({ ...f, [name]: e.target.value }))}
                      required={required} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">وصف المحل</label>
                  <textarea className="form-control" value={shopForm.description}
                    onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Rim Modal ── */}
      <Modal open={rimModal} onClose={() => setRimModal(false)} title={editingRim ? 'تعديل المصفة' : 'إضافة مصفة جديدة'}>
        <div className="grid-2" style={{ gap: 12 }}>
          {/* Required fields */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">اسم المصفة *</label>
            <input className="form-control" value={rimForm.name} onChange={e => setRimForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: جنطة رياضية 18 بوصة" required />
          </div>
          <div className="form-group">
            <label className="form-label">الحجم *</label>
            <select className="form-control" value={rimForm.size} onChange={e => setRimForm(f => ({ ...f, size: e.target.value }))} required>
              <option value="">اختر الحجم</option>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">السعر اليومي (د.أ) *</label>
            <input type="number" min="0" step="0.5" className="form-control" value={rimForm.price_per_day} onChange={e => setRimForm(f => ({ ...f, price_per_day: e.target.value }))} required />
          </div>

          {/* Security & Service toggles */}
          <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
            <label className="form-label" style={{ marginBottom: 10, display: 'block', fontWeight: 700 }}>الأمان والخدمات</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'has_cameras', label: 'المكان مؤمن بكاميرات' },
                { key: 'has_security', label: 'يوجد حارس أمن' },
                { key: 'has_delivery', label: 'توصيل وإرجاع' },
                { key: 'has_insurance', label: 'تأمين على المصفات' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${rimForm[key] ? 'var(--accent)' : 'var(--border)'}`, background: rimForm[key] ? 'rgba(var(--accent-rgb, 0,120,200),0.06)' : 'var(--bg)', transition: 'all 0.15s', userSelect: 'none', fontSize: 14, fontWeight: 600 }}>
                  <div style={{ position: 'relative', width: 36, height: 20, flexShrink: 0 }}>
                    <input type="checkbox" checked={rimForm[key]} onChange={e => setRimForm(f => ({ ...f, [key]: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: rimForm[key] ? 'var(--accent)' : '#d1d5db', transition: 'background 0.2s' }} />
                    <div style={{ position: 'absolute', top: 2, left: rimForm[key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div className="form-group">
            <label className="form-label">الكمية</label>
            <input type="number" min="1" className="form-control" value={rimForm.quantity} onChange={e => setRimForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">صور</label>
            <input type="file" accept="image/*" multiple className="form-control" onChange={e => setRimForm(f => ({ ...f, images: e.target.files }))} style={{ padding: '7px 12px' }} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">وصف</label>
            <textarea className="form-control" value={rimForm.description} onChange={e => setRimForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر عن المصفة..." />
          </div>
        </div>
        <button onClick={saveRim} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
          {saving ? 'جاري الحفظ...' : editingRim ? 'حفظ التعديلات' : 'إضافة المصفة'}
        </button>
      </Modal>
    </div>
  )
}
