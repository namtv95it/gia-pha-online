import { useState } from 'react';
import { Plus, CalendarDays, Trash2, Pencil, Flame, Users, Award, Pin, Bell, History, Repeat, X } from 'lucide-react';
import useFamilyStore from '../../store/familyStore';
import useFamily from '../../hooks/useFamily';
import { useParams } from 'react-router-dom';
import { addEvent, updateEvent, deleteEvent } from '../../firebase/events';
import { logActivity } from '../../firebase/activities';
import useAuthStore from '../../store/authStore';
import { formatLunarDate } from '../../utils/lunarCalendar';

const EVENT_TYPES = {
  anniversary: { label: 'Ngày giỗ', color: '#8B4513', icon: Flame },
  meeting:     { label: 'Họp họ',  color: '#5A7A5A', icon: Users },
  ceremony:    { label: 'Lễ tế',   color: '#C0392B', icon: Award },
  other:       { label: 'Khác',    color: '#9E8070', icon: Pin },
};

const inp = {
  width:'100%', padding:'9px 12px', border:'1px solid var(--border)',
  borderRadius:'var(--radius-sm)', fontSize:14, background:'var(--bg-light)'
};

export default function Events() {
  const { slug } = useParams();
  const { events, reload, userIsManager } = useFamily(slug);
  const { currentFamily } = useFamilyStore();
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', date:'', type:'anniversary', recurring:false });
  const [saving, setSaving] = useState(false);

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  const openForm = (event = null) => {
    setEditEvent(event);
    setForm(event
      ? { title:event.title||'', description:event.description||'', date:event.date||'', type:event.type||'anniversary', recurring:!!event.recurring }
      : { title:'', description:'', date:'', type:'anniversary', recurring:false }
    );
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setSaving(true);
    // Tính âm lịch từ ngày dương
    let dateLunar = '';
    try {
      const d = new Date(form.date);
      dateLunar = formatLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
    } catch {}
    const data = { ...form, dateLunar };
    if (editEvent) await updateEvent(currentFamily.id, editEvent.id, data);
    else await addEvent(currentFamily.id, data);
    await logActivity(currentFamily.id, {
      type: editEvent ? 'event_edit' : 'event_add',
      title: editEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện',
      description: `${editEvent ? 'Đã cập nhật' : 'Đã tạo'} sự kiện "${form.title}"`,
      actorName: useAuthStore.getState().user?.displayName || 'Quản trị viên',
    });
    setSaving(false);
    setShowForm(false);
    reload();
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa sự kiện này?')) return;
    await deleteEvent(currentFamily.id, id);
    reload();
  };

  return (
    <div style={{ padding:28, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CalendarDays size={26} style={{ color: 'var(--primary)' }} />
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, color:'var(--primary)' }}>Sự kiện & Giỗ chạp</h1>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:2 }}>Lịch các sự kiện quan trọng của dòng họ</p>
          </div>
        </div>
        {userIsManager && (
          <button onClick={() => openForm()}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-sm)', fontWeight:600, fontSize:14 }}>
            <Plus size={16} /> Thêm sự kiện
          </button>
        )}
      </div>

      {/* Upcoming */}
      <Section title="Sắp tới" icon={Bell} events={upcoming} onEdit={openForm} onDelete={handleDelete} canEdit={userIsManager} />
      <Section title="Đã qua" icon={History} events={past} onEdit={openForm} onDelete={handleDelete} canEdit={userIsManager} />

      {events.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', background:'white', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
          <p>Chưa có sự kiện nào</p>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:16 }}>
          <div style={{ background:'white',borderRadius:'var(--radius-lg)',width:'100%',maxWidth:480,boxShadow:'var(--shadow-lg)',overflow:'hidden' }}>
            <div style={{ padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h2 style={{ fontWeight:700,fontSize:17,color:'var(--primary)', display:'flex', alignItems:'center', gap:8 }}>
                {editEvent ? <Pencil size={18} /> : <Plus size={18} />}
                {editEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color:'var(--text-muted)', padding:4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding:'20px 24px',display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:5 }}>Tên sự kiện *</label>
                <input style={inp} value={form.title} onChange={(e) => setForm(f=>({...f,title:e.target.value}))} required />
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:5 }}>Loại sự kiện</label>
                <select style={inp} value={form.type} onChange={(e) => setForm(f=>({...f,type:e.target.value}))}>
                  {Object.entries(EVENT_TYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:5 }}>Ngày (Dương lịch) *</label>
                <input style={inp} type="date" value={form.date} onChange={(e) => setForm(f=>({...f,date:e.target.value}))} required />
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--text-secondary)',display:'block',marginBottom:5 }}>Mô tả</label>
                <textarea style={{...inp,minHeight:70,resize:'vertical'}} value={form.description} onChange={(e) => setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <label style={{ display:'flex',alignItems:'center',gap:8,fontSize:14,cursor:'pointer' }}>
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm(f=>({...f,recurring:e.target.checked}))} />
                Lặp hàng năm
              </label>
              <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding:'9px 20px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:14 }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ padding:'9px 24px',background:'var(--primary)',color:'white',borderRadius:'var(--radius-sm)',fontSize:14,fontWeight:600 }}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: TitleIcon, events, onEdit, onDelete, canEdit }) {
  if (!events.length) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{ fontSize:16,fontWeight:700,color:'var(--text-secondary)',marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
        <TitleIcon size={16} style={{ color: 'var(--primary)' }} />
        {title}
      </h2>
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {events.map((ev) => {
          const type = EVENT_TYPES[ev.type] || EVENT_TYPES.other;
          const TypeIcon = type.icon;
          return (
            <div key={ev.id} style={{
              background:'white',border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)',padding:'14px 18px',
              display:'flex',alignItems:'center',gap:16,
              borderLeft:`4px solid ${type.color}`
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${type.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TypeIcon size={22} style={{ color: type.color }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:15 }}>{ev.title}</div>
                <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:3 }}>
                  {ev.date && new Date(ev.date).toLocaleDateString('vi-VN',{year:'numeric',month:'long',day:'numeric'})}
                  {ev.dateLunar && ` · Âm lịch: ${ev.dateLunar}`}
                  {ev.recurring && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6 }}>
                      · <Repeat size={12} /> Hàng năm
                    </span>
                  )}
                </div>
                {ev.description && <div style={{ fontSize:13,color:'var(--text-secondary)',marginTop:4 }}>{ev.description}</div>}
              </div>
              {canEdit && (
                <div style={{ display:'flex',gap:6 }}>
                  <button onClick={() => onEdit(ev)} style={{ padding:'6px 10px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--primary)' }}><Pencil size={13} /></button>
                  <button onClick={() => onDelete(ev.id)} style={{ padding:'6px 10px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--accent)' }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
