const fs = require('fs');
const fp = 'src/pages/RodaDaVidaReportPage.jsx';
let f = fs.readFileSync(fp, 'utf-8');
fs.copyFileSync(fp, fp + '.bak-' + Date.now());

// Substituir o componente RodaChart inteiro
const oldStart = "function RodaChart({ scores }) {";
const oldEnd = "}\n\nfunction Section";

const oldChartBlock = f.substring(
  f.indexOf(oldStart),
  f.indexOf(oldEnd)
);

const newChart = `function RodaChart({ scores }) {
  const size = 400;
  const center = size / 2;
  const maxRadius = 170;
  const areas = Object.keys(scores);
  const count = areas.length;
  if (count === 0) return null;

  const sliceAngle = (2 * Math.PI) / count;

  const areaColorMap = {
    saude: '#E63946', intelectual: '#4c6ef5', emocional: '#7c3aed', proposito: '#F4A261',
    financas: '#059669', contribuicao: '#2A9D8F', familia: '#ec4899', relacionamento: '#f472b6',
    social: '#f59e0b', diversao: '#8b5cf6', plenitude: '#d4a853', espiritualidade: '#a78bfa',
  };

  // Build pie slices
  const slices = areas.map((area, i) => {
    const startAngle = sliceAngle * i - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const r = maxRadius * (scores[area] / 10);
    const x1 = center + Math.cos(startAngle) * r;
    const y1 = center + Math.sin(startAngle) * r;
    const x2 = center + Math.cos(endAngle) * r;
    const y2 = center + Math.sin(endAngle) * r;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = 'M ' + center + ' ' + center + ' L ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
    const color = areaColorMap[area] || '#d4a853';

    // Label position (at 75% of max radius, middle of slice)
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = maxRadius + 20;
    const lx = center + Math.cos(midAngle) * labelR;
    const ly = center + Math.sin(midAngle) * labelR;

    // Score position
    const scoreR = Math.max(r * 0.6, 25);
    const sx = center + Math.cos(midAngle) * scoreR;
    const sy = center + Math.sin(midAngle) * scoreR;

    const label = (areaLabels[area] || area).split(' ').slice(0, 2).join(' ');

    return { path, color, area, score: scores[area], lx, ly, sx, sy, midAngle, label };
  });

  // Grid circles
  const gridCircles = [2, 4, 6, 8, 10].map(v => ({
    r: maxRadius * v / 10,
    label: v,
  }));

  // Grid lines (spokes)
  const spokes = areas.map((_, i) => {
    const angle = sliceAngle * i - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * maxRadius,
      y: center + Math.sin(angle) * maxRadius,
    };
  });

  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / count * 10) / 10;

  return (
    <svg viewBox={"0 0 " + size + " " + size} className="w-full max-w-[400px] mx-auto">
      {/* Grid circles */}
      {gridCircles.map(g => (
        <circle key={g.r} cx={center} cy={center} r={g.r} fill="none" stroke="rgba(61,56,48,0.2)" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}

      {/* Outer ring */}
      <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="rgba(61,56,48,0.4)" strokeWidth="1" />

      {/* Spokes */}
      {spokes.map((s, i) => (
        <line key={i} x1={center} y1={center} x2={s.x} y2={s.y} stroke="rgba(61,56,48,0.15)" strokeWidth="0.5" />
      ))}

      {/* Pie slices */}
      {slices.map(s => (
        <path key={s.area} d={s.path} fill={s.color} fillOpacity="0.75" stroke={s.color} strokeWidth="1.5" />
      ))}

      {/* Center circle with average */}
      <circle cx={center} cy={center} r="28" fill="#0f0f0f" stroke="rgba(61,56,48,0.4)" strokeWidth="1" />
      <text x={center} y={center + 1} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="800" fill="#d4a853">{avg}</text>
      <text x={center} y={center + 13} textAnchor="middle" fontSize="6" fill="#bfb5a8" fontWeight="500">MÉDIA</text>

      {/* Score labels inside slices */}
      {slices.map(s => (
        <text key={s.area + '_score'} x={s.sx} y={s.sy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
          {s.score}
        </text>
      ))}

      {/* Area labels outside */}
      {slices.map(s => {
        const isRight = s.lx > center;
        const isBottom = s.ly > center;
        return (
          <text key={s.area + '_label'} x={s.lx} y={s.ly} textAnchor={Math.abs(s.lx - center) < 10 ? 'middle' : isRight ? 'start' : 'end'} dominantBaseline={Math.abs(s.ly - center) < 10 ? 'middle' : isBottom ? 'hanging' : 'auto'} fontSize="9" fontWeight="600" fill={s.color}>
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}`;

if (f.includes(oldStart)) {
  f = f.replace(oldChartBlock, newChart);
  fs.writeFileSync(fp, f);
  console.log('OK: RodaChart substituido por formato pizza');
} else {
  console.log('SKIP: RodaChart nao encontrado');
}
