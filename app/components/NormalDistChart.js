import { ND_MU, ND_POP, ND_SIGMA, scoreRank } from '../../lib/scoreRank';

function pdf(x, mu, sigma) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function tierColor(pct) {
  if (pct >= 75) return '#23a55a';
  if (pct >= 40) return '#f0b232';
  return '#f23f43';
}

export function NormalDistChart({
  score, label = 'You',
  mu = ND_MU, sigma = ND_SIGMA, total = 50, pop = ND_POP, topMark = null, basis = 'modelled',
}) {
  const s = Math.max(0, Math.min(total, score));
  const { pct, rank } = scoreRank(s, { mu, sigma, total, pop, topMark });
  const color = tierColor(pct);

  // SVG layout
  const W = 500, H = 155;
  const PL = 8, PR = 8, PT = 26, PB = 26;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const peakY = pdf(mu, mu, sigma);
  const sx = (x) => PL + (x / total) * innerW;
  const sy = (y) => PT + (1 - y / peakY) * innerH;
  const base = sy(0);

  // Curve: 300 sample points across [0, 50]
  const N = 300;
  const allPts = Array.from({ length: N + 1 }, (_, i) => {
    const x = (i / N) * total;
    return [sx(x), sy(pdf(x, mu, sigma))];
  });

  const curvePath = 'M ' + allPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');

  // Shaded area under curve left of score
  const scoreXPx = sx(s);
  const cutIdx = Math.round((s / total) * N);
  let shade = `M ${sx(0).toFixed(1)},${base.toFixed(1)}`;
  for (let i = 0; i <= cutIdx; i++) {
    const [x, y] = allPts[i];
    shade += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  // Interpolate the exact score point
  shade += ` L ${scoreXPx.toFixed(1)},${sy(pdf(s, mu, sigma)).toFixed(1)}`;
  shade += ` L ${scoreXPx.toFixed(1)},${base.toFixed(1)} Z`;

  // Score label: shift anchor near edges to avoid clipping
  const rel = s / total;
  const anchor = rel < 0.12 ? 'start' : rel > 0.88 ? 'end' : 'middle';
  const lx = rel < 0.12 ? scoreXPx + 4 : rel > 0.88 ? scoreXPx - 4 : scoreXPx;

  return (
    <div className="nd-wrap">
      <div className="nd-header-row">
        <span className="nd-heading">Projected Score Distribution</span>
        <span className="nd-sub">{basis} cohort of {pop.toLocaleString()} · μ={mu} · σ={sigma}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="nd-svg">
        {/* Shaded region (better-than-you crowd) */}
        <path d={shade} fill={color} fillOpacity="0.2" />

        {/* Bell curve */}
        <path d={curvePath} fill="none" stroke="#5865F2" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Mean dashed line */}
        <line x1={sx(mu)} y1={PT + 6} x2={sx(mu)} y2={base}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={sx(mu)} y={base + 17}
          fill="#6d6f78" textAnchor="middle" fontSize="10" fontFamily="inherit">
          μ={mu}
        </text>

        {/* Score vertical line */}
        <line x1={scoreXPx} y1={PT - 2} x2={scoreXPx} y2={base}
          stroke={color} strokeWidth="2" />

        {/* Score label above */}
        <text x={lx} y={PT - 8}
          fill={color} textAnchor={anchor} fontSize="12" fontWeight="700" fontFamily="inherit">
          {label}: {score.toFixed(2)}
        </text>

        {/* Baseline */}
        <line x1={PL} y1={base} x2={W - PR} y2={base}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={sx(0)} y={base + 17}
          fill="#6d6f78" textAnchor="middle" fontSize="10" fontFamily="inherit">0</text>
        <text x={sx(total)} y={base + 17}
          fill="#6d6f78" textAnchor="middle" fontSize="10" fontFamily="inherit">{total}</text>
      </svg>

      <div className="nd-stats-row">
        <div className="nd-stat">
          <span className="nd-stat-val" style={{ color }}>{pct.toFixed(1)}th</span>
          <span className="nd-stat-label">Projected percentile</span>
        </div>
        <div className="nd-stat">
          <span className="nd-stat-val" style={{ color }}>~{rank.toLocaleString()}</span>
          <span className="nd-stat-label">Projected rank / {pop.toLocaleString()}</span>
        </div>
        <div className="nd-stat nd-stat-grow">
          <span className="nd-stat-val">
            Modelled above <b style={{ color }}>{Math.floor(pct)}%</b> of the projected cohort
          </span>
        </div>
      </div>
    </div>
  );
}
