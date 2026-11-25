import { useState } from 'react';
import useFamilyStore from '../../store/familyStore';
import useFamily from '../../hooks/useFamily';
import { useParams } from 'react-router-dom';
import { updateFamily } from '../../firebase/families';
import { addManager, removeManager } from '../../firebase/families';
import { logActivity } from '../../firebase/activities';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import useAuthStore from '../../store/authStore';
import useImageUpload from '../../hooks/useImageUpload';
import { Shield, Trash2, Upload, Lock, Settings as SettingsIcon, Check } from 'lucide-react';

const inp = {
  width:'100%', padding:'9px 12px', border:'1px solid var(--border)',
  borderRadius:'var(--radius-sm)', fontSize:14, background:'var(--bg-light)'
};

export default function Settings() {
  const { slug } = useParams();
  const { managers, reload, userIsManager } = useFamily(slug);
  const { currentFamily } = useFamilyStore();
  const { user, isAdmin } = useAuthStore();
  const { preview, base64, compressing, sizeKB, handleFile } = useImageUpload('cover');

  const [name, setName] = useState(currentFamily?.name || '');
  const [desc, setDesc] = useState(currentFamily?.description || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerMsg, setManagerMsg] = useState('');

  if (!userIsManager && !isAdmin) {
    return (
      <div style={{ padding:40, textAlign:'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={36} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <p style={{ color:'var(--text-muted)' }}>Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    await updateFamily(currentFamily.id, {
      name, description: desc,
      ...(base64 ? { coverImage: base64 } : {})
    });
    await logActivity(currentFamily.id, {
      type: 'family_update',
      title: 'Cập nhật dòng họ',
      description: `Đã cập nhật thông tin gia phả ${name}`,
      actorName: user?.displayName || user?.email || 'Quản trị viên',
    });
    setSaving(false);
    setMsg('Đã lưu thành công!');
    reload();
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setManagerMsg('');
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', managerEmail.trim())));
      if (snap.empty) { setManagerMsg('Không tìm thấy email này'); return; }
      await addManager(currentFamily.id, snap.docs[0].id, user.uid);
      setManagerMsg('Đã thêm quản lý thành công!');
      setManagerEmail('');
      reload();
    } catch (e) { setManagerMsg('Lỗi: ' + e.message); }
  };

  const handleRemoveManager = async (uid) => {
    if (uid === currentFamily.ownerId) { alert('Không thể xóa chủ sở hữu gia phả'); return; }
    if (!confirm('Xóa quyền quản lý người này?')) return;
    await removeManager(currentFamily.id, uid);
    reload();
  };

  return (
    <div style={{ padding:32, maxWidth:700, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SettingsIcon size={24} style={{ color: 'var(--primary)' }} />
        <h1 style={{ fontSize:24, fontWeight:700, color:'var(--primary)' }}>Cài đặt gia phả</h1>
      </div>

      {/* Basic info */}
      <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:24 }}>
        <h3 style={{ fontWeight:700, marginBottom:16, fontSize:16 }}>Thông tin gia phả</h3>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Tên dòng họ</label>
            <input style={inp} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Mô tả</label>
            <textarea style={{...inp, minHeight:80, resize:'vertical'}} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Ảnh bìa</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {(preview || currentFamily?.coverImage) && (
                <img src={preview || currentFamily.coverImage} style={{ width:120, height:70, objectFit:'cover', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }} />
              )}
              <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer' }}>
                <Upload size={14} /> {compressing ? 'Đang nén...' : 'Chọn ảnh'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              {sizeKB && <span style={{ fontSize:12, color:'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Đã nén {sizeKB} KB</span>}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button type="submit" disabled={saving} style={{ padding:'9px 24px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:600 }}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            {msg && <span style={{ fontSize:13, color:'var(--success)' }}>{msg}</span>}
          </div>
        </form>
      </div>

      {/* Managers */}
      <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:24 }}>
        <h3 style={{ fontWeight:700, marginBottom:16, fontSize:16, display:'flex', alignItems:'center', gap:8 }}>
          <Shield size={18} color="var(--primary)" /> Quản lý gia phả
        </h3>
        <form onSubmit={handleAddManager} style={{ display:'flex', gap:10, marginBottom:16 }}>
          <input style={{...inp, flex:1}} type="email" placeholder="Email người cần thêm quyền" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} required />
          <button type="submit" style={{ padding:'9px 20px', background:'var(--success)', color:'white', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>
            Thêm
          </button>
        </form>
        {managerMsg && <p style={{ fontSize:13, color: managerMsg.includes('thành') ? 'var(--success)' : 'var(--accent)', marginBottom:12 }}>{managerMsg}</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {managers.map((m) => (
            <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-light)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{m.displayName || m.id}</div>
                {m.email && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.email}</div>}
                {m.id === currentFamily.ownerId && <span style={{ fontSize:11, color:'var(--secondary)', fontWeight:600 }}>Chủ sở hữu</span>}
              </div>
              {m.id !== currentFamily.ownerId && (
                <button onClick={() => handleRemoveManager(m.id)} style={{ color:'var(--accent)', padding:'5px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
