import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  Home, TreePine, Users, CalendarDays,
  BookOpen, Settings, Search, Bell, ChevronDown, LogOut, User
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '../../firebase/auth';
import useAuthStore from '../../store/authStore';
import useFamilyStore from '../../store/familyStore';
import '../../styles/navbar.css';

const NAV_ITEMS = [
  { to: 'tong-quan',   label: 'Tổng quan',   icon: Home },
  { to: 'cay-gia-pha', label: 'Cây gia phả', icon: TreePine },
  { to: 'thanh-vien',  label: 'Thành viên',  icon: Users },
  { to: 'su-kien',     label: 'Sự kiện',     icon: CalendarDays },
  { to: 'tu-lieu',     label: 'Tư liệu',     icon: BookOpen },
  { to: 'cai-dat',     label: 'Cài đặt',     icon: Settings },
];

export default function Navbar() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, userDoc } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.displayName || userDoc?.displayName || 'Người dùng';
  const photoURL = user?.photoURL;

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,69,19,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TreePine size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        </div>
        <span>{currentFamily?.name ? `Gia Phả Họ ${currentFamily.name}` : 'Gia Phả Dòng Họ'}</span>
      </div>

      {/* Nav links */}
      {slug && (
        <div className="navbar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={`/${slug}/${to}`}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="navbar-search">
        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm thành viên, sự kiện, tư liệu..."
        />
      </div>

      {/* Bell */}
      <button style={{ position: 'relative', color: 'var(--text-secondary)', padding: '8px', marginLeft: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={18} />
        <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
      </button>

      {/* User menu */}
      {user ? (
        <div style={{ position: 'relative' }}>
          <div className="navbar-user" onClick={() => setUserMenuOpen((o) => !o)}>
            {photoURL
              ? <img src={photoURL} alt="" className="navbar-user-avatar" />
              : <div className="navbar-user-avatar" style={{ display:'flex',alignItems:'center',justifyContent:'center' }}><User size={16} /></div>
            }
            <span>{displayName}</span>
            <ChevronDown size={14} />
          </div>
          {userMenuOpen && (
            <div style={{
              position:'absolute',right:0,top:'calc(100% + 4px)',
              background:'white',border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',
              minWidth:180,overflow:'hidden',zIndex:200
            }}>
              {userDoc?.role === 'admin' && (
                <button
                  onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                  style={{ width:'100%',padding:'10px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:8,fontSize:14 }}
                >
                  <Settings size={15} /> Quản trị hệ thống
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{ width:'100%',padding:'10px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:8,fontSize:14,color:'var(--accent)' }}
              >
                <LogOut size={15} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      ) : (
        <NavLink
          to="/login"
          style={{
            marginLeft:12, padding:'6px 16px',
            background:'var(--primary)', color:'white',
            borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600
          }}
        >
          Đăng nhập
        </NavLink>
      )}
    </nav>
  );
}
