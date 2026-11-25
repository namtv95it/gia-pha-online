import useFamilyStore from '../../store/familyStore';
import { TreePine, Users, CalendarDays, BookOpen, TrendingUp, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Overview() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentFamily, members, events } = useFamilyStore();

  if (!currentFamily) return <div className="page-loader"><div className="spinner" /></div>;

  const totalMembers = members.length;
  const generations = members.length ? Math.max(...members.map((m) => m.generation || 1)) : 0;
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length;

  const stats = [
    { label: 'Tổng thành viên', value: totalMembers, icon: Users, color: '#8B4513', trend: null },
    { label: 'Số thế hệ', value: generations, icon: TrendingUp, color: '#5A7A5A', sub: 'Từ cụ tổ đến hiện tại' },
    { label: 'Tư liệu lưu trữ', value: 0, icon: BookOpen, color: '#C8A96E', sub: 'Gia phả, ảnh, văn bản...' },
    { label: 'Sự kiện sắp tới', value: upcomingEvents, icon: CalendarDays, color: '#C0392B', sub: 'Lễ giỗ, họp họ...' },
  ];

  const quickActions = [
    { label: 'Cây Gia Phả', desc: 'Khám phá phả hệ trực quan', icon: TreePine, path: `/${slug}/cay-gia-pha`, color: 'var(--primary)' },
    { label: 'Danh sách thành viên', desc: `${totalMembers} thành viên trong dòng họ`, icon: Users, path: `/${slug}/thanh-vien`, color: 'var(--success)' },
    { label: 'Sự kiện & Giỗ chạp', desc: `${upcomingEvents} sự kiện sắp tới`, icon: CalendarDays, path: `/${slug}/su-kien`, color: 'var(--accent)' },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(139,69,19,0.1)' }}>
          <Home size={22} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>
            Dòng họ {currentFamily.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
            {currentFamily.description || 'Lưu giữ cội nguồn — Kết nối con cháu — Gìn giữ truyền thống dòng họ'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(({ label, value, icon: Icon, color, sub, trend }) => (
          <div key={label} style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div className="flex items-start justify-between mb-3">
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {quickActions.map(({ label, desc, icon: Icon, path, color }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            className="rounded-xl p-6 cursor-pointer transition-all"
            style={{ background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${color}15` }}>
              <Icon size={24} style={{ color }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
