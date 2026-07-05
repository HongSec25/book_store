/** Fixed approximate rate — Cambodia doesn't peg USD/KHR exactly, and a live
 * FX API is overkill for a portfolio project. Update if you want a fresher rate. */
export const USD_TO_KHR_RATE = 4100;

export function formatUSD(amount) {
  return `$${amount.toFixed(2)}`;
}

export function formatKHR(amount) {
  const khr = Math.round(amount * USD_TO_KHR_RATE);
  return `៛${khr.toLocaleString("en-US")}`;
}

/** e.g. "$18.00 (៛73,800)" — the standard dual-currency display used across the site. */
export function formatDual(amount) {
  return `${formatUSD(amount)} (${formatKHR(amount)})`;
}
