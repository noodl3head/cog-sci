// Official GATE XH-C5 (Psychology) appeared-candidate statistics.
// Values are the paper-wise mean, standard deviation, and appeared cohort
// published by each year's organising institute.
export const PYQ_RANK_PROJECTIONS = {
  2021: { mu: 32.60, sigma: 15.90, pop: 1141, topMark: 77.33 },
  2022: { mu: 47.22, sigma: 14.94, pop: 1933, topMark: 84 },
  2023: { mu: 37.93, sigma: 17.05, pop: 2684, topMark: 84 },
  2024: { mu: 38.52, sigma: 14.21, pop: 3415, topMark: 77.67 },
  2025: { mu: 49.40, sigma: 15.77, pop: 4125, topMark: 89 },
  2026: { mu: 27.81, sigma: 11.55, pop: 6178, topMark: 73 },
};

export function getPyqRankProjection(year) {
  const numericYear = Number(year);
  const projection = PYQ_RANK_PROJECTIONS[numericYear];
  if (!projection) {
    throw new Error(`No PYQ rank projection data for ${year}`);
  }
  return projection;
}
