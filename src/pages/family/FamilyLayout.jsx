import { Outlet, useParams, Navigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import useFamily from '../../hooks/useFamily';
import { AlertCircle } from 'lucide-react';

export default function FamilyLayout() {
  const { slug } = useParams();
  const { family, loading, error } = useFamily(slug, { resetOnUnmount: true });

  if (loading && !family) return <div className="page-loader"><div className="spinner" /></div>;

  if (error || !family) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Navbar />
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ color:'var(--primary)' }}>Không tìm thấy gia phả</h2>
          <p style={{ color:'var(--text-muted)' }}>{error || `Gia phả "${slug}" không tồn tại`}</p>
          <a href="/" style={{ color:'var(--primary)', fontWeight:600 }}>← Về trang chủ</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <main style={{ flex:1 }}>
        <Outlet />
      </main>
    </div>
  );
}
