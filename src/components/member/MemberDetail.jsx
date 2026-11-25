import useFamilyStore from '../../store/familyStore';
import { deleteMember } from '../../firebase/members';
import { X, Pencil, Trash2, MapPin, Calendar, Users, User, BookOpen } from 'lucide-react';

export default function MemberDetail({ onEdit, canEdit, onReload }) {
  const { currentFamily, getSelectedMember, members, setSelectedMemberId } = useFamilyStore();
  const member = getSelectedMember();

  if (!member) return null;

  const findById = (id) => members.find((m) => m.id === id);
  const parents = (member.parentIds || []).map(findById).filter(Boolean);
  const spouses = (member.spouseIds || []).map(findById).filter(Boolean);
  const children = (member.childIds || []).map(findById).filter(Boolean);
  const isDeceased = !!member.deathDate;

  const handleDelete = async () => {
    if (!confirm(`Xóa thành viên "${member.fullName}"?`)) return;
    await deleteMember(currentFamily.id, member.id);
    setSelectedMemberId(null);
    onReload?.();
  };

  const Row = ({ label, value, icon: Icon }) => value ? (
    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
      {Icon && <Icon size={15} color="var(--text-muted)" style={{ flexShrink:0, marginTop:2 }} />}
      <div>
        <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>
        <div style={{ fontSize:14, color:'var(--text-primary)', fontWeight:500 }}>{value}</div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{
      width:320, flexShrink:0, borderLeft:'1px solid var(--border)',
      background:'var(--bg-light)', display:'flex', flexDirection:'column',
      overflowY:'auto', maxHeight:'calc(100vh - 56px)'
    }}>
      {/* Header */}
      <div style={{
        background: isDeceased ? 'linear-gradient(135deg, #6b6055, #4a3f38)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        padding:'24px 20px', color:'white', position:'relative'
      }}>
        <button
          onClick={() => setSelectedMemberId(null)}
          style={{ position:'absolute', top:12, right:12, color:'rgba(255,255,255,.7)', padding:4 }}
        >
          <X size={18} />
        </button>
        <div style={{
          width:72, height:72, borderRadius:'50%', margin:'0 auto 12px',
          border:'3px solid rgba(255,255,255,.4)', overflow:'hidden',
          background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30
        }}>
          {member.photo
            ? <img src={member.photo} alt={member.fullName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <User size={28} style={{ color: 'rgba(255,255,255,0.8)' }} />
          }
        </div>
        <div style={{ textAlign:'center' }}>
          <h3 style={{ fontWeight:700, fontSize:17, lineHeight:1.3 }}>{member.fullName}</h3>
          {member.role && (
            <span style={{
              display:'inline-block', marginTop:6, fontSize:12, fontWeight:600,
              padding:'2px 10px', borderRadius:999,
              background: member.role === 'Trưởng họ' ? '#C8A96E' : 'rgba(255,255,255,.25)',
              color: member.role === 'Trưởng họ' ? '#2C1810' : 'white'
            }}>{member.role}</span>
          )}
          <div style={{ fontSize:13, marginTop:6, opacity:.8 }}>
            {member.birthDate} {member.deathDate ? `– ${member.deathDate}` : ''}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div style={{ display:'flex', gap:8, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <button
            onClick={() => onEdit(member)}
            style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              padding:'7px 0', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
              fontSize:13, fontWeight:500, color:'var(--primary)'
            }}
          >
            <Pencil size={13} /> Chỉnh sửa
          </button>
          <button
            onClick={handleDelete}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'7px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
              color:'var(--accent)'
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Detail */}
      <div style={{ padding:'16px 20px', flex:1 }}>
        <Row label="Ngày sinh" value={member.birthDate} icon={Calendar} />
        <Row label="Ngày mất" value={member.deathDate} icon={Calendar} />
        <Row label="Vợ / Chồng" value={spouses.map((s) => s.fullName).join(', ')} icon={Users} />
        <Row label="Quê quán" value={member.hometown} icon={MapPin} />
        <Row label="Số con" value={children.length ? `${children.length} người (${children.filter(c=>c.gender!=='female').length} trai, ${children.filter(c=>c.gender==='female').length} gái)` : null} icon={Users} />

        {/* Tiểu sử */}
        {member.bio && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <BookOpen size={14} /> Tiểu sử
            </div>
            <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>{member.bio}</p>
          </div>
        )}

        {/* Cha mẹ */}
        {parents.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Cha / Mẹ</div>
            {parents.map((p) => (
              <div key={p.id} style={{ fontSize:13, color:'var(--primary)', fontWeight:500, marginBottom:4 }}>• {p.fullName}</div>
            ))}
          </div>
        )}

        {/* Con cái */}
        {children.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Con cái ({children.length})</div>
            {children.map((c) => (
              <div key={c.id} style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>• {c.fullName} ({c.gender === 'female' ? 'Con gái' : 'Con trai'})</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
