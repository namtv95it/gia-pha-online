import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import useAuth from './hooks/useAuth';
import useAuthStore from './store/authStore';
import { TreePine, ChevronDown, Settings as SettingsIcon, LogOut, User } from 'lucide-react';
import { logout, isSuperAdminEmail } from './firebase/auth';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/admin/Admin';
import FamilyLayout from './pages/family/FamilyLayout';
import Overview from './pages/family/Overview';
import FamilyTree from './pages/family/FamilyTree';
import Members from './pages/family/Members';
import Events from './pages/family/Events';
import Documents from './pages/family/Documents';
import Settings from './pages/family/Settings';

// Styles
import './index.css';

export default function App() {
  const { loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="page-loader">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'rgba(139,69,19,0.1)' }}>
            <TreePine size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<HomeWithNav />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />

        {/* Family routes — truy cập qua slug */}
        <Route path="/:slug" element={<FamilyLayout />}>
          <Route index element={<Navigate to="tong-quan" replace />} />
          <Route path="tong-quan"   element={<Overview />} />
          <Route path="cay-gia-pha" element={<FamilyTree />} />
          <Route path="thanh-vien"  element={<Members />} />
          <Route path="su-kien"     element={<Events />} />
          <Route path="tu-lieu"     element={<Documents />} />
          <Route path="cai-dat"     element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function HomeWithNav() {
  const { user, userDoc } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = user?.displayName || userDoc?.displayName || user?.email?.split('@')[0] || 'Tài khoản';
  const photoURL = user?.photoURL;
  const isAdmin = userDoc?.role === 'admin' || isSuperAdminEmail(user?.email);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16 bg-white border-b border-[#E8DFCF] shadow-xs">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2D572C]/10 flex items-center justify-center text-[#2D572C]">
            <TreePine size={20} />
          </div>
          <span className="font-extrabold text-base text-[#2C1810] font-serif">
            Gia Phả Dòng Họ
          </span>
        </Link>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] hover:bg-[#F3EAD7] transition-all cursor-pointer"
            >
              {photoURL ? (
                <img src={photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-[#C8A96E]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#2D572C]/15 text-[#2D572C] flex items-center justify-center text-xs font-bold">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-[#2C1810] max-w-[140px] truncate">{displayName}</span>
              <ChevronDown size={14} className="text-[#8C7662]" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white rounded-2xl border border-[#D5C4A6] shadow-lg p-2 z-50 flex flex-col gap-1">
                <div className="px-3 py-2 border-b border-[#E8DFCF] mb-1">
                  <div className="text-xs font-bold text-[#2C1810] truncate">{displayName}</div>
                  <div className="text-[11px] text-[#8C7662] truncate">{user.email}</div>
                  {isAdmin && (
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-[#2D572C] text-white px-2 py-0.5 rounded-full">
                      Quản trị viên hệ thống
                    </span>
                  )}
                </div>

                <Link
                  to="/admin"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#2C1810] hover:bg-[#FAF6EE] rounded-lg transition-colors"
                >
                  <SettingsIcon size={15} className="text-[#8B4513]" /> Quản trị hệ thống
                </Link>

                <Link
                  to="/nguyen-van/cay-gia-pha"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#2C1810] hover:bg-[#FAF6EE] rounded-lg transition-colors"
                >
                  <TreePine size={15} className="text-[#2D572C]" /> Xem cây gia phả mẫu
                </Link>

                <div className="h-[1px] bg-[#E8DFCF] my-1" />

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#C0392B] hover:bg-[#FDF0EE] rounded-lg transition-colors w-full text-left cursor-pointer"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="btn-primary px-5 py-2 text-xs shadow-xs"
          >
            Đăng nhập
          </Link>
        )}
      </nav>
      <Home />
    </>
  );
}
