import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Users, Shield, Settings, ArrowLeft, ExternalLink, TreePine, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getFamilies, createFamily, deleteFamily, addManager } from '../../firebase/families';
import { isSuperAdminEmail } from '../../firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import useAuthStore from '../../store/authStore';

export default function Admin() {
  const navigate = useNavigate();
  const { user, userDoc, initialized, loading: authLoading } = useAuthStore();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFamily, setNewFamily] = useState({ name: '', slug: '', description: '' });
  const [managerEmail, setManagerEmail] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const isAdminUser = Boolean(userDoc?.role === 'admin' || isSuperAdminEmail(user?.email));

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdminUser) {
      navigate('/');
      return;
    }
    loadFamilies();
  }, [user, userDoc, initialized, authLoading]);

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const data = await getFamilies();
      setFamilies(data || []);
    } catch (err) {
      console.warn('Lỗi tải danh sách gia phả:', err);
      // Fallback demo data if Firestore is fresh or rules pending
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFamily.name || !newFamily.slug) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      const slug = newFamily.slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      await createFamily({ ...newFamily, slug }, user.uid);
      setNewFamily({ name: '', slug: '', description: '' });
      setShowCreateForm(false);
      setMsg({ type: 'success', text: 'Tạo dòng họ thành công!' });
      await loadFamilies();
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi tạo dòng họ: ' + (err.message || 'Không thể ghi dữ liệu') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gia phả dòng họ "${name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteFamily(id);
      setMsg({ type: 'success', text: `Đã xóa gia phả "${name}"` });
      await loadFamilies();
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi xóa gia phả: ' + err.message });
    }
  };

  const handleGrantManager = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (!selectedFamilyId || !managerEmail) return;
    setSubmitting(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const found = snap.docs.find((d) => d.data().email?.toLowerCase() === managerEmail.trim().toLowerCase());
      if (!found) {
        setMsg({ type: 'error', text: `Không tìm thấy tài khoản với email "${managerEmail}". Hãy yêu cầu họ đăng nhập vào hệ thống trước!` });
        return;
      }
      await addManager(selectedFamilyId, found.id, user.uid);
      setMsg({ type: 'success', text: `Đã cấp quyền Quản lý dòng họ cho ${managerEmail} thành công!` });
      setManagerEmail('');
    } catch (e) {
      setMsg({ type: 'error', text: 'Lỗi cấp quyền: ' + e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized || authLoading || loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p className="mt-3 text-sm text-[#8C7662]">Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2C1810]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8DFCF] px-6 sm:px-10 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#8C7662] hover:text-[#2C1810] px-2.5 py-1.5 rounded-lg border border-[#E8DFCF] hover:bg-[#FAF6EE] transition-colors"
          >
            <ArrowLeft size={14} /> Trang chủ
          </Link>
          <div className="h-4 w-[1px] bg-[#E8DFCF]" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D572C]/10 flex items-center justify-center text-[#2D572C]">
              <Settings size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight font-serif">Bảng Quản Trị Hệ Thống (Super Admin)</h1>
              <p className="text-[11px] text-[#8C7662]">Quản lý danh sách dòng họ & phân quyền quản trị viên</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#2C1810]">{user?.displayName || 'Super Admin'}</div>
            <div className="text-[11px] text-[#2D572C] font-medium">{user?.email}</div>
          </div>
          <span className="text-[10px] font-bold bg-[#2D572C] text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
            Super Admin
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Toast / Message */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
            msg.type === 'success'
              ? 'bg-[#EBF7EE] border-[#8CD099] text-[#2D572C]'
              : 'bg-[#FDF2F2] border-[#F1B2B2] text-[#A82828]'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#2C1810]">Danh sách Dòng họ / Gia phả</h2>
            <p className="text-xs text-[#8C7662] mt-0.5">
              Hệ thống hiện có <strong className="text-[#2C1810]">{families.length}</strong> gia phả đang hoạt động
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/nguyen-van/cay-gia-pha"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#D5C4A6] bg-white hover:bg-[#FAF6EE] text-[#2C1810] transition-colors"
            >
              <TreePine size={15} className="text-[#2D572C]" />
              Xem Cây Gia Phả Demo (Họ Nguyễn)
            </Link>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#2D572C] text-white hover:bg-[#234522] shadow-sm transition-all"
            >
              <Plus size={16} />
              {showCreateForm ? 'Đóng form' : 'Khởi tạo Gia phả mới'}
            </button>
          </div>
        </div>

        {/* Form Create Family */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-[#D5C4A6] p-6 mb-8 shadow-sm animate-fade-in">
            <h3 className="text-base font-bold font-serif text-[#2C1810] mb-1">Tạo Dòng Họ / Gia Phả Mới</h3>
            <p className="text-xs text-[#8C7662] mb-5">
              Mỗi gia phả sẽ có một đường dẫn riêng biệt (slug) để gửi cho thành viên trong dòng tộc.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">
                    Tên dòng họ <span className="text-[#A82828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Họ Trần (Nam Định), Họ Lê Đại Tộc..."
                    value={newFamily.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/đ/g, 'd')
                        .replace(/[^a-z0-9\s-]/g, '')
                        .trim()
                        .replace(/\s+/g, '-');
                      setNewFamily((p) => ({ ...p, name, slug: p.slug ? p.slug : slug }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] text-xs text-[#2C1810] focus:outline-none focus:border-[#2D572C] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">
                    Đường dẫn Slug <span className="text-[#A82828]">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] px-3 focus-within:border-[#2D572C] focus-within:bg-white transition-all">
                    <span className="text-xs text-[#8C7662] select-none font-mono">/</span>
                    <input
                      type="text"
                      required
                      placeholder="ho-tran-nam-dinh"
                      value={newFamily.slug}
                      onChange={(e) => setNewFamily((p) => ({ ...p, slug: e.target.value }))}
                      className="w-full py-2.5 pl-1 pr-2 bg-transparent text-xs text-[#2C1810] font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Mô tả hoặc Lời tựa dòng tộc</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nguồn gốc, chi phái hoặc địa chỉ nhà thờ tổ..."
                  value={newFamily.description}
                  onChange={(e) => setNewFamily((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] text-xs text-[#2C1810] focus:outline-none focus:border-[#2D572C] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#D5C4A6] text-[#4A3B32] hover:bg-[#FAF6EE] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#2D572C] text-white hover:bg-[#234522] disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo dòng họ'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section: Phân quyền Quản lý dòng họ */}
        <div className="bg-white rounded-2xl border border-[#D5C4A6] p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-[#2D572C]" />
            <h3 className="text-base font-bold font-serif text-[#2C1810]">Cấp Quyền Quản Lý (Family Manager)</h3>
          </div>
          <p className="text-xs text-[#8C7662] mb-4">
            Ủy quyền cho người đại diện dòng họ chỉnh sửa cây gia phả, thêm thành viên và sự kiện cho dòng tộc của họ.
          </p>

          <form onSubmit={handleGrantManager} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] text-xs text-[#2C1810] focus:outline-none focus:border-[#2D572C] focus:bg-white transition-all"
            >
              <option value="">-- Chọn dòng họ --</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (/{f.slug})
                </option>
              ))}
            </select>

            <input
              type="email"
              required
              placeholder="Nhập email người quản lý (đã có tài khoản)"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FAF6EE] text-xs text-[#2C1810] focus:outline-none focus:border-[#2D572C] focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={submitting || families.length === 0}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#2D572C] text-white hover:bg-[#234522] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users size={14} />
              {submitting ? 'Đang cấp quyền...' : 'Cấp quyền Quản lý'}
            </button>
          </form>
        </div>

        {/* Danh sách gia phả */}
        <div className="space-y-3">
          {families.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-[#D5C4A6] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#C8A96E] transition-all shadow-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#2C1810] truncate">{f.name}</h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF6EE] border border-[#D5C4A6] rounded-md text-[#2D572C]">
                    /{f.slug}
                  </span>
                </div>
                {f.description && (
                  <p className="text-xs text-[#8C7662] mt-1 line-clamp-1">{f.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/${f.slug}/cay-gia-pha`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2D572C] text-[#2D572C] hover:bg-[#2D572C] hover:text-white text-xs font-semibold transition-all"
                >
                  <ExternalLink size={13} />
                  Vào xem gia phả
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(f.id, f.name)}
                  title="Xóa gia phả này"
                  className="p-2 rounded-xl border border-transparent hover:border-[#F1B2B2] text-[#A82828] hover:bg-[#FDF2F2] transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {families.length === 0 && (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#D5C4A6] bg-white/60">
              <TreePine size={36} className="mx-auto text-[#C8A96E] mb-3" />
              <h4 className="text-sm font-bold text-[#2C1810]">Chưa có gia phả nào trong cơ sở dữ liệu</h4>
              <p className="text-xs text-[#8C7662] mt-1 max-w-md mx-auto">
                Hãy nhấn nút <strong>"Khởi tạo Gia phả mới"</strong> ở góc trên để tạo dòng họ đầu tiên của bạn, hoặc truy cập cây gia phả mẫu (Họ Nguyễn) để trải nghiệm.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#2D572C] text-white hover:bg-[#234522]"
                >
                  Tạo ngay
                </button>
                <Link
                  to="/nguyen-van/cay-gia-pha"
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#D5C4A6] bg-white text-[#2C1810] hover:bg-[#FAF6EE]"
                >
                  Xem gia phả mẫu
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
