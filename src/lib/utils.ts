import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Robust date parsing for Broadway reports which often use DD-MM-YYYY or other variants
 */
export const parseBroadwayDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  
  // Try ISO first
  let date = new Date(dateStr);
  if (isValid(date)) return date;

  // Try common Indian format DD-MM-YYYY
  try {
    date = parse(dateStr, "dd-MM-yyyy", new Date());
    if (isValid(date)) return date;
  } catch (e) {}

  // Try DD/MM/YYYY
  try {
    date = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(date)) return date;
  } catch (e) {}

  // Try MM/DD/YYYY
  try {
    date = parse(dateStr, "MM/dd/yyyy", new Date());
    if (isValid(date)) return date;
  } catch (e) {}

  return new Date();
};
