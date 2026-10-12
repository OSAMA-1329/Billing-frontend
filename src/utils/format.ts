export function formatCurrency(value: number, symbol = '₹') {
  return `${symbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-IN');
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computeRoundOff(total: number) {
  const finalTotal = Math.round(total);
  return { roundOff: round2(finalTotal - total), finalTotal };
}
