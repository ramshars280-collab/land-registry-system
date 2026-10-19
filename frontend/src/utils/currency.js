/**
 * Currency Conversion and Display Utility (INR <-> ETH)
 * Standard exchange benchmark: 1 ETH = ₹2,50,000 INR
 */

export const ETH_TO_INR_RATE = 250000;

/**
 * Convert ETH to INR
 */
export function ethToInr(ethAmount) {
  const num = parseFloat(ethAmount);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * ETH_TO_INR_RATE);
}

/**
 * Convert INR to ETH (up to 4 decimal places)
 */
export function inrToEth(inrAmount) {
  const num = parseFloat(inrAmount);
  if (isNaN(num) || num <= 0) return 0;
  return parseFloat((num / ETH_TO_INR_RATE).toFixed(4));
}

/**
 * Format INR with Indian currency grouping (e.g. ₹18,75,000)
 */
export function formatInr(amount, compact = false) {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return "₹0";

  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format dual currency: Primary INR, Secondary ETH
 * Returns { inr: "₹18,75,000", compactInr: "₹18.75 Lakh", eth: "7.5 ETH", display: "₹18,75,000 (7.5 ETH)" }
 */
export function formatPriceDual(ethAmount) {
  const eth = parseFloat(ethAmount) || 0;
  const inr = ethToInr(eth);
  const formattedInr = formatInr(inr);

  return {
    inrRaw: inr,
    inr: formattedInr,
    compactInr: formatInr(inr, true),
    eth: `${eth} ETH`,
    display: `${formattedInr} (${eth} ETH)`,
  };
}
