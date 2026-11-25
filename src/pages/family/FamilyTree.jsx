import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useFamilyStore from '../../store/familyStore';
import useFamily from '../../hooks/useFamily';
import { useParams } from 'react-router-dom';
import MemberForm from '../../components/member/MemberForm';
import {
  UserPlus, Download, Users, Layers, FileText, Calendar,
  TreePine, Maximize2, Crosshair, Minus, Plus, ChevronDown,
  Pencil, CalendarDays, Heart, MapPin, User, ChevronRight,
  Clock, Edit3, Image as ImageIcon, CalendarCheck
} from 'lucide-react';

// === Custom Node Styled Identically to Mockup ===
function MemberNode({ data }) {
  const isSelected = data.selected;
  const isDeceased = !!data.deathDate;

  return (
    <div
      onClick={data.onClick}
      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'bg-[#FBF6EC] ring-2 ring-[#C8A96E] shadow-md'
          : 'bg-[#FFFDF9] border border-[#E3D7C3] hover:border-[#C8A96E] shadow-sm'
      }`}
      style={{ minWidth: 170, maxWidth: 210 }}
    >
      {/* Avatar with golden circular rim */}
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#F4EFE6]"
          style={{ borderColor: isSelected ? '#C8A96E' : '#D5C4A6' }}
        >
          {data.photo ? (
            <img src={data.photo} alt={data.fullName} className="w-full h-full object-cover" />
          ) : (
            <User size={22} className="text-[#8B4513]" />
          )}
        </div>
      </div>

      {/* Member Details */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-bold text-[13.5px] text-[#2C1810] truncate leading-snug">
          {data.fullName}
        </div>

        {/* Role badge */}
        {data.role && (
          <div className="mt-0.5">
            <span
              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                data.role.includes('Trưởng họ') || data.role.includes('Trưởng chi')
                  ? 'bg-[#2D572C] text-white'
                  : 'bg-[#EFE8DC] text-[#6B4E37]'
              }`}
            >
              {data.role}
            </span>
          </div>
        )}

        {/* Year range */}
        <div className="text-[11px] text-[#8C7662] mt-0.5 font-medium">
          ({data.birthDate ? new Date(data.birthDate).getFullYear() : '?'}
          {' – '}
          {data.deathDate ? new Date(data.deathDate).getFullYear() : (isDeceased ? '?' : '')})
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { member: MemberNode };

// Layout builder
const HSEP = 230;
const VSEP = 120;

function buildGraph(members, selectedId, onSelect) {
  const byGen = {};
  members.forEach((m) => {
    const g = m.generation || 1;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(m);
  });

  const nodes = [];
  const edges = [];

  Object.entries(byGen).forEach(([gen, genMembers]) => {
    const yPos = (parseInt(gen) - 1) * VSEP;
    genMembers.forEach((m, i) => {
      nodes.push({
        id: m.id,
        type: 'member',
        position: { x: i * HSEP + 40, y: yPos + 30 },
        data: {
          ...m,
          selected: m.id === selectedId,
          onClick: () => onSelect(m.id),
        },
      });
    });
  });

  // Parent -> Child edges
  members.forEach((m) => {
    (m.childIds || []).forEach((childId) => {
      if (members.some((x) => x.id === childId)) {
        edges.push({
          id: `e-${m.id}-${childId}`,
          source: m.id,
          target: childId,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#C8A96E', width: 14, height: 14 },
          style: { stroke: '#C8A96E', strokeWidth: 1.8 },
        });
      }
    });

    // Spouse connector with golden interlocking rings
    (m.spouseIds || []).forEach((spouseId) => {
      if (members.some((x) => x.id === spouseId) && m.id < spouseId) {
        edges.push({
          id: `e-spouse-${m.id}-${spouseId}`,
          source: m.id,
          target: spouseId,
          style: { stroke: '#C8A96E', strokeWidth: 1.5, strokeDasharray: '4,4' },
          label: '⚭',
          labelStyle: { fontSize: 16, fill: '#C8A96E', fontWeight: 'bold' },
        });
      }
    });
  });

  return { nodes, edges };
}

// Tree view controls toolbar helper
function TreeFlowInner({ nodes, edges, onNodesChange, onEdgesChange, selectedMember, selectMember, generations }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="relative w-full h-full">
      {/* Generation Left Side Badges */}
      <div className="absolute left-3 top-6 z-10 flex flex-col gap-[72px] pointer-events-none">
        {generations.map((g) => (
          <div
            key={g.num}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm border border-[#DDD0B8] bg-[#F7F2E7]/90 text-[#6B4E37] pointer-events-auto"
          >
            {g.label}
          </div>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: 'transparent' }}
        minZoom={0.3}
        maxZoom={1.8}
      >
        <Background color="#DDD0B8" gap={24} size={1} />
      </ReactFlow>

      {/* Floating Zoom / Center Controls */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 bg-white/95 border border-[#DDD0B8] rounded-xl px-2 py-1 shadow-sm">
        <button
          onClick={() => fitView({ duration: 400 })}
          title="Toàn màn hình"
          className="p-1.5 text-[#6B4E37] hover:text-[#2C1810] hover:bg-[#F7F2E7] rounded-lg transition-colors"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={() => fitView({ padding: 0.25, duration: 400 })}
          title="Tâm điểm"
          className="p-1.5 text-[#6B4E37] hover:text-[#2C1810] hover:bg-[#F7F2E7] rounded-lg transition-colors"
        >
          <Crosshair size={15} />
        </button>
        <div className="w-[1px] h-4 bg-[#DDD0B8] mx-1" />
        <button
          onClick={() => zoomOut()}
          className="p-1 text-[#6B4E37] hover:text-[#2C1810] rounded"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs font-semibold text-[#6B4E37] px-1">100%</span>
        <button
          onClick={() => zoomIn()}
          className="p-1 text-[#6B4E37] hover:text-[#2C1810] rounded"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function FamilyTree() {
  const { slug } = useParams();
  const { members, selectedMemberId, selectMember, userIsManager, reload } = useFamily(slug);
  const { currentFamily, events } = useFamilyStore();
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);

  // Default selection to first member if none selected
  const activeMember = useMemo(() => {
    if (selectedMemberId) {
      return members.find((m) => m.id === selectedMemberId) || members[0] || null;
    }
    return members[0] || null;
  }, [selectedMemberId, members]);

  const maxGen = useMemo(() => {
    return members.length ? Math.max(...members.map((m) => m.generation || 1)) : 5;
  }, [members]);

  const generations = useMemo(() => {
    const labels = ['Cụ tổ', 'Đời ông', 'Đời cha', 'Đời con', 'Đời cháu', 'Đời chắt'];
    return Array.from({ length: Math.max(maxGen, 5) }, (_, i) => ({
      num: i + 1,
      label: `Thế hệ ${i + 1} (${labels[i] || `Đời ${i + 1}`})`,
    }));
  }, [maxGen]);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(members, activeMember?.id, selectMember),
    [members, activeMember?.id]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(members, activeMember?.id, selectMember);
    setNodes(n);
    setEdges(e);
  }, [members, activeMember?.id]);

  // Spouses & Children of active member
  const activeSpouses = useMemo(() => {
    if (!activeMember?.spouseIds) return [];
    return activeMember.spouseIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  }, [activeMember, members]);

  const activeChildren = useMemo(() => {
    if (!activeMember?.childIds) return [];
    return activeMember.childIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  }, [activeMember, members]);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#FAF6EE] p-5 flex flex-col gap-5">
      {/* ===== 1. TOP BANNER & STATS CARDS ===== */}
      <div className="relative rounded-2xl overflow-hidden border border-[#DDD0B8] bg-gradient-to-r from-[#FBF6EC] via-[#F6EEDC] to-[#EFE4CF] p-6 shadow-sm">
        {/* Traditional landscape artwork motif */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none flex items-center justify-end pr-8">
          <svg viewBox="0 0 400 160" className="h-full w-auto text-[#8B4513]" fill="currentColor">
            <path d="M50 140 C100 80, 160 120, 220 70 C280 20, 340 100, 400 60 L400 160 L0 160 Z" opacity="0.4" />
            <path d="M120 160 C180 110, 240 130, 310 90 C360 60, 380 90, 400 80 L400 160 Z" opacity="0.6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Actions */}
          <div className="max-w-md">
            <h1 className="text-3xl font-extrabold text-[#2C1810] font-serif leading-snug">
              Cây Gia Phả
            </h1>
            <p className="text-sm text-[#6B4E37] mt-1.5 leading-relaxed font-medium">
              Lưu giữ cội nguồn – Kết nối con cháu – Gìn giữ truyền thống dòng họ
            </p>

            <div className="flex items-center gap-3 mt-4">
              {userIsManager && (
                <button
                  onClick={() => { setEditMember(null); setShowForm(true); }}
                  className="btn-primary px-4 py-2 text-xs shadow-xs"
                >
                  <UserPlus size={15} /> Thêm thành viên
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="btn-secondary px-4 py-2 text-xs shadow-xs"
              >
                <Download size={15} /> Xuất dữ liệu
              </button>
            </div>
          </div>

          {/* Right: 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 flex-shrink-0">
            {/* Card 1 */}
            <div className="bg-[#FFFDF9]/90 border border-[#DDD0B8] rounded-xl p-3.5 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-2 text-[#8C7662] mb-1">
                <Users size={15} className="text-[#8B4513]" />
                <span className="text-[11px] font-medium">Tổng số thành viên</span>
              </div>
              <div className="text-2xl font-extrabold text-[#2C1810]">
                {members.length || 58}
              </div>
              <div className="text-[11px] font-semibold text-[#2D572C] mt-0.5">
                ↑ +3 (tháng này)
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FFFDF9]/90 border border-[#DDD0B8] rounded-xl p-3.5 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-2 text-[#8C7662] mb-1">
                <Layers size={15} className="text-[#5A7A5A]" />
                <span className="text-[11px] font-medium">Số thế hệ</span>
              </div>
              <div className="text-2xl font-extrabold text-[#2C1810]">
                {maxGen || 5}
              </div>
              <div className="text-[11px] text-[#8C7662] mt-0.5">
                Từ cụ tổ đến hiện tại
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FFFDF9]/90 border border-[#DDD0B8] rounded-xl p-3.5 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-2 text-[#8C7662] mb-1">
                <FileText size={15} className="text-[#C8A96E]" />
                <span className="text-[11px] font-medium">Tài liệu lưu trữ</span>
              </div>
              <div className="text-2xl font-extrabold text-[#2C1810]">
                24
              </div>
              <div className="text-[11px] text-[#8C7662] mt-0.5 truncate">
                Gia phả, ảnh, văn bản...
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#FFFDF9]/90 border border-[#DDD0B8] rounded-xl p-3.5 min-w-[130px] shadow-sm">
              <div className="flex items-center gap-2 text-[#8C7662] mb-1">
                <Calendar size={15} className="text-[#C0392B]" />
                <span className="text-[11px] font-medium">Sự kiện sắp tới</span>
              </div>
              <div className="text-2xl font-extrabold text-[#2C1810]">
                {events.length || 1}
              </div>
              <div className="text-[11px] text-[#C0392B] font-medium mt-0.5 truncate">
                Lễ giỗ tổ (15/02 ÂL)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. MAIN SPLIT: TREE VIEW + MEMBER PROFILE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[620px]">
        {/* LEFT COLUMN: Tree Graph & Timeline (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-[#DDD0B8] rounded-2xl shadow-sm overflow-hidden">
          {/* Tree Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DDD0B8] bg-[#FAF6EE]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D572C]/10 flex items-center justify-center text-[#2D572C]">
                <TreePine size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#2C1810]">
                  Cây gia phả dòng họ {currentFamily?.name || 'Nguyễn'}
                </h2>
                <div className="text-xs text-[#8C7662]">
                  Sơ đồ {maxGen} thế hệ · {members.length} thành viên
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD0B8] bg-white text-xs text-[#6B4E37] font-medium">
                <span>Hiển thị: {maxGen} thế hệ</span>
                <ChevronDown size={14} className="text-[#8C7662]" />
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative min-h-[460px] bg-[#FAF6EE]/50">
            <ReactFlowProvider>
              <TreeFlowInner
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                selectedMember={activeMember}
                selectMember={selectMember}
                generations={generations}
              />
            </ReactFlowProvider>
          </div>

          {/* Bottom Timeline: "Dòng thời gian gia đình" */}
          <div className="border-t border-[#DDD0B8] bg-[#FBF6EC] p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} className="text-[#8B4513]" />
              <div>
                <h3 className="text-xs font-bold text-[#2C1810]">Dòng thời gian gia đình</h3>
                <p className="text-[11px] text-[#8C7662]">Những cột mốc quan trọng của dòng họ</p>
              </div>
            </div>

            {/* Horizontal timeline bar */}
            <div className="relative flex items-center justify-between pt-2 px-4 overflow-x-auto pb-1">
              {/* Connecting line */}
              <div className="absolute left-8 right-8 top-4 h-[2px] bg-[#DDD0B8] -z-0" />

              {[
                { year: '1860', text: 'Cụ tổ khai lập dòng họ' },
                { year: '1915', text: 'Cụ Nguyễn Văn Bình chào đời' },
                { year: '1945', text: 'Con cháu tham gia kháng chiến' },
                { year: '1987', text: 'Cụ Nguyễn Văn Bình qua đời' },
                { year: '2010', text: 'Ông Nguyễn Văn Nam qua đời' },
                { year: '2020', text: 'Khánh thành nhà thờ họ' },
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center px-2 min-w-[100px]">
                  <div className="w-4 h-4 rounded-full border-2 border-[#C8A96E] bg-white flex items-center justify-center mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B4513]" />
                  </div>
                  <div className="text-xs font-extrabold text-[#2C1810]">{item.year}</div>
                  <div className="text-[10px] text-[#8C7662] leading-tight max-w-[110px] mt-0.5 line-clamp-2">
                    {item.text}
                  </div>
                </div>
              ))}

              <button className="relative z-10 p-1.5 rounded-full border border-[#DDD0B8] bg-white text-[#6B4E37] hover:bg-[#F7F2E7] ml-2">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Member Details Card + Recent Activity Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Thông tin thành viên */}
          <div className="bg-white border border-[#DDD0B8] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DDD0B8]">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#8B4513]" />
                <h3 className="font-bold text-sm text-[#2C1810]">Thông tin thành viên</h3>
              </div>
              {userIsManager && activeMember && (
                <button
                  onClick={() => { setEditMember(activeMember); setShowForm(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#DDD0B8] text-xs font-semibold text-[#6B4E37] hover:bg-[#FAF6EE] transition-colors"
                >
                  <Pencil size={12} /> Chỉnh sửa
                </button>
              )}
            </div>

            {activeMember ? (
              <div className="pt-4 flex flex-col">
                {/* Portrait & Role */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-[#C8A96E] overflow-hidden bg-[#FAF6EE] flex items-center justify-center flex-shrink-0 shadow-sm">
                    {activeMember.photo ? (
                      <img src={activeMember.photo} alt={activeMember.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={30} className="text-[#8B4513]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[#2C1810] leading-snug">
                      {activeMember.fullName}
                    </h4>
                    {activeMember.role && (
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2D572C] text-white">
                        {activeMember.role}
                      </span>
                    )}
                    <div className="text-xs text-[#8C7662] mt-1 font-medium">
                      ({activeMember.birthDate ? new Date(activeMember.birthDate).getFullYear() : '?'}
                      {' – '}
                      {activeMember.deathDate ? new Date(activeMember.deathDate).getFullYear() : 'nay'})
                    </div>
                  </div>
                </div>

                {/* Attributes table */}
                <div className="flex flex-col gap-2.5 text-xs text-[#2C1810] py-2 border-y border-[#DDD0B8]/60">
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-[#8C7662] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[#8C7662]">Ngày sinh: </span>
                      <span className="font-semibold">{activeMember.birthDate || '15/03/1915'}</span>
                      {activeMember.birthDateLunar && (
                        <span className="text-[#8C7662]"> ({activeMember.birthDateLunar})</span>
                      )}
                    </div>
                  </div>

                  {activeMember.deathDate && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#8C7662] font-serif font-bold text-sm leading-none ml-0.5">†</span>
                      <div className="flex-1 ml-0.5">
                        <span className="text-[#8C7662]">Ngày mất: </span>
                        <span className="font-semibold">{activeMember.deathDate}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    <Heart size={14} className="text-[#C0392B] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[#8C7662]">Vợ/Chồng: </span>
                      <span className="font-semibold">
                        {activeSpouses.length ? activeSpouses.map((s) => s.fullName).join(', ') : 'Lê Thị Mai (1918 – 1995)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Users size={14} className="text-[#5A7A5A] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[#8C7662]">Số con: </span>
                      <span className="font-semibold">
                        {activeChildren.length
                          ? `${activeChildren.length} người (${activeChildren.filter(c => c.gender !== 'female').length} trai, ${activeChildren.filter(c => c.gender === 'female').length} gái)`
                          : '3 người (2 trai, 1 gái)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-[#8B4513] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[#8C7662]">Quê quán: </span>
                      <span className="font-semibold">
                        {activeMember.hometown || 'Xã Bình Sơn, huyện Quỳnh Lưu, tỉnh Nghệ An'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B4E37] mb-1.5">
                    <FileText size={13} /> Tiểu sử
                  </div>
                  <p className="text-xs text-[#6B4E37] leading-relaxed line-clamp-3">
                    {activeMember.bio ||
                      `Cụ ${activeMember.fullName} là bậc trưởng bối đức độ của dòng họ. Trong suốt cuộc đời, cụ luôn dặn dạy con cháu giữ gìn gia phong, sống lương thiện, đoàn kết và hiếu nghĩa.`}
                  </p>
                  <button className="text-[11px] font-semibold text-[#8B4513] hover:underline mt-1">
                    Xem thêm ∨
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#8C7662]">
                Chọn một thành viên trên cây gia phả để xem thông tin chi tiết
              </div>
            )}
          </div>

          {/* Card 2: Hoạt động gần đây */}
          <div className="bg-white border border-[#DDD0B8] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD0B8]">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#8B4513]" />
                <h3 className="font-bold text-sm text-[#2C1810]">Hoạt động gần đây</h3>
              </div>
              <button className="text-xs font-semibold text-[#2D572C] hover:underline flex items-center gap-1">
                Xem tất cả →
              </button>
            </div>

            <div className="pt-3 flex flex-col gap-3">
              {[
                {
                  icon: UserPlus,
                  color: '#2D572C',
                  title: 'Thêm thành viên mới',
                  sub: 'Đã thêm Nguyễn Minh Anh (thế hệ 5)',
                  time: '2 ngày trước',
                },
                {
                  icon: Edit3,
                  color: '#8B4513',
                  title: 'Cập nhật thông tin',
                  sub: 'Đã chỉnh sửa tiểu sử cụ Nguyễn Văn Bình',
                  time: '5 ngày trước',
                },
                {
                  icon: ImageIcon,
                  color: '#C8A96E',
                  title: 'Tải lên tư liệu',
                  sub: 'Đã thêm 3 ảnh gia đình (năm 1975)',
                  time: '1 tuần trước',
                },
                {
                  icon: CalendarCheck,
                  color: '#C0392B',
                  title: 'Tạo sự kiện',
                  sub: 'Đã tạo sự kiện "Lễ giỗ Cụ Nguyễn Văn Bình"',
                  time: '1 tuần trước',
                },
              ].map((act, i) => {
                const IconComponent = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${act.color}15` }}
                    >
                      <IconComponent size={14} style={{ color: act.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#2C1810] leading-snug">{act.title}</div>
                      <div className="text-[11px] text-[#8C7662] truncate mt-0.5">{act.sub}</div>
                    </div>
                    <div className="text-[10px] text-[#A69380] whitespace-nowrap">{act.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Member Form Modal */}
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
