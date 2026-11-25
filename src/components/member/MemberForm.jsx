import { useState, useEffect } from 'react';
import { addMember, updateMember } from '../../firebase/members';
import useImageUpload from '../../hooks/useImageUpload';
import { X, Upload, Image, Pencil, Plus, User, Check } from 'lucide-react';

const ROLES = ['', 'Trưởng họ', 'Trưởng chi', 'Trưởng nhánh', 'Thành viên'];

const inp = {
  width:'100%', padding:'9px 12px', border:'1px solid var(--border)',
  borderRadius:'var(--radius-sm)', fontSize:14, background:'var(--bg-light)'
};

export default function MemberForm({ familyId, members, initialData, onClose, onSaved }) {
  const isEdit = !!initialData;
  const { preview, base64, sizeKB, compressing, error: imgError, handleFile, reset: resetImg } = useImageUpload('avatar');

  const [form, setForm] = useState({
    fullName: '', birthName: '', gender: 'male',
    birthDate: '', birthDateLunar: '', deathDate: '',
    generation: 1, role: '', hometown: '', bio: '',
    parentIds: [], spouseIds: [], childIds: [],
    photo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName || '',
        birthName: initialData.birthName || '',
        gender: initialData.gender || 'male',
        birthDate: initialData.birthDate || '',
        birthDateLunar: initialData.birthDateLunar || '',
        deathDate: initialData.deathDate || '',
        generation: initialData.generation || 1,
        role: initialData.role || '',
        hometown: initialData.hometown || '',
        bio: initialData.bio || '',
        parentIds: initialData.parentIds || [],
        spouseIds: initialData.spouseIds || [],
        childIds: initialData.childIds || [],
        photo: initialData.photo || '',
      });
    }
  }, [initialData]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleMultiSelect = (key, id, checked) => {
    setForm((f) => ({
      ...f,
      [key]: checked ? [...f[key], id] : f[key].filter((x) => x !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ tên'); return; }
    setSaving(true);
    setError('');
    try {
      const data = { ...form, photo: base64 || form.photo };
      if (isEdit) {
        await updateMember(familyId, initialData.id, data);
      } else {
        await addMember(familyId, data);
      }
      onSaved?.();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const Label = ({ children }) => (
    <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 }}>
      {children}
    </label>
  );

  const Section = ({ title }) => (
    <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', borderBottom:'1px solid var(--border)', paddingBottom:6, marginBottom:14, marginTop:4 }}>
      {title}
    </div>
  );

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:16
    }}>
      <div style={{
        background:'white', borderRadius:'var(--radius-lg)',
        width:'100%', maxWidth:600, maxHeight:'90vh',
        display:'flex', flexDirection:'column', boxShadow:'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 24px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between'
        }}>
          <h2 style={{ fontWeight:700, fontSize:17, color:'var(--primary)', display:'flex', alignItems:'center', gap:8 }}>
            {isEdit ? <Pencil size={18} /> : <Plus size={18} />}
            {isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h2>
          <button onClick={onClose} style={{ color:'var(--text-muted)', padding:4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY:'auto', flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Avatar */}
          <Section title="Ảnh đại diện" />
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%', border:'2px dashed var(--border)',
              overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
              background:'var(--bg-light)', fontSize:28, flexShrink:0
            }}>
              {(preview || form.photo)
                ? <img src={preview || form.photo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <User size={32} style={{ color: 'var(--primary)' }} />
              }
            </div>
            <div>
              <label style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'7px 14px', border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontWeight:500
              }}>
                <Upload size={14} />
                {compressing ? 'Đang nén...' : 'Chọn ảnh'}
                <input type="file" accept="image/*" style={{ display:'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              {sizeKB && <div style={{ fontSize:12, color:'var(--success)', marginTop:4, display:'inline-flex', alignItems:'center', gap:4 }}><Check size={14} /> Đã nén: {sizeKB} KB</div>}
              {imgError && <div style={{ fontSize:12, color:'var(--accent)', marginTop:4 }}>{imgError}</div>}
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <Section title="Thông tin cơ bản" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Họ và tên *</Label>
              <input style={inp} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
            </div>
            <div>
              <Label>Tên khai sinh</Label>
              <input style={inp} value={form.birthName} onChange={(e) => set('birthName', e.target.value)} />
            </div>
            <div>
              <Label>Giới tính</Label>
              <select style={inp} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div>
              <Label>Vai trò</Label>
              <select style={inp} value={form.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r || '-- Thành viên thường --'}</option>)}
              </select>
            </div>
            <div>
              <Label>Đời thứ</Label>
              <input style={inp} type="number" min="1" value={form.generation}
                onChange={(e) => set('generation', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Quê quán</Label>
              <input style={inp} value={form.hometown} onChange={(e) => set('hometown', e.target.value)} />
            </div>
          </div>

          {/* Ngày tháng */}
          <Section title="Ngày tháng" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Ngày sinh (Dương lịch)</Label>
              <input style={inp} type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
            <div>
              <Label>Ngày sinh (Âm lịch)</Label>
              <input style={inp} placeholder="vd: 15/08/1960" value={form.birthDateLunar}
                onChange={(e) => set('birthDateLunar', e.target.value)} />
            </div>
            <div>
              <Label>Ngày mất (nếu đã khuất)</Label>
              <input style={inp} type="date" value={form.deathDate} onChange={(e) => set('deathDate', e.target.value)} />
            </div>
          </div>

          {/* Quan hệ */}
          <Section title="Quan hệ gia đình" />
          <RelationPicker label="Cha / Mẹ" value={form.parentIds} members={members} exclude={initialData?.id}
            onChange={(id, checked) => handleMultiSelect('parentIds', id, checked)} />
          <RelationPicker label="Vợ / Chồng" value={form.spouseIds} members={members} exclude={initialData?.id}
            onChange={(id, checked) => handleMultiSelect('spouseIds', id, checked)} />
          <RelationPicker label="Con cái" value={form.childIds} members={members} exclude={initialData?.id}
            onChange={(id, checked) => handleMultiSelect('childIds', id, checked)} />

          {/* Tiểu sử */}
          <Section title="Tiểu sử" />
          <textarea
            style={{ ...inp, minHeight:80, resize:'vertical' }}
            placeholder="Nhập tiểu sử, công trạng, cuộc đời..."
            value={form.bio} onChange={(e) => set('bio', e.target.value)}
          />

          {error && <p style={{ color:'var(--accent)', fontSize:13 }}>{error}</p>}
        </form>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:14 }}>Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding:'9px 24px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:600 }}
          >
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm thành viên'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RelationPicker({ label, value, members, exclude, onChange }) {
  const [open, setOpen] = useState(false);
  const opts = members.filter((m) => m.id !== exclude);
  const selected = opts.filter((m) => value.includes(m.id));

  return (
    <div style={{ marginBottom:4 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 }}>
        {label}
      </label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inp, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
          userSelect:'none', minHeight:40
        }}
      >
        <span style={{ fontSize:14, color: selected.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selected.length ? selected.map((m) => m.fullName).join(', ') : `Chọn ${label.toLowerCase()}...`}
        </span>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>▾</span>
      </div>
      {open && (
        <div style={{
          border:'1px solid var(--border)', borderTop:'none',
          borderRadius:'0 0 var(--radius-sm) var(--radius-sm)',
          maxHeight:180, overflowY:'auto', background:'white', zIndex:10, position:'relative'
        }}>
          {opts.map((m) => (
            <label key={m.id} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 12px', cursor:'pointer', fontSize:14,
              borderBottom:'1px solid var(--border-light)'
            }}>
              <input type="checkbox" checked={value.includes(m.id)}
                onChange={(e) => onChange(m.id, e.target.checked)} />
              {m.fullName} (Đời {m.generation})
            </label>
          ))}
          {opts.length === 0 && <div style={{ padding:'10px 12px', fontSize:13, color:'var(--text-muted)' }}>Chưa có thành viên nào</div>}
        </div>
      )}
    </div>
  );
}
