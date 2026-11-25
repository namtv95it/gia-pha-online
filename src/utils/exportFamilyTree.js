const escapeXml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const SPECIAL_ROLES = ['Trưởng họ', 'Trưởng chi', 'Trưởng nhánh'];

function getAgeLabel(m) {
  const birthYear = m.birthDate ? new Date(m.birthDate).getFullYear() : NaN;
  let deathYear = m.deathDate ? new Date(m.deathDate).getFullYear() : NaN;
  if (Number.isNaN(deathYear) && m.deathDateLunar) {
    const match = m.deathDateLunar.match(/(\d{4})/);
    if (match) deathYear = parseInt(match[1], 10);
  }
  const hasValidBirth = !Number.isNaN(birthYear) && birthYear > 0;
  const hasValidDeath = !Number.isNaN(deathYear) && deathYear > 0;
  const isDeceased = !!(m.isDeceased || m.deathDate || m.deathDateLunar);

  if (isDeceased) {
    if (hasValidBirth && hasValidDeath && deathYear >= birthYear) {
      return { text: `Thọ ${deathYear - birthYear} tuổi`, deceased: true };
    }
    return { text: 'Đã mất', deceased: true };
  }
  if (hasValidBirth) {
    const age = new Date().getFullYear() - birthYear;
    if (age >= 0 && age <= 130) return { text: `${age} tuổi`, deceased: false };
  }
  return null;
}

/**
 * Tạo chuỗi SVG cho cây gia phả theo chế độ hiển thị hiện tại
 */
export function buildTreeSvg({ familyName, viewMode, members, nodes, edges }) {
  const CARD_W = 228;
  const CARD_H = 84;
  const GEN_W = 155;
  const GEN_H = 30;
  const PAD = 48;
  const HEADER_H = 72;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const w = n.type === 'genLabel' ? GEN_W : CARD_W;
    const h = n.type === 'genLabel' ? GEN_H : CARD_H;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  });

  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 600;
    maxY = 300;
  }

  const width = Math.max(760, maxX - minX + PAD * 2);
  const height = maxY - minY + PAD * 2 + HEADER_H;
  const offsetX = PAD - minX + Math.max(0, (width - (maxX - minX + PAD * 2)) / 2);
  const offsetY = PAD + HEADER_H - minY;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const maxGen = members.length ? Math.max(...members.map((m) => m.generation || 1)) : 1;
  const modeText = viewMode === 'male' ? 'Chỉ hiển thị đinh' : 'Đầy đủ';
  const countText = viewMode === 'male' ? `${members.length} đinh` : `${members.length} thành viên`;

  const edgeSvg = edges
    .map((e) => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (!src || !tgt) return '';

      if (e.id.startsWith('e-spouse-')) {
        const x1 = src.position.x + CARD_W + offsetX;
        const y1 = src.position.y + CARD_H / 2 + offsetY;
        const x2 = tgt.position.x + offsetX;
        const y2 = tgt.position.y + CARD_H / 2 + offsetY;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#C8A96E" stroke-width="1.8" stroke-dasharray="4,4" />
          <circle cx="${mx}" cy="${my}" r="10" fill="#FAF6EE" />
          <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="13" font-weight="bold" fill="#8B4513">⚭</text>
        `;
      }

      const sx = src.position.x + CARD_W / 2 + offsetX;
      const sy = src.position.y + CARD_H + offsetY;
      const tx = tgt.position.x + CARD_W / 2 + offsetX;
      const ty = tgt.position.y + offsetY;
      const midY = (sy + ty) / 2;
      return `
        <path d="M ${sx} ${sy} V ${midY} H ${tx} V ${ty - 5}" fill="none" stroke="#C8A96E" stroke-width="2" />
        <polygon points="${tx - 4},${ty - 7} ${tx + 4},${ty - 7} ${tx},${ty}" fill="#B8925A" />
      `;
    })
    .join('\n');

  const nodeSvg = nodes
    .map((n) => {
      const x = n.position.x + offsetX;
      const y = n.position.y + offsetY;

      if (n.type === 'genLabel') {
        return `
          <rect x="${x}" y="${y}" width="${GEN_W}" height="${GEN_H}" rx="10" fill="#F7F2E7" stroke="#DDD0B8" />
          <text x="${x + 12}" y="${y + 19}" font-size="11" font-weight="600" fill="#6B4E37">${escapeXml(n.data.label)}</text>
        `;
      }

      const m = n.data;
      const isDeceased = !!(m.isDeceased || m.deathDate || m.deathDateLunar);
      const birthY = m.birthDate ? new Date(m.birthDate).getFullYear() : '?';
      const deathY = m.deathDate ? new Date(m.deathDate).getFullYear() : isDeceased ? '?' : 'nay';
      const years = `(${Number.isNaN(birthY) ? '?' : birthY} – ${Number.isNaN(deathY) ? '?' : deathY})`;
      const specialRole = SPECIAL_ROLES.includes(m.role) ? m.role : null;
      const ageTag = getAgeLabel(m);
      const initial = (m.fullName || '?').trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '?';

      let badgeX = x + 64;
      let badgesSvg = '';
      if (specialRole) {
        const bw = specialRole.length * 6 + 14;
        badgesSvg += `
          <rect x="${badgeX}" y="${y + 34}" width="${bw}" height="17" rx="8.5" fill="#2D572C" />
          <text x="${badgeX + bw / 2}" y="${y + 46}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#FFFFFF">${escapeXml(specialRole)}</text>
        `;
        badgeX += bw + 4;
      }
      if (ageTag) {
        const aw = ageTag.text.length * 5.6 + 14;
        const fill = ageTag.deceased ? '#EFE8DC' : '#EAF2EA';
        const color = ageTag.deceased ? '#6B4E37' : '#2D572C';
        badgesSvg += `
          <rect x="${badgeX}" y="${y + 34}" width="${aw}" height="17" rx="8.5" fill="${fill}" />
          <text x="${badgeX + aw / 2}" y="${y + 46}" text-anchor="middle" font-size="9.5" font-weight="500" fill="${color}">${escapeXml(ageTag.text)}</text>
        `;
      }

      return `
        <rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="14" fill="#FFFDF9" stroke="#DDD0B8" stroke-width="1.2" />
        <circle cx="${x + 34}" cy="${y + CARD_H / 2}" r="20" fill="#F4EFE6" stroke="#C8A96E" stroke-width="1.8" />
        <text x="${x + 34}" y="${y + CARD_H / 2 + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#8B4513">${escapeXml(initial)}</text>
        <text x="${x + 64}" y="${y + 26}" font-size="12.5" font-weight="700" fill="#2C1810">${escapeXml(m.fullName)}</text>
        ${badgesSvg}
        <text x="${x + 64}" y="${y + (specialRole || ageTag ? 69 : 50)}" font-size="10.5" fill="#8C7662">${escapeXml(years)}</text>
      `;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif">
  <rect width="100%" height="100%" fill="#FAF6EE" />
  <text x="${width / 2}" y="38" text-anchor="middle" font-size="22" font-weight="800" fill="#2C1810">Cây Gia Phả Dòng Họ ${escapeXml(familyName)}</text>
  <text x="${width / 2}" y="60" text-anchor="middle" font-size="12" fill="#6B4E37">Chế độ: ${escapeXml(modeText)} · Sơ đồ ${maxGen} thế hệ · ${escapeXml(countText)}</text>
  <line x1="${PAD}" y1="76" x2="${width - PAD}" y2="76" stroke="#DDD0B8" stroke-width="1" />
  ${edgeSvg}
  ${nodeSvg}
</svg>`;
}

export function exportTreeAsPdf(params) {
  const svg = buildTreeSvg(params);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Cây Gia Phả Dòng Họ ${escapeXml(params.familyName)}</title>
  <style>
    body { margin: 0; padding: 16px; background: #FAF6EE; display: flex; justify-content: center; }
    svg { max-width: 100%; height: auto; }
    @media print { body { padding: 0; background: #FAF6EE; } }
  </style>
</head>
<body>${svg}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

export function exportTreeAsSvg(params) {
  const svg = buildTreeSvg(params);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const suffix = params.viewMode === 'male' ? 'chi-hien-thi-dinh' : 'day-du';
  a.href = url;
  a.download = `cay-gia-pha-${params.slug || 'dong-ho'}-${suffix}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTreeAsJson({ familyName, slug, viewMode, members }) {
  const payload = {
    familyName,
    slug,
    viewMode: viewMode === 'male' ? 'Chỉ hiển thị đinh' : 'Đầy đủ',
    exportedAt: new Date().toISOString(),
    totalMembers: members.length,
    members: members.map(({ photo: _photo, ...rest }) => rest),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const suffix = paramsSuffix(viewMode);
  a.href = url;
  a.download = `cay-gia-pha-${slug || 'dong-ho'}-${suffix}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function paramsSuffix(viewMode) {
  return viewMode === 'male' ? 'chi-hien-thi-dinh' : 'day-du';
}
