import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert caret notation to Unicode superscripts, e.g. x^2 → x², y^3 → y³
// Full set — for screen rendering (browsers support all Unicode superscript chars).
const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺',
};

export function toSuperscript(text: string): string {
  if (text.includes('$')) return text; // leave LaTeX untouched
  return text.replace(/\^\(?(-?[\d]+)\)?/g, (_, exp: string) =>
    exp.split('').map((c) => SUPERSCRIPTS[c] ?? c).join('')
  );
}
