import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useFamilyStore from '../../store/familyStore';
import useFamily from '../../hooks/useFamily';
import { useParams } from 'react-router-dom';
import MemberForm from '../../components/member/MemberForm';
import { exportTreeAsPdf, exportTreeAsSvg, exportTreeAsJson } from '../../utils/exportFamilyTree';
import {
  UserPlus, Download, Users, Layers, FileText, Calendar,
  TreePine, Maximize2, Minimize2, Crosshair, Minus, Plus,
  Pencil, CalendarDays, Heart, MapPin, User, ChevronRight,
  Clock, Edit3, Image as ImageIcon, CalendarCheck, Trash2, Settings as SettingsIcon, X
} from 'lucide-react';

const ACTIVITY_META = {
  member_add:    { icon: UserPlus,     color: '#2D572C' },
  member_edit:   { icon: Edit3,        color: '#8B4513' },
  member_delete: { icon: Trash2,       color: '#C0392B' },
  event_add:     { icon: CalendarCheck,color: '#C0392B' },
  event_edit:    { icon: CalendarDays, color: '#8B4513' },
  event_delete:  { icon: Trash2,       color: '#C0392B' },
  family_update: { icon: SettingsIcon, color: '#C8A96E' },
  document_add:  { icon: ImageIcon,    color: '#C8A96E' },
  other:         { icon: Clock,        color: '#6B4E37' },
};

function toJsDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatRelativeTime(ts) {
  const date = toJsDate(ts);
  if (!date) return 'Vừa xong';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek} tuần trước`;
  return date.toLocaleDateString('vi-VN');
}

const SPECIAL_ROLES = ['Trưởng họ', 'Trưởng chi', 'Trưởng nhánh'];

function getUsefulAgeTag(birthDate, deathDate, isDeceased = false, deathDateLunar = '') {
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : NaN;
  let deathYear = deathDate ? new Date(deathDate).getFullYear() : NaN;
  if (Number.isNaN(deathYear) && deathDateLunar) {
    const match = deathDateLunar.match(/(\d{4})/);
    if (match) deathYear = parseInt(match[1], 10);
  }
  const hasValidBirth = !Number.isNaN(birthYear) && birthYear > 0;
  const hasValidDeath = !Number.isNaN(deathYear) && deathYear > 0;

  if (isDeceased || deathDate || deathDateLunar) {
    if (hasValidBirth && hasValidDeath && deathYear >= birthYear) {
      return { label: `Thọ ${deathYear - birthYear} tuổi`, deceased: true };
    }
    return { label: 'Đã mất', deceased: true };
  }

  if (hasValidBirth) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age >= 0 && age <= 130) {
      return { label: `${age} tuổi`, deceased: false };
    }
  }
  return null;
}

// === Custom Node Styled to Match Warm Parchment Theme ===
function MemberNode({ data }) {
  const isSelected = data.selected;
  const isDeceased = !!(data.isDeceased || data.deathDate || data.deathDateLunar);
  const specialRole = SPECIAL_ROLES.includes(data.role) ? data.role : null;
  const ageTag = getUsefulAgeTag(data.birthDate, data.deathDate, isDeceased, data.deathDateLunar);

  return (
    <div
      onClick={data.onClick}
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 select-none w-[228px] h-[84px] ${
        isSelected
          ? 'bg-[#FFFDF9] ring-2 ring-[#8B4513] border border-[#C8A96E] shadow-md'
          : 'bg-[#FFFDF9] border border-[#DDD0B8] hover:border-[#C8A96E] hover:shadow-sm shadow-xs'
      }`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !w-2 !h-2 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0 !w-2 !h-2 !pointer-events-none" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-0 !w-2 !h-2 !pointer-events-none" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0 !w-2 !h-2 !pointer-events-none" />

      {/* Avatar with golden circular rim */}
      <div className="relative flex-shrink-0">
        <div
          className="w-11 h-11 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#F4EFE6]"
          style={{ borderColor: isSelected ? '#8B4513' : '#C8A96E' }}
        >
          {data.photo ? (
            <img src={data.photo} alt={data.fullName} className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-[#8B4513]" />
          )}
        </div>
      </div>

      {/* Member Details */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-bold text-[13px] text-[#2C1810] truncate leading-snug">
          {data.fullName}
        </div>

        {/* Special Title + Useful Age/Status Tag (single row) */}
        {(specialRole || ageTag) && (
          <div className="flex items-center gap-1 mt-1 whitespace-nowrap overflow-hidden">
            {specialRole && (
              <span className="inline-block text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2D572C] text-white shrink-0">
                {specialRole}
              </span>
            )}
            {ageTag && (
              <span
                className={`inline-block text-[9.5px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                  ageTag.deceased
                    ? 'bg-[#EFE8DC] text-[#6B4E37]'
                    : 'bg-[#EAF2EA] text-[#2D572C]'
                }`}
              >
                {ageTag.label}
              </span>
            )}
          </div>
        )}

        {/* Year range */}
        <div className="text-[11px] text-[#8C7662] mt-0.5 font-medium">
          ({data.birthDate ? new Date(data.birthDate).getFullYear() : '?'}
          {' – '}
          {data.deathDate ? new Date(data.deathDate).getFullYear() : (isDeceased ? '?' : 'nay')})
        </div>
      </div>

      {/* Quick relation add buttons on selected node */}
      {isSelected && data.canEdit && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild?.(data);
            }}
            title="Thêm con cho thành viên này"
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2D572C] text-white hover:bg-[#234522] shadow-sm whitespace-nowrap cursor-pointer"
          >
            + Con
          </button>
          {!(data.spouseIds && data.spouseIds.length > 0) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onAddSpouse?.(data);
              }}
              title="Thêm vợ/chồng cho thành viên này"
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#8B4513] text-white hover:bg-[#6B3410] shadow-sm whitespace-nowrap cursor-pointer"
            >
              + Vợ/Chồng
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GenLabelNode({ data }) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-[#DDD0B8] bg-[#F7F2E7] text-[#6B4E37] shadow-xs whitespace-nowrap pointer-events-none">
        {data.label}
      </div>
      {data.canEdit && data.genNum === 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddMember?.(1);
          }}
          title="Thêm thành viên thế hệ 1"
          className="pointer-events-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border border-dashed border-[#C8A96E] bg-[#FFFDF9] text-[#8B4513] hover:bg-[#8B4513] hover:text-white hover:border-[#8B4513] shadow-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus size={12} />
          <span>Thêm</span>
        </button>
      )}
    </div>
  );
}

const nodeTypes = { member: MemberNode, genLabel: GenLabelNode };

// Layout builder
const HSEP = 260;
const VSEP = 135;
const GEN_LABELS = ['Cụ tổ', 'Đời ông', 'Đời cha', 'Đời con', 'Đời cháu', 'Đời chắt'];

function buildGraph(
  members,
  selectedId,
  onSelect,
  canEdit = false,
  onAddMember = null,
  onAddChild = null,
  onAddSpouse = null
) {
  const byGen = {};
  members.forEach((m) => {
    const g = m.generation || 1;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(m);
  });

  // Order each generation so spouses sit adjacent
  const orderedByGen = {};
  let maxRowCount = 1;
  Object.entries(byGen).forEach(([gen, genMembers]) => {
    const visited = new Set();
    const ordered = [];
    genMembers.forEach((m) => {
      if (visited.has(m.id)) return;
      visited.add(m.id);
      ordered.push(m);
      (m.spouseIds || []).forEach((sid) => {
        const spouse = genMembers.find((x) => x.id === sid && !visited.has(x.id));
        if (spouse) {
          visited.add(spouse.id);
          ordered.push(spouse);
        }
      });
    });
    orderedByGen[gen] = ordered;
    if (ordered.length > maxRowCount) maxRowCount = ordered.length;
  });

  const nodes = [];
  const edges = [];
  const minTreeX = -((maxRowCount - 1) * HSEP) / 2;

  Object.entries(orderedByGen)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([gen, genMembers]) => {
      const genNum = parseInt(gen, 10);
      const yPos = (genNum - 1) * VSEP;
      const rowStartX = -((genMembers.length - 1) * HSEP) / 2;

      nodes.push({
        id: `gen-label-${genNum}`,
        type: 'genLabel',
        position: { x: minTreeX - 235, y: yPos + 24 },
        draggable: false,
        selectable: false,
        data: {
          genNum,
          canEdit,
          onAddMember,
          label: `Thế hệ ${genNum} (${GEN_LABELS[genNum - 1] || `Đời ${genNum}`})`,
        },
      });

      genMembers.forEach((m, i) => {
        nodes.push({
          id: m.id,
          type: 'member',
          position: { x: rowStartX + i * HSEP, y: yPos },
          data: {
            ...m,
            selected: m.id === selectedId,
            canEdit,
            onClick: () => onSelect(m.id),
            onAddChild,
            onAddSpouse,
          },
        });
      });
    });

  // Track rendered parent->child edges so spouse pairs don't draw duplicate lines to shared children
  const drawnChildEdges = new Set();

  members.forEach((m) => {
    // Parent -> Child edges
    (m.childIds || []).forEach((childId) => {
      if (!members.some((x) => x.id === childId)) return;
      // Skip if a spouse with smaller id already draws the edge to this child
      const primarySpouseDraws = (m.spouseIds || []).some((sid) => {
        const sp = members.find((x) => x.id === sid);
        return sp && sp.id < m.id && (sp.childIds || []).includes(childId);
      });
      if (primarySpouseDraws) return;

      const edgeKey = `${m.id}->${childId}`;
      if (drawnChildEdges.has(edgeKey)) return;
      drawnChildEdges.add(edgeKey);

      edges.push({
        id: `e-${m.id}-${childId}`,
        source: m.id,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#B8925A', width: 14, height: 14 },
        style: { stroke: '#C8A96E', strokeWidth: 2 },
      });
    });

    // Spouse connector with golden interlocking rings
    (m.spouseIds || []).forEach((spouseId) => {
      if (members.some((x) => x.id === spouseId) && m.id < spouseId) {
        edges.push({
          id: `e-spouse-${m.id}-${spouseId}`,
          source: m.id,
          target: spouseId,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'straight',
          style: { stroke: '#C8A96E', strokeWidth: 1.8, strokeDasharray: '4,4' },
          label: '⚭',
          labelStyle: { fontSize: 15, fill: '#8B4513', fontWeight: 'bold' },
          labelBgStyle: { fill: '#FAF6EE', fillOpacity: 0.95 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 6,
        });
      }
    });
  });

  return { nodes, edges };
}

// Tree view controls toolbar helper
function TreeFlowInner({ nodes, edges, onNodesChange, onEdgesChange, viewMode, isFullscreen, onToggleFullscreen }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: isFullscreen ? 0.14 : 0.18, duration: 300 });
    }, 60);
    return () => clearTimeout(timer);
  }, [viewMode, isFullscreen, fitView]);

  return (
    <div className="relative w-full h-full bg-[#FAF6EE]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        colorMode="light"
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        style={{ background: '#FAF6EE' }}
        minZoom={0.3}
        maxZoom={1.8}
      >
        <Background variant="dots" color="#D5C4A6" bgColor="#FAF6EE" gap={24} size={1.2} />
      </ReactFlow>

      {/* Floating Zoom / Center Controls */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 bg-[#FFFDF9]/95 border border-[#DDD0B8] rounded-xl px-2 py-1 shadow-sm">
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình'}
          className="p-1.5 text-[#6B4E37] hover:text-[#2C1810] hover:bg-[#F7F2E7] rounded-lg transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
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
          onClick={() => zoomOut({ duration: 200 })}
          className="p-1 text-[#6B4E37] hover:text-[#2C1810] rounded"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs font-semibold text-[#6B4E37] px-1 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomIn({ duration: 200 })}
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
  const { currentFamily, events, activities } = useFamilyStore();
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [defaultGen, setDefaultGen] = useState(1);
  const [formPreset, setFormPreset] = useState(null);
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'male'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    if (!showAllActivities) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [showAllActivities]);

  useEffect(() => {
    if (!isFullscreen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const handleAddAtGeneration = useCallback((genNum = 1) => {
    setEditMember(null);
    setFormPreset(null);
    setDefaultGen(genNum);
    setShowForm(true);
  }, []);

  const handleAddChild = useCallback((parent) => {
    const parentIds = [parent.id, ...(parent.spouseIds || [])];
    setEditMember(null);
    setDefaultGen((parent.generation || 1) + 1);
    setFormPreset({
      generation: (parent.generation || 1) + 1,
      parentIds,
      gender: 'male',
    });
    setShowForm(true);
  }, []);

  const handleAddSpouse = useCallback((member) => {
    setEditMember(null);
    setDefaultGen(member.generation || 1);
    setFormPreset({
      generation: member.generation || 1,
      spouseIds: [member.id],
      gender: member.gender === 'female' ? 'male' : 'female',
      role: member.gender === 'female' ? 'Chồng' : 'Vợ',
    });
    setShowForm(true);
  }, []);

  // Filter members based on viewMode ('full' = đầy đủ, 'male' = chỉ hiển thị đinh)
  const visibleMembers = useMemo(() => {
    if (viewMode === 'full') return members;
    return members.filter((m) => {
      if (m.gender === 'female') return false;
      const isSonInLaw = m.role && /rể|chồng/i.test(m.role) && !(m.parentIds?.length);
      return !isSonInLaw;
    });
  }, [members, viewMode]);

  // Default selection to first visible member if none selected or hidden by filter
  const activeMember = useMemo(() => {
    if (selectedMemberId) {
      return visibleMembers.find((m) => m.id === selectedMemberId) || visibleMembers[0] || null;
    }
    return visibleMembers[0] || null;
  }, [selectedMemberId, visibleMembers]);

  const maxGen = useMemo(() => {
    return visibleMembers.length ? Math.max(...visibleMembers.map((m) => m.generation || 1)) : 5;
  }, [visibleMembers]);

  const handleSelectMember = useCallback((id) => {
    setShowForm(false);
    setFormPreset(null);
    selectMember(id);
  }, [selectMember]);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(visibleMembers, activeMember?.id, handleSelectMember, userIsManager, handleAddAtGeneration, handleAddChild, handleAddSpouse),
    [visibleMembers, activeMember?.id, handleSelectMember, userIsManager, handleAddAtGeneration, handleAddChild, handleAddSpouse]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(visibleMembers, activeMember?.id, handleSelectMember, userIsManager, handleAddAtGeneration, handleAddChild, handleAddSpouse);
    setNodes(n);
    setEdges(e);
  }, [visibleMembers, activeMember?.id, handleSelectMember, userIsManager, handleAddAtGeneration, handleAddChild, handleAddSpouse]);

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
                  onClick={() => handleAddAtGeneration(1)}
                  className="btn-primary px-4 py-2 text-xs shadow-xs"
                >
                  <UserPlus size={15} /> Thêm thành viên
                </button>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  className="btn-secondary px-4 py-2 text-xs shadow-xs"
                >
                  <Download size={15} /> Xuất dữ liệu
                </button>
                {exportMenuOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] w-56 bg-[#FFFDF9] border border-[#DDD0B8] rounded-2xl shadow-lg p-1.5 z-50 flex flex-col gap-0.5">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C7662] border-b border-[#E8DFCF] mb-0.5">
                      Chế độ: {viewMode === 'male' ? 'Chỉ hiển thị đinh' : 'Đầy đủ'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExportMenuOpen(false);
                        exportTreeAsPdf({
                          familyName: currentFamily?.name || 'Nguyễn',
                          slug,
                          viewMode,
                          members: visibleMembers,
                          nodes,
                          edges,
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2C1810] hover:bg-[#FAF6EE] rounded-xl text-left cursor-pointer"
                    >
                      <FileText size={14} className="text-[#8B4513]" /> In / Lưu PDF cây gia phả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportMenuOpen(false);
                        exportTreeAsSvg({
                          familyName: currentFamily?.name || 'Nguyễn',
                          slug,
                          viewMode,
                          members: visibleMembers,
                          nodes,
                          edges,
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2C1810] hover:bg-[#FAF6EE] rounded-xl text-left cursor-pointer"
                    >
                      <ImageIcon size={14} className="text-[#2D572C]" /> Tải ảnh SVG cây gia phả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExportMenuOpen(false);
                        exportTreeAsJson({
                          familyName: currentFamily?.name || 'Nguyễn',
                          slug,
                          viewMode,
                          members: visibleMembers,
                        });
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2C1810] hover:bg-[#FAF6EE] rounded-xl text-left cursor-pointer"
                    >
                      <Download size={14} className="text-[#6B4E37]" /> Tải dữ liệu JSON
                    </button>
                  </div>
                )}
              </div>
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
        {/* LEFT COLUMN: Tree Graph & Timeline (8 cols, or Fullscreen overlay) */}
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-[200] flex flex-col bg-[#FAF6EE]'
              : 'lg:col-span-8 flex flex-col bg-white border border-[#DDD0B8] rounded-2xl shadow-sm overflow-hidden'
          }
        >
          {/* Tree Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[#DDD0B8] bg-[#FAF6EE]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D572C]/10 flex items-center justify-center text-[#2D572C]">
                <TreePine size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#2C1810]">
                  Cây gia phả dòng họ {currentFamily?.name || 'Nguyễn'}
                </h2>
                <div className="text-xs text-[#8C7662]">
                  {viewMode === 'full'
                    ? `Sơ đồ ${maxGen} thế hệ · ${visibleMembers.length} thành viên`
                    : `Sơ đồ ${maxGen} thế hệ · ${visibleMembers.length} đinh (trên tổng ${members.length} thành viên)`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center p-1 rounded-xl border border-[#DDD0B8] bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'full'
                      ? 'bg-[#2D572C] text-white shadow-xs'
                      : 'text-[#6B4E37] hover:bg-[#FAF6EE]'
                  }`}
                >
                  <Users size={13} />
                  Đầy đủ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('male')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'male'
                      ? 'bg-[#8B4513] text-white shadow-xs'
                      : 'text-[#6B4E37] hover:bg-[#FAF6EE]'
                  }`}
                >
                  <User size={13} />
                  Chỉ hiển thị đinh
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  isFullscreen
                    ? 'bg-[#8B4513] border-[#8B4513] text-white hover:bg-[#6B3410]'
                    : 'bg-white border-[#DDD0B8] text-[#6B4E37] hover:bg-[#F7F2E7] hover:text-[#2C1810]'
                }`}
                title={isFullscreen ? 'Thu nhỏ (Esc)' : 'Xem toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className={`flex-1 relative bg-[#FAF6EE] ${isFullscreen ? 'min-h-0' : 'min-h-[460px]'}`}>
            <ReactFlowProvider>
              <TreeFlowInner
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                viewMode={viewMode}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((v) => !v)}
              />
            </ReactFlowProvider>
          </div>

          {/* Bottom Timeline: "Dòng thời gian gia đình" (hidden in fullscreen) */}
          {!isFullscreen && (
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
          )}
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAddChild(activeMember)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2D572C]/10 text-[#2D572C] hover:bg-[#2D572C] hover:text-white text-xs font-semibold transition-colors"
                  >
                    + Con
                  </button>
                  {activeSpouses.length === 0 && (
                    <button
                      onClick={() => handleAddSpouse(activeMember)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513] hover:text-white text-xs font-semibold transition-colors"
                    >
                      + Vợ/Chồng
                    </button>
                  )}
                  <button
                    onClick={() => { setFormPreset(null); setEditMember(activeMember); setShowForm(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#DDD0B8] text-xs font-semibold text-[#6B4E37] hover:bg-[#FAF6EE] transition-colors"
                  >
                    <Pencil size={12} /> Sửa
                  </button>
                </div>
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
                      {activeMember.deathDate
                        ? new Date(activeMember.deathDate).getFullYear()
                        : (activeMember.isDeceased || activeMember.deathDateLunar ? '?' : 'nay')})
                    </div>
                  </div>
                </div>

                {/* Attributes table */}
                <div className="flex flex-col gap-2.5 text-xs text-[#2C1810] py-2 border-y border-[#DDD0B8]/60">
                  <div className="flex items-start gap-2.5">
                    <Calendar size={14} className="text-[#8C7662] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-[#8C7662]">Ngày sinh: </span>
                      <span className="font-semibold">{activeMember.birthDate || 'Chưa rõ'}</span>
                      {activeMember.birthDateLunar && (
                        <span className="text-[#8C7662]"> ({activeMember.birthDateLunar} ÂL)</span>
                      )}
                    </div>
                  </div>

                  {(activeMember.isDeceased || activeMember.deathDate || activeMember.deathDateLunar) && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-[#8C7662] font-serif font-bold text-sm leading-none ml-0.5">†</span>
                      <div className="flex-1 ml-0.5">
                        <span className="text-[#8C7662]">Ngày mất: </span>
                        <span className="font-semibold">
                          {activeMember.deathDate || (activeMember.deathDateLunar ? `${activeMember.deathDateLunar} (ÂL)` : 'Không rõ ngày (Đã mất)')}
                        </span>
                        {activeMember.deathDate && activeMember.deathDateLunar && (
                          <span className="text-[#8C7662]"> ({activeMember.deathDateLunar} ÂL)</span>
                        )}
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
              {activities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllActivities(true)}
                  className="text-xs font-semibold text-[#2D572C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả →
                </button>
              )}
            </div>

            <div className="pt-3 flex flex-col gap-3">
              {activities.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#8C7662]">
                  Chưa có hoạt động nào được ghi nhận
                </div>
              ) : (
                activities.slice(0, 4).map((act) => {
                  const meta = ACTIVITY_META[act.type] || ACTIVITY_META.other;
                  const IconComponent = meta.icon;
                  const canFocusMember = act.targetId && members.some((m) => m.id === act.targetId);
                  return (
                    <div
                      key={act.id}
                      onClick={() => canFocusMember && handleSelectMember(act.targetId)}
                      className={`flex items-start gap-3 text-xs rounded-xl p-1 -m-1 transition-colors ${
                        canFocusMember ? 'cursor-pointer hover:bg-[#FAF6EE]' : ''
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${meta.color}15` }}
                      >
                        <IconComponent size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2C1810] leading-snug">{act.title}</div>
                        <div className="text-[11px] text-[#8C7662] truncate mt-0.5">
                          {act.description}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#A69380] whitespace-nowrap">
                        {formatRelativeTime(act.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Activities Modal */}
      {showAllActivities && (
        <div className="fixed inset-0 z-[300] bg-[#2C1810]/50 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#FFFDF9] border border-[#DDD0B8] rounded-3xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8DFCF] bg-[#FAF6EE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[#2C1810] font-serif">Lịch sử hoạt động</h2>
                  <p className="text-xs text-[#8C7662]">{activities.length} hoạt động gần đây</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllActivities(false)}
                className="p-1.5 rounded-xl text-[#8C7662] hover:text-[#2C1810] hover:bg-[#EFE8DC]/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {activities.map((act) => {
                const meta = ACTIVITY_META[act.type] || ACTIVITY_META.other;
                const IconComponent = meta.icon;
                const canFocusMember = act.targetId && members.some((m) => m.id === act.targetId);
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (canFocusMember) {
                        handleSelectMember(act.targetId);
                        setShowAllActivities(false);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-2xl border border-[#E8DFCF] bg-white ${
                      canFocusMember ? 'cursor-pointer hover:border-[#C8A96E] hover:bg-[#FAF6EE]/60 transition-colors' : ''
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}15` }}
                    >
                      <IconComponent size={15} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[#2C1810]">{act.title}</span>
                        <span className="text-[11px] text-[#A69380] whitespace-nowrap">
                          {formatRelativeTime(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B4E37] mt-0.5">{act.description}</p>
                      {act.actorName && (
                        <div className="text-[11px] text-[#8C7662] mt-1">Thực hiện: {act.actorName}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          key={`${editMember?.id || 'new'}-${defaultGen}-${JSON.stringify(formPreset || {})}`}
          familyId={currentFamily?.id}
          members={members}
          initialData={editMember}
          defaultGeneration={defaultGen}
          preset={formPreset}
          onClose={() => { setShowForm(false); setFormPreset(null); }}
          onSaved={() => {
            setShowForm(false);
            setFormPreset(null);
            if (currentFamily?.id !== 'demo-nguyen-van') reload();
          }}
        />
      )}
    </div>
  );
}
