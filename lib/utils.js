import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value, decimals = 2) {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return '—';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
