import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 组合并合并 UnoCSS / Tailwind 类名，解决条件类名和冲突问题
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
