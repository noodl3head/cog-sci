export const ND_MU = 25;
export const ND_SIGMA = 8;
export const ND_POP = 4500;

// Abramowitz & Stegun approximation (max error 1.5×10⁻⁷).
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-a * a));
}

function normalCDF(x, mu, sigma) {
  return (1 + erf((x - mu) / (sigma * Math.sqrt(2)))) / 2;
}

// Returns a projected percentile and rank. When an official maximum mark is
// supplied, that observed AIR-1 boundary overrides the theoretical normal tail.
export function scoreRank(score, {
  mu = ND_MU,
  sigma = ND_SIGMA,
  total = 50,
  pop = ND_POP,
  topMark = null,
} = {}) {
  const boundedScore = Math.max(0, Math.min(total, score));

  if (Number.isFinite(topMark) && boundedScore >= topMark) {
    return { pct: ((pop - 1) / pop) * 100, rank: 1 };
  }

  const pct = normalCDF(boundedScore, mu, sigma) * 100;
  const rank = Math.max(1, Math.min(pop, Math.round((1 - pct / 100) * pop)));
  return { pct, rank };
}
