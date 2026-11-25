import { useState } from 'react';
import useFamilyStore from '../../store/familyStore';
import useFamily from '../../hooks/useFamily';
import useAuthStore from '../../store/authStore';
import { useParams } from 'react-router-dom';
import MemberDetail from '../../components/member/MemberDetail';
import MemberForm from '../../components/member/MemberForm';
import { Search, Plus, User } from 'lucide-react';

export default function Members() {
  const { slug } = useParams();
  const { members, selectedMemberId, selectMember, userIsManager, reload } = useFamily(slug);
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const maxGen = members.length ? Math.max(...members.map((m) => m.generation || 1)) : 1;
  const gens = Array.from({ length: maxGen }, (_, i) => i + 1);

  const filtered = members.filter((m) => {
    const matchSearch = !search || m.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchGen = genFilter === 'all' || String(m.generation) === genFilter;
    return matchSearch && matchGen;
  });

  const { currentFamily } = useFamilyStore();

  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)', overflow:'hidden' }}>
      {/* Left: list */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding:'16px 20px', background:'white',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:12
        }}>
          <div style={{
            flex:1, display:'flex', alignItems:'center', gap:8,
            background:'var(--bg-light)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-sm)', padding:'8px 12px'
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thành viên..."
              style={{ border:'none', background:'none', fontSize:14, width:'100%' }}
            />
          </div>
          <select
            value={genFilter} onChange={(e) => setGenFilter(e.target.value)}
            style={{
              padding:'8px 12px', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', fontSize:14, background:'var(--bg-light)'
            }}
          >
            <option value="all">Tất cả đời</option>
            {gens.map((g) => <option key={g} value={g}>Đời {g}</option>)}
          </select>
          {userIsManager && (
            <button
              onClick={() => { setEditMember(null); setShowForm(true); }}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'8px 16px', background:'var(--primary)', color:'white',
                borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:600
              }}
            >
              <Plus size={15} /> Thêm thành viên
            </button>
          )}
        </div>

        {/* Summary */}
        <div style={{ padding:'10px 20px', background:'var(--bg-sidebar)', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)' }}>
          Cây gia phả dòng họ <strong>{currentFamily?.name}</strong> — Sơ đồ {maxGen} thế hệ · {members.length} thành viên
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Không tìm thấy thành viên nào</div>
          ) : filtered.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              selected={m.id === selectedMemberId}
              onClick={() => selectMember(m.id)}
              onEdit={() => { setEditMember(m); setShowForm(true); }}
              canEdit={userIsManager}
            />
          ))}
        </div>
      </div>

      {/* Right: detail */}
      {selectedMemberId && (
        <MemberDetail
          onEdit={(m) => { setEditMember(m); setShowForm(true); }}
          canEdit={userIsManager}
          onReload={reload}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <MemberForm
          familyId={currentFamily?.id}
          members={members}
          initialData={editMember}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}

function MemberCard({ member, selected, onClick, onEdit, canEdit }) {
  const isDeceased = !!(member.isDeceased || member.deathDate || member.deathDateLunar);
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'var(--bg-sidebar)' : 'white',
        border: `1px solid ${selected ? 'var(--secondary)' : 'var(--border)'}`,
        borderRadius:'var(--radius-md)', padding:'12px 16px',
        display:'flex', alignItems:'center', gap:14,
        cursor:'pointer', transition:'var(--transition)',
        boxShadow: selected ? 'var(--shadow-sm)' : 'none'
      }}
    >
      {/* Avatar */}
      <div style={{
        width:48, height:48, borderRadius:'50%', flexShrink:0, overflow:'hidden',
        background: isDeceased ? '#d9d0c4' : 'var(--bg-sidebar)',
        border:`2px solid ${isDeceased ? '#a09080' : 'var(--secondary)'}`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
      }}>
        {member.photo
          ? <img src={member.photo} alt={member.fullName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <User size={20} style={{ color: isDeceased ? '#a09080' : 'var(--primary)' }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{member.fullName}</span>
          {member.role && (
            <span style={{
              fontSize:11, padding:'1px 7px', borderRadius:999,
              background:'var(--primary)', color:'white', fontWeight:600
            }}>{member.role}</span>
          )}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
          {member.gender === 'female' ? 'Con gái' : 'Con trai'} · Đời {member.generation}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)' }}>
          {member.birthDate && `${member.birthDate}`}
          {member.deathDate && ` – ${member.deathDate}`}
          {isDeceased && member.birthDate && member.deathDate && (() => {
            const by = parseInt(member.birthDate); const dy = parseInt(member.deathDate);
            return !isNaN(by) && !isNaN(dy) ? ` · Thọ ${dy - by} tuổi` : '';
          })()}
        </div>
      </div>
    </div>
  );
}
