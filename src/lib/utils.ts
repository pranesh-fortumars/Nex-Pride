import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats numbers into compact Indian/International notation
 * 1,000 -> 1k
 * 100,000 -> 1L (Lakh)
 * 1,000,000 -> 10L or 1M depending on locale.
 * We use en-IN for Tirupur context to support Lakhs (L).
 */
export function formatCompactNumber(number: number) {
  if (number === undefined || number === null) return "0";
  
  // Use Indian locale for Lakhs (L) support
  return Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}
