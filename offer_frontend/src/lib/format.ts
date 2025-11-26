export const formatCrLakh = (value: number | null | undefined): string => {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  if (abs >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)}Cr`;
  return `₹${(num / 1_00_000).toFixed(2)}L`;
};

export const formatINRFull = (value: number | null | undefined, fractionDigits: number = 0): string => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(num).replace(/^/, '₹');
};
