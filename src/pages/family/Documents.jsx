import useFamilyStore from '../../store/familyStore';
import { BookOpen, FileText } from 'lucide-react';

export default function Documents() {
  const { currentFamily } = useFamilyStore();
  return (
    <div style={{ padding:32, maxWidth:900, margin:'0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <BookOpen size={24} style={{ color: 'var(--primary)' }} />
        <h1 style={{ fontSize:24, fontWeight:700, color:'var(--primary)' }}>Tư liệu</h1>
      </div>
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Kho lưu trữ ảnh, văn bản, tư liệu dòng họ — Sẽ ra mắt sớm</p>
      <div style={{ marginTop:40, textAlign:'center', padding:60, background:'white', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={36} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <p style={{ color:'var(--text-muted)' }}>Tính năng Tư liệu đang được phát triển</p>
      </div>
    </div>
  );
}
