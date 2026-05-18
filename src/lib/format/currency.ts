export function formatInr(amount: number, compact = false) {
  if (compact && amount >= 1_000_000) {
    return `₹${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
