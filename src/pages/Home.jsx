import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TreePine, Users, CalendarDays, BookOpen,
  MapPin, Shield, ArrowRight, LogIn,
  Sparkles, Search
} from 'lucide-react';

const FEATURES = [
  {
    icon: TreePine,
    color: '#2D572C',
    bg: '#EAF2EA',
    title: 'Cây Gia Phả Tương Tác',
    desc: 'Sơ đồ phả hệ trực quan đa thế hệ. Dễ dàng thu phóng, kéo thả, phân nhánh theo từng chi, phái và thế thứ.',
  },
  {
    icon: CalendarDays,
    color: '#8B4513',
    bg: '#F8EFE6',
    title: 'Lịch Giỗ Chạp & Âm Lịch',
    desc: 'Tự động tính ngày giỗ theo Âm lịch truyền thống Việt Nam, nhắc nhở con cháu trước mỗi dịp tế tổ, giỗ chạp.',
  },
  {
    icon: Users,
    color: '#5A7A5A',
    bg: '#EFF5EF',
    title: 'Hồ Sơ Thành Viên Chi Tiết',
    desc: 'Lưu trữ trọn vẹn tiểu sử, chân dung, công đức, vai trò (Trưởng tộc, Trưởng chi) và quan hệ gia đình nhiều đời.',
  },
  {
    icon: MapPin,
    color: '#C0392B',
    bg: '#FDF0EE',
    title: 'Định Vị Phần Mộ Gia Tiên',
    desc: 'Ghi lại tọa độ GPS nghĩa trang, lăng mộ giúp con cháu đi làm ăn xa dễ dàng tìm về viếng mộ tổ tiên.',
  },
  {
    icon: BookOpen,
    color: '#C8A96E',
    bg: '#FBF6EC',
    title: 'Kho Tư Liệu Số Hóa',
    desc: 'Lưu giữ văn bia cổ, ảnh gia đình qua các thời kỳ, sắc phong, gia huấn và các tài liệu lịch sử quý báu.',
  },
  {
    icon: Shield,
    color: '#2C1810',
    bg: '#F2EDE4',
    title: 'Phân Quyền & Bảo Mật',
    desc: 'Bảo vệ quyền riêng tư dòng họ. Trưởng họ kiểm duyệt thông tin, mỗi gia phả có đường dẫn bảo mật riêng biệt.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [slugInput, setSlugInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccess = (e) => {
    e.preventDefault();
    const clean = slugInput.trim().toLowerCase().replace(/^\/+/, '');
    if (!clean) {
      setErrorMsg('Vui lòng nhập mã hoặc đường dẫn gia phả');
      return;
    }
    navigate(`/${clean}/cay-gia-pha`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2C1810] flex flex-col font-sans">
      {/* ===== 1. HERO SECTION ===== */}
      <section className="relative pt-16 pb-20 px-6 sm:px-10 overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FAF7F0] border-b border-[#E8DFCF]">
        {/* Subtle decorative radial lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C8A96E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Traditional Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D5C4A6] bg-[#FFFDF9] shadow-xs mb-6">
            <Sparkles size={14} className="text-[#C8A96E]" />
            <span className="text-xs font-semibold text-[#6B4E37]">
              Nền tảng số hóa phả hệ & kết nối dòng tộc Việt Nam
            </span>
          </div>

          {/* Main Title - No negative tracking to ensure Vietnamese diacritics never break */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2C1810] leading-[1.25] font-serif">
            Lưu Giữ Cội Nguồn <br className="hidden sm:inline" />
            <span className="text-[#8B4513]">Kết Nối Muôn Đời Sau</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-[#6B4E37] max-w-2xl mx-auto leading-relaxed font-normal">
            Không gian trang trọng lưu truyền gia phả, tra cứu ngày giỗ Âm lịch,
            kết nối con cháu muôn phương và gìn giữ cội nguồn tổ tiên dòng họ.
          </p>

          {/* Direct Slug Access Box */}
          <div className="mt-9 max-w-xl mx-auto">
            <form
              onSubmit={handleAccess}
              className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 bg-white rounded-2xl border-2 border-[#D5C4A6] shadow-sm focus-within:border-[#8B4513] transition-all"
            >
              <div className="flex-1 flex items-center px-3.5 gap-2 text-sm text-[#8C7662]">
                <Search size={16} className="text-[#8B4513] flex-shrink-0" />
                <span className="font-mono text-xs font-semibold text-[#8C7662] select-none">
                  giapha/
                </span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="nhap-ma-dong-ho (ví dụ: nguyen-van)"
                  className="w-full bg-transparent border-none text-[#2C1810] font-medium text-sm focus:outline-none placeholder:text-[#A69380]"
                />
              </div>

              <button
                type="submit"
                className="btn-primary px-6 py-3 text-sm shadow-xs flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Vào xem gia phả</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {errorMsg && (
              <p className="text-xs text-[#C0392B] mt-2 font-medium">{errorMsg}</p>
            )}

            {/* Quick Demo Pill */}
            <div className="flex items-center justify-center gap-2 mt-3.5 text-xs text-[#8C7662]">
              <span>Gợi ý xem thử:</span>
              <button
                type="button"
                onClick={() => navigate('/nguyen-van/cay-gia-pha')}
                className="font-semibold text-[#8B4513] hover:underline bg-[#EFE8DC] px-2.5 py-0.5 rounded-full"
              >
                Họ Nguyễn (nguyen-van) →
              </button>
            </div>
          </div>
        </div>

        {/* ===== 2. APP PREVIEW MOCKUP ===== */}
        <div className="max-w-5xl mx-auto mt-14 relative z-10">
          <div className="rounded-2xl border-2 border-[#D5C4A6] bg-white p-3 shadow-md">
            {/* Mock browser header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E8DFCF] mb-3 bg-[#FAF6EE] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E08272]" />
                <div className="w-3 h-3 rounded-full bg-[#E5B567]" />
                <div className="w-3 h-3 rounded-full bg-[#7FB080]" />
              </div>
              <div className="text-[11px] font-mono text-[#8C7662] bg-white px-4 py-1 rounded-md border border-[#E8DFCF]">
                https://giaphaonline.vn/nguyen-van/cay-gia-pha
              </div>
              <div className="w-12" />
            </div>

            {/* Mini visual mockup card replicating the user reference */}
            <div className="bg-[#FAF6EE] rounded-xl p-4 border border-[#E8DFCF] flex flex-col gap-3">
              {/* Banner inside mockup */}
              <div className="bg-gradient-to-r from-[#F7EEDC] to-[#EFE4CF] p-4 rounded-xl border border-[#DDD0B8] flex items-center justify-between">
                <div>
                  <div className="font-serif font-bold text-lg text-[#2C1810]">Cây Gia Phả Họ Nguyễn</div>
                  <div className="text-xs text-[#6B4E37]">Sơ đồ 5 thế hệ · 58 thành viên · Lưu truyền từ năm 1860</div>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-[#2D572C] text-white text-xs font-semibold">
                    5 Thế hệ
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-[#C8A96E] text-[#6B4E37] text-xs font-semibold">
                    58 Thành viên
                  </div>
                </div>
              </div>

              {/* Tree node mock illustration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#DDD0B8] shadow-xs flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F4EFE6] border-2 border-[#C8A96E] flex items-center justify-center font-bold text-[#8B4513] text-sm">
                    Tổ
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#2C1810]">Nguyễn Văn Tổ</div>
                    <span className="text-[10px] font-semibold bg-[#2D572C] text-white px-2 py-0.5 rounded-full">Trưởng họ</span>
                    <div className="text-[11px] text-[#8C7662] mt-0.5">(1860 – 1935)</div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#DDD0B8] shadow-xs flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F4EFE6] border-2 border-[#C8A96E] flex items-center justify-center font-bold text-[#8B4513] text-sm">
                    Bình
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#2C1810]">Nguyễn Văn Bình</div>
                    <span className="text-[10px] font-semibold bg-[#2D572C] text-white px-2 py-0.5 rounded-full">Trưởng chi</span>
                    <div className="text-[11px] text-[#8C7662] mt-0.5">(1915 – 1987)</div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#DDD0B8] shadow-xs flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F4EFE6] border-2 border-[#C8A96E] flex items-center justify-center font-bold text-[#8B4513] text-sm">
                    Minh
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#2C1810]">Nguyễn Văn Minh</div>
                    <span className="text-[10px] font-semibold bg-[#EFE8DC] text-[#6B4E37] px-2 py-0.5 rounded-full">Con trai</span>
                    <div className="text-[11px] text-[#8C7662] mt-0.5">(1945 – nay)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. HOW IT WORKS (3 SIMPLE STEPS) ===== */}
      <section className="py-16 px-6 sm:px-10 bg-[#FAF7F0] border-b border-[#E8DFCF]">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C1810] font-serif leading-snug">
            Cơ Chế Bảo Mật & Truy Cập Độc Lập
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#6B4E37]">
            Mỗi dòng họ sở hữu một đường dẫn riêng tư được mã hóa, không công khai bừa bãi.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#DDD0B8] shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF2EA] text-[#2D572C] font-extrabold text-base flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="font-bold text-base text-[#2C1810] mb-2 font-serif">Nhận Liên Kết Riêng</h3>
            <p className="text-xs text-[#6B4E37] leading-relaxed">
              Trưởng họ hoặc người quản lý chia sẻ đường dẫn định danh cho con cháu trong dòng tộc.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#DDD0B8] shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F8EFE6] text-[#8B4513] font-extrabold text-base flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="font-bold text-base text-[#2C1810] mb-2 font-serif">Xem Phả Hệ Trực Quan</h3>
            <p className="text-xs text-[#6B4E37] leading-relaxed">
              Truy cập ngay trên điện thoại hoặc máy tính, tra cứu thế thứ, ngày giỗ và thông tin tổ tiên.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#DDD0B8] shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF6EC] text-[#C8A96E] font-extrabold text-base flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="font-bold text-base text-[#2C1810] mb-2 font-serif">Cập Nhật & Gắn Kết</h3>
            <p className="text-xs text-[#6B4E37] leading-relaxed">
              Đề xuất bổ sung con cháu mới sinh, thông tin ngày mất, đính kèm tư liệu và kỷ niệm dòng họ.
            </p>
          </div>
        </div>
      </section>

      {/* ===== 4. CORE FEATURES GRID ===== */}
      <section className="py-20 px-6 sm:px-10 bg-[#FFFDF9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C1810] font-serif leading-snug">
              Tính Năng Trọng Tâm Dành Cho Dòng Họ
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#6B4E37]">
              Thiết kế chuyên biệt cho phong tục tập quán và văn hóa truyền thống người Việt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-6 bg-[#FAF7F0] border border-[#DDD0B8] hover:border-[#8B4513] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-xs"
                      style={{ background: feat.bg }}
                    >
                      <IconComp size={22} style={{ color: feat.color }} />
                    </div>
                    <h3 className="font-bold text-base text-[#2C1810] mb-2 font-serif">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#6B4E37] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 5. BOTTOM CALL TO ACTION ===== */}
      <section className="py-16 px-6 sm:px-10 bg-[#FAF6EE] border-t border-[#E8DFCF] text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#2D572C]/10 text-[#2D572C] flex items-center justify-center mx-auto mb-4">
            <TreePine size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C1810] font-serif mb-3 leading-snug">
            Bắt Đầu Số Hóa Gia Phả Cho Dòng Họ Của Bạn
          </h2>
          <p className="text-sm text-[#6B4E37] mb-8 leading-relaxed">
            Đăng nhập hệ thống để khởi tạo gia phả mới, hoặc liên hệ người quản lý để nhận đường dẫn truy cập gia phả dòng tộc của mình.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/login"
              className="btn-primary px-7 py-3 text-sm shadow-sm inline-flex items-center gap-2"
            >
              <LogIn size={16} />
              <span>Đăng nhập hệ thống</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 6. FOOTER ===== */}
      <footer className="py-6 px-6 border-t border-[#E8DFCF] bg-[#FAF7F0] text-center text-xs text-[#8C7662]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-[#2C1810]">
            <TreePine size={16} className="text-[#2D572C]" />
            Gia Phả Online
          </div>
          <div>© 2026 Gia Phả Online — Giữ gìn bản sắc và nguồn cội dân tộc Việt Nam.</div>
        </div>
      </footer>
    </div>
  );
}
