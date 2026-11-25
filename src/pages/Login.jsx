import { useNavigate, Link } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, registerWithEmail, logout } from '../firebase/auth';
import { useState } from 'react';
import { TreePine, AlertCircle, ArrowLeft, LogOut, CheckCircle2, User } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { user, userDoc } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu người dùng ĐÃ ĐĂNG NHẬP, hiển thị thông tin tài khoản hiện tại thay vì bị chuyển hướng ngầm
  if (user) {
    const displayName = user.displayName || userDoc?.displayName || user.email?.split('@')[0] || 'Thành viên';
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C7662] hover:text-[#2C1810] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#D5C4A6] shadow-lg p-7 text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#C8A96E] flex items-center justify-center bg-[#FAF6EE]">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2D572C]/15 text-[#2D572C] flex items-center justify-center font-bold text-xl">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2EA] text-[#2D572C] text-xs font-semibold mb-2">
            <CheckCircle2 size={13} /> Đã đăng nhập thành công
          </div>

          <h2 className="text-xl font-bold text-[#2C1810] font-serif">{displayName}</h2>
          <p className="text-xs text-[#8C7662] mt-0.5">{user.email}</p>

          <div className="flex flex-col gap-2.5 mt-6">
            <Link to="/" className="btn-primary w-full py-2.5 text-xs shadow-xs">
              Vào trang chủ
            </Link>
            <Link to="/nguyen-van/cay-gia-pha" className="btn-secondary w-full py-2.5 text-xs shadow-xs">
              Xem cây gia phả mẫu (Họ Nguyễn)
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-[#C0392B] hover:underline font-semibold mt-2 cursor-pointer"
            >
              <LogOut size={14} /> Đăng xuất tài khoản này
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/');
    } catch (e) {
      console.error('Lỗi đăng nhập Google:', e);
      const code = e?.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.');
      } else if (code === 'auth/popup-blocked') {
        setError('Trình duyệt đang chặn cửa sổ đăng nhập (Popup). Vui lòng cấp quyền mở Popup cho trang này trên thanh địa chỉ.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Chưa bật tính năng đăng nhập Google trong Firebase Console (Vào Authentication -> Sign-in method -> Bật Google).');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Tên miền (localhost) chưa được cấp phép trong Firebase Authentication -> Settings -> Authorized domains.');
      } else {
        setError(e?.message || 'Không thể đăng nhập bằng Google. Hãy thử dùng Email & Mật khẩu bên dưới.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setError('Vui lòng nhập họ tên của bạn');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name);
      }
      navigate('/');
    } catch (e) {
      console.error('Lỗi đăng nhập Email:', e);
      const msgs = {
        'auth/invalid-credential': 'Email hoặc mật khẩu không chính xác',
        'auth/user-not-found': 'Email này chưa được đăng ký trong hệ thống',
        'auth/wrong-password': 'Mật khẩu không chính xác',
        'auth/email-already-in-use': 'Email này đã được sử dụng bởi tài khoản khác',
        'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự',
        'auth/invalid-email': 'Định dạng email không hợp lệ',
        'auth/operation-not-allowed': 'Chưa bật Email/Password trong Firebase Console (Vào Authentication -> Sign-in method -> Bật Email/Password)',
        'auth/too-many-requests': 'Đã thử đăng nhập sai quá nhiều lần. Vui lòng đợi trong giây lát.',
        'auth/network-request-failed': 'Lỗi kết nối mạng đến máy chủ Firebase. Vui lòng kiểm tra đường truyền.',
      };
      setError(msgs[e.code] || e.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {/* Back to home */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C7662] hover:text-[#2C1810] mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại trang chủ
      </Link>

      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-[#D5C4A6] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF6EE] border-b border-[#E8DFCF] p-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2D572C]/10 text-[#2D572C] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <TreePine size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2C1810] font-serif">
            Gia Phả Dòng Họ
          </h1>
          <p className="text-xs text-[#6B4E37] mt-1 font-medium">
            Lưu giữ cội nguồn — Kết nối muôn đời sau
          </p>
        </div>

        {/* Body */}
        <div className="p-7">
          {/* Tabs */}
          <div className="flex border-b border-[#E8DFCF] mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-all text-center border-b-2 ${
                mode === 'login'
                  ? 'border-[#2D572C] text-[#2D572C]'
                  : 'border-transparent text-[#8C7662] hover:text-[#2C1810]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-all text-center border-b-2 ${
                mode === 'register'
                  ? 'border-[#2D572C] text-[#2D572C]'
                  : 'border-transparent text-[#8C7662] hover:text-[#2C1810]'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF6EE] text-[#2C1810] border border-[#D5C4A6] rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-2xs mb-5 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.1 5.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 5.1 29.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.2-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 5.1 29.1 3 24 3 16.3 3 9.6 7.9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-4.9l-6-5c-2 1.4-4.5 2.2-6.9 2.2-5.3 0-9.9-3.4-11.5-8.1l-6.5 5C9.7 40.4 16.4 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.5 2.5-1.9 4.6-3.9 6l6 5c3.5-3.2 5.6-8 5.6-14 0-1.3-.2-2.7-.4-4z"/>
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-[1px] bg-[#E8DFCF]" />
            <span className="text-[11px] font-medium text-[#8C7662]">hoặc với Email</span>
            <div className="flex-1 h-[1px] bg-[#E8DFCF]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#6B4E37] mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Minh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FFFDF9] text-sm text-[#2C1810] focus:border-[#2D572C] transition-colors placeholder:text-[#A69380]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#6B4E37] mb-1.5">
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FFFDF9] text-sm text-[#2C1810] focus:border-[#2D572C] transition-colors placeholder:text-[#A69380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B4E37] mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4A6] bg-[#FFFDF9] text-sm text-[#2C1810] focus:border-[#2D572C] transition-colors placeholder:text-[#A69380]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FDF0EE] border border-[#F2C0B8] flex items-start gap-2.5 text-xs text-[#C0392B] leading-relaxed">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-60 shadow-xs"
            >
              {loading
                ? 'Đang xử lý...'
                : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
