import { useState, useEffect } from 'react';
import { addMember, updateMember } from '../../firebase/members';
import { logActivity } from '../../firebase/activities';
import useImageUpload from '../../hooks/useImageUpload';
import useFamilyStore from '../../store/familyStore';
import useAuthStore from '../../store/authStore';
import { formatLunarDate } from '../../utils/lunarCalendar';
import { X, Upload, Pencil, Plus, User, Check, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Cơ bản', subtitle: 'Ảnh đại diện & thông tin cá nhân' },
  { id: 2, title: 'Ngày tháng', subtitle: 'Ngày sinh & trạng thái' },
  { id: 3, title: 'Quan hệ', subtitle: 'Cha mẹ, vợ/chồng & con cái' },
  { id: 4, title: 'Tiểu sử', subtitle: 'Tiểu sử & xác nhận lưu' },
];

const ROLES = ['', 'Trưởng họ', 'Trưởng chi', 'Trưởng nhánh'];

const inputCls =
  'w-full rounded-xl border border-[#DDD0B8] bg-white px-3.5 py-2 text-sm text-[#2C1810] placeholder:text-[#A69380] focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/15 focus:outline-none transition-all';

function parseDateParts(dateStr) {
  if (!dateStr) return { day: '', month: '', year: '' };
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return { day: String(Number(d)), month: String(Number(m)), year: y };
  }
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    return { day: '', month: String(Number(m)), year: y };
  }
  if (/^\d{4}$/.test(s)) {
    return { day: '', month: '', year: s };
  }
  return { day: '', month: '', year: '' };
}

function buildDateString(day, month, year) {
  const y = String(year || '').trim();
  const m = String(month || '').trim();
  const d = String(day || '').trim();
  if (!y) return '';
  const pad2 = (v) => v.padStart(2, '0');
  if (m && d) return `${y}-${pad2(m)}-${pad2(d)}`;
  if (m) return `${y}-${pad2(m)}`;
  return y;
}

function computeLunarFromParts(day, month, year) {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!d || !m || !y || y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  try {
    return formatLunarDate(d, m, y);
  } catch {
    return '';
  }
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B4E37] mb-1.5">
      {children}
    </label>
  );
}

export default function MemberForm({
  familyId,
  members,
  initialData,
  defaultGeneration = 1,
  preset = null,
  inline = false,
  onClose,
  onSaved,
}) {
  const isEdit = !!initialData;
  const { preview, base64, sizeKB, compressing, error: imgError, handleFile, reset: resetImg } = useImageUpload('avatar');

  const initBirth = parseDateParts(initialData?.birthDate);
  const initDeath = parseDateParts(initialData?.deathDate);

  const [form, setForm] = useState({
    fullName: '', birthName: '', gender: preset?.gender || 'male',
    birthDate: '', birthDay: initBirth.day, birthMonth: initBirth.month, birthYear: initBirth.year,
    birthDateLunar: '',
    isDeceased: false,
    deathDate: '', deathDay: initDeath.day, deathMonth: initDeath.month, deathYear: initDeath.year,
    deathDateLunar: '',
    generation: preset?.generation || defaultGeneration || 1,
    role: preset?.role || '', hometown: '', bio: '',
    parentIds: preset?.parentIds || [],
    spouseIds: preset?.spouseIds || [],
    childIds: preset?.childIds || [],
    photo: '',
  });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (inline) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [inline]);

  useEffect(() => {
    if (initialData) {
      const b = parseDateParts(initialData.birthDate);
      const d = parseDateParts(initialData.deathDate);
      const deceased = !!(initialData.isDeceased || initialData.deathDate || initialData.deathDateLunar);
      setForm({
        fullName: initialData.fullName || '',
        birthName: initialData.birthName || '',
        gender: initialData.gender || 'male',
        birthDate: initialData.birthDate || '',
        birthDay: b.day,
        birthMonth: b.month,
        birthYear: b.year,
        birthDateLunar: initialData.birthDateLunar || '',
        isDeceased: deceased,
        deathDate: initialData.deathDate || '',
        deathDay: d.day,
        deathMonth: d.month,
        deathYear: d.year,
        deathDateLunar: initialData.deathDateLunar || computeLunarFromParts(d.day, d.month, d.year),
        generation: initialData.generation || 1,
        role: initialData.role || '',
        hometown: initialData.hometown || '',
        bio: initialData.bio || '',
        parentIds: initialData.parentIds || [],
        spouseIds: initialData.spouseIds || [],
        childIds: initialData.childIds || [],
        photo: initialData.photo || '',
      });
    }
  }, [initialData]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const updateDatePart = (prefix, part, val) => {
    const clean = val.replace(/\D/g, '');
    setForm((f) => {
      const next = { ...f, [`${prefix}${part}`]: clean };
      const day = next[`${prefix}Day`];
      const month = next[`${prefix}Month`];
      const year = next[`${prefix}Year`];
      const built = buildDateString(day, month, year);
      const lunar = computeLunarFromParts(day, month, year);
      if (prefix === 'birth') {
        next.birthDate = built;
        if (lunar) next.birthDateLunar = lunar;
      } else {
        next.deathDate = built;
        if (lunar) next.deathDateLunar = lunar;
      }
      return next;
    });
  };

  const handleMultiSelect = (key, id, checked) => {
    setForm((f) => ({
      ...f,
      [key]: checked ? [...f[key], id] : f[key].filter((x) => x !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ tên'); return; }
    setSaving(true);
    setError('');
    try {
      const { birthDay: _bd, birthMonth: _bm, birthYear: _by, deathDay: _dd, deathMonth: _dm, deathYear: _dy, ...rest } = form;
      const data = { ...rest, photo: base64 || form.photo };

      // Demo mode (local state only when using mock family)
      if (familyId === 'demo-nguyen-van') {
        const { members: storeMembers, setMembers } = useFamilyStore.getState();
        const targetId = isEdit ? initialData.id : `demo-${Date.now()}`;
        const savedMember = { ...data, id: targetId };

        let nextMembers = isEdit
          ? storeMembers.map((m) => (m.id === targetId ? { ...m, ...savedMember } : m))
          : [...storeMembers, savedMember];

        // Sync bidirectional relationships
        nextMembers = nextMembers.map((m) => {
          if (m.id === targetId) return m;
          const updated = { ...m };
          if (data.parentIds.includes(m.id) && !(m.childIds || []).includes(targetId)) {
            updated.childIds = [...(m.childIds || []), targetId];
          }
          if (data.spouseIds.includes(m.id) && !(m.spouseIds || []).includes(targetId)) {
            updated.spouseIds = [...(m.spouseIds || []), targetId];
          }
          if (data.childIds.includes(m.id) && !(m.parentIds || []).includes(targetId)) {
            updated.parentIds = [...(m.parentIds || []), targetId];
          }
          return updated;
        });

        setMembers(nextMembers);
        useFamilyStore.getState().addLocalActivity({
          id: `act-${Date.now()}`,
          type: isEdit ? 'member_edit' : 'member_add',
          title: isEdit ? 'Cập nhật thông tin' : 'Thêm thành viên mới',
          description: isEdit
            ? `Đã chỉnh sửa thông tin ${data.fullName} (thế hệ ${data.generation})`
            : `Đã thêm ${data.fullName} (thế hệ ${data.generation})`,
          actorName: useAuthStore.getState().user?.displayName || 'Quản trị viên',
          targetId,
          createdAt: new Date().toISOString(),
        });
        onSaved?.();
        return;
      }

      let targetId = initialData?.id;
      if (isEdit) {
        await updateMember(familyId, targetId, data);
      } else {
        targetId = await addMember(familyId, data);
      }

      // Sync bidirectional relationships in Firestore
      const syncOps = [];
      data.parentIds.forEach((pid) => {
        const p = members.find((m) => m.id === pid);
        if (p && !(p.childIds || []).includes(targetId)) {
          syncOps.push(updateMember(familyId, pid, { childIds: [...(p.childIds || []), targetId] }));
        }
      });
      data.spouseIds.forEach((sid) => {
        const s = members.find((m) => m.id === sid);
        if (s && !(s.spouseIds || []).includes(targetId)) {
          syncOps.push(updateMember(familyId, sid, { spouseIds: [...(s.spouseIds || []), targetId] }));
        }
      });
      data.childIds.forEach((cid) => {
        const c = members.find((m) => m.id === cid);
        if (c && !(c.parentIds || []).includes(targetId)) {
          syncOps.push(updateMember(familyId, cid, { parentIds: [...(c.parentIds || []), targetId] }));
        }
      });
      if (syncOps.length) await Promise.all(syncOps);

      await logActivity(familyId, {
        type: isEdit ? 'member_edit' : 'member_add',
        title: isEdit ? 'Cập nhật thông tin' : 'Thêm thành viên mới',
        description: isEdit
          ? `Đã chỉnh sửa thông tin ${data.fullName} (thế hệ ${data.generation})`
          : `Đã thêm ${data.fullName} (thế hệ ${data.generation})`,
        actorName: useAuthStore.getState().user?.displayName || useAuthStore.getState().user?.email || 'Quản trị viên',
        targetId,
      });

      onSaved?.();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !form.fullName.trim()) {
      setError('Vui lòng nhập họ và tên trước khi tiếp tục');
      return;
    }
    setError('');
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const currentStepInfo = STEPS[step - 1];

  const cardContent = (
    <div
      className={
        inline
          ? 'bg-[#FFFDF9] border border-[#DDD0B8] rounded-2xl shadow-sm flex flex-col overflow-hidden h-[560px] max-h-[85vh]'
          : 'bg-[#FFFDF9] border border-[#DDD0B8] rounded-3xl shadow-2xl w-full max-w-3xl h-[560px] max-h-[90vh] flex flex-col overflow-hidden'
      }
    >
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-[#E8DFCF] bg-[#FAF6EE]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
              {isEdit ? <Pencil size={16} /> : <Plus size={17} />}
            </div>
            <div>
              <h2 className="font-bold text-base text-[#2C1810] font-serif leading-tight">
                {isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
              </h2>
              <p className="text-xs text-[#8C7662]">
                {currentStepInfo.subtitle} · Bước {step}/{STEPS.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C7662] hover:text-[#2C1810] hover:bg-[#EFE8DC]/60 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Google-style Step Progress Bar */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isDone = s.id < step;
            const canJump = isEdit || isDone || (s.id === step + 1 && !!form.fullName.trim());
            return (
              <button
                key={s.id}
                type="button"
                disabled={!canJump && !isActive}
                onClick={() => {
                  if (s.id > 1 && !form.fullName.trim()) {
                    setError('Vui lòng nhập họ và tên trước khi chuyển bước');
                    return;
                  }
                  setError('');
                  setStep(s.id);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white border-[#C8A96E] text-[#2C1810] shadow-xs'
                    : isDone
                      ? 'bg-[#EAF2EA]/70 border-[#2D572C]/25 text-[#2D572C] hover:bg-[#EAF2EA] cursor-pointer'
                      : canJump
                        ? 'bg-white/60 border-[#E8DFCF] text-[#6B4E37] hover:bg-white cursor-pointer'
                        : 'bg-white/40 border-[#E8DFCF] text-[#A69380] opacity-70 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-[#8B4513] text-white'
                      : isDone
                        ? 'bg-[#2D572C] text-white'
                        : 'bg-[#EFE8DC] text-[#6B4E37]'
                  }`}
                >
                  {isDone ? <Check size={11} /> : s.id}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3.5">
        {/* STEP 1: Thông tin cơ bản */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#FAF6EE] border border-[#E8DFCF]">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#C8A96E] overflow-hidden flex items-center justify-center bg-white shrink-0">
                {(preview || form.photo)
                  ? <img src={preview || form.photo} alt="" className="w-full h-full object-cover" />
                  : <User size={22} className="text-[#8B4513]" />
                }
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#DDD0B8] bg-white hover:bg-[#FAF6EE] text-xs font-semibold text-[#2C1810] cursor-pointer transition-colors w-fit shadow-xs">
                  <Upload size={13} className="text-[#8B4513]" />
                  {compressing ? 'Đang nén ảnh...' : 'Chọn ảnh đại diện'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
                <span className="text-[11px] text-[#8C7662]">Hỗ trợ JPG, PNG — tự động nén gọn</span>
                {sizeKB && (
                  <div className="text-xs text-[#2D572C] font-medium inline-flex items-center gap-1">
                    <Check size={13} /> Đã nén: {sizeKB} KB
                  </div>
                )}
                {imgError && <div className="text-xs text-[#C0392B]">{imgError}</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <FieldLabel>Họ và tên <span className="text-[#C0392B]">*</span></FieldLabel>
                <input
                  className={inputCls}
                  placeholder="Nhập họ và tên đầy đủ..."
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Giới tính</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'male', label: 'Nam' },
                    { value: 'female', label: 'Nữ' },
                  ].map((opt) => {
                    const active = form.gender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('gender', opt.value)}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[#FAF6EE] border-[#8B4513] ring-2 ring-[#8B4513]/15 text-[#2C1810] shadow-xs'
                            : 'bg-white border-[#DDD0B8] text-[#6B4E37] hover:border-[#C8A96E] hover:bg-[#FAF6EE]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              active ? 'bg-[#8B4513] text-white' : 'bg-[#EFE8DC] text-[#6B4E37]'
                            }`}
                          >
                            {opt.value === 'male' ? '♂' : '♀'}
                          </span>
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            active ? 'border-[#8B4513] bg-[#8B4513]' : 'border-[#D5C4A6]'
                          }`}
                        >
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>Chức danh</FieldLabel>
                <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r || '-- Không có chức danh --'}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Đời thứ</FieldLabel>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={form.generation}
                  onChange={(e) => set('generation', parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Ngày sinh & Trạng thái */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            {/* Ngày sinh */}
            <div className="p-4 rounded-2xl border border-[#E8DFCF] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C1810]">Ngày sinh</span>
                <span className="text-[11px] text-[#8C7662]">Có thể chỉ nhập Năm hoặc Tháng + Năm</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Dương lịch (Ngày / Tháng / Năm)</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className={inputCls}
                      placeholder="Ngày"
                      maxLength={2}
                      value={form.birthDay}
                      onChange={(e) => updateDatePart('birth', 'Day', e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="Tháng"
                      maxLength={2}
                      value={form.birthMonth}
                      onChange={(e) => updateDatePart('birth', 'Month', e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="Năm"
                      maxLength={4}
                      value={form.birthYear}
                      onChange={(e) => updateDatePart('birth', 'Year', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Âm lịch</FieldLabel>
                  <input
                    className={inputCls}
                    placeholder="Tự tính khi nhập đủ ngày hoặc nhập tay"
                    value={form.birthDateLunar}
                    onChange={(e) => set('birthDateLunar', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Trạng thái & Ngày mất */}
            <div className="p-4 rounded-2xl border border-[#DDD0B8] bg-[#FAF6EE] space-y-3">
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-[#2C1810]">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#8B4513] rounded"
                  checked={form.isDeceased}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      isDeceased: checked,
                      ...(checked ? {} : { deathDate: '', deathDay: '', deathMonth: '', deathYear: '', deathDateLunar: '' }),
                    }));
                  }}
                />
                Đã khuất (tích chọn nếu đã mất, kể cả khi không nhớ ngày)
              </label>

              {form.isDeceased && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E8DFCF]">
                  <div>
                    <FieldLabel>Ngày mất Dương lịch (Ngày / Tháng / Năm)</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        className={inputCls}
                        placeholder="Ngày"
                        maxLength={2}
                        value={form.deathDay}
                        onChange={(e) => updateDatePart('death', 'Day', e.target.value)}
                      />
                      <input
                        className={inputCls}
                        placeholder="Tháng"
                        maxLength={2}
                        value={form.deathMonth}
                        onChange={(e) => updateDatePart('death', 'Month', e.target.value)}
                      />
                      <input
                        className={inputCls}
                        placeholder="Năm"
                        maxLength={4}
                        value={form.deathYear}
                        onChange={(e) => updateDatePart('death', 'Year', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Ngày mất Âm lịch</FieldLabel>
                    <input
                      className={inputCls}
                      placeholder="Tự tính khi nhập đủ ngày hoặc nhập tay"
                      value={form.deathDateLunar}
                      onChange={(e) => set('deathDateLunar', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Quan hệ gia đình */}
        {step === 3 && (
          <div className="grid grid-cols-1 gap-4">
            <RelationPicker label="Cha / Mẹ" value={form.parentIds} members={members} exclude={initialData?.id}
              onChange={(id, checked) => handleMultiSelect('parentIds', id, checked)} />
            <RelationPicker label="Vợ / Chồng" value={form.spouseIds} members={members} exclude={initialData?.id}
              onChange={(id, checked) => handleMultiSelect('spouseIds', id, checked)} />
            <RelationPicker label="Con cái" value={form.childIds} members={members} exclude={initialData?.id}
              onChange={(id, checked) => handleMultiSelect('childIds', id, checked)} />
          </div>
        )}

        {/* STEP 4: Tiểu sử & Xác nhận */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Tiểu sử, công trạng, cuộc đời</FieldLabel>
              <textarea
                className={`${inputCls} min-h-[120px] resize-y`}
                placeholder="Nhập tiểu sử, công trạng, cuộc đời..."
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
              />
            </div>

            <div className="p-4 rounded-2xl border border-[#DDD0B8] bg-[#FAF6EE] text-xs text-[#6B4E37] space-y-1.5">
              <div className="font-bold text-sm text-[#2C1810] mb-1">Tóm tắt thông tin</div>
              <div>
                <span className="text-[#8C7662]">Họ tên:</span>{' '}
                <strong className="text-[#2C1810]">{form.fullName}</strong> ({form.gender === 'female' ? 'Nữ' : 'Nam'} · Đời {form.generation})
              </div>
              {form.role && <div><span className="text-[#8C7662]">Chức danh:</span> {form.role}</div>}
              {form.birthDate && (
                <div>
                  <span className="text-[#8C7662]">Ngày sinh:</span> {form.birthDate}
                  {form.birthDateLunar ? ` (${form.birthDateLunar} ÂL)` : ''}
                </div>
              )}
              <div>
                <span className="text-[#8C7662]">Trạng thái:</span>{' '}
                {form.isDeceased
                  ? `Đã mất${form.deathDate ? ` (${form.deathDate}${form.deathDateLunar ? ` · ${form.deathDateLunar} ÂL` : ''})` : form.deathDateLunar ? ` (${form.deathDateLunar} ÂL)` : ' (chưa rõ ngày)'}`
                  : 'Còn sống'}
              </div>
              <div>
                <span className="text-[#8C7662]">Quan hệ:</span>{' '}
                {form.parentIds.length} cha/mẹ · {form.spouseIds.length} vợ/chồng · {form.childIds.length} con
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-[#FDF0EE] border border-[#C0392B]/25 text-[#C0392B] text-xs font-semibold">
            {error}
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#E8DFCF] bg-[#FAF6EE] flex items-center justify-between gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DDD0B8] bg-white hover:bg-[#EFE8DC]/50 text-xs font-semibold text-[#6B4E37] transition-colors cursor-pointer"
          >
            Hủy
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD0B8] bg-white hover:bg-[#EFE8DC]/50 text-xs font-semibold text-[#6B4E37] transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} /> Quay lại
          </button>
        )}

        <div className="flex items-center gap-2.5">
          {isEdit && step < STEPS.length && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-[#8B4513] bg-white hover:bg-[#8B4513]/5 text-xs font-semibold text-[#8B4513] transition-colors cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu ngay'}
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Tiếp tục <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2D572C] hover:bg-[#234522] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check size={14} />
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Hoàn tất & Thêm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) return cardContent;

  return (
    <div className="fixed inset-0 z-[300] bg-[#2C1810]/50 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6">
      {cardContent}
    </div>
  );
}

function RelationPicker({ label, value, members, exclude, onChange }) {
  const [open, setOpen] = useState(false);
  const opts = members.filter((m) => m.id !== exclude);
  const selected = opts.filter((m) => value.includes(m.id));

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        onClick={() => setOpen(!open)}
        className={`${inputCls} cursor-pointer flex items-center justify-between select-none min-h-[42px]`}
      >
        <span className={`text-sm truncate ${selected.length ? 'text-[#2C1810] font-medium' : 'text-[#A69380]'}`}>
          {selected.length ? selected.map((m) => m.fullName).join(', ') : `Chọn ${label.toLowerCase()}...`}
        </span>
        <ChevronDown size={15} className={`text-[#8C7662] transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="mt-1 border border-[#DDD0B8] rounded-xl max-h-44 overflow-y-auto bg-white shadow-sm divide-y divide-[#F2EDE4]">
          {opts.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer text-sm text-[#2C1810] hover:bg-[#FAF6EE] transition-colors"
            >
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#8B4513]"
                checked={value.includes(m.id)}
                onChange={(e) => onChange(m.id, e.target.checked)}
              />
              <span className="font-medium">{m.fullName}</span>
              <span className="text-xs text-[#8C7662]">(Đời {m.generation})</span>
            </label>
          ))}
          {opts.length === 0 && <div className="px-3.5 py-2.5 text-xs text-[#8C7662]">Chưa có thành viên nào</div>}
        </div>
      )}
    </div>
  );
}
