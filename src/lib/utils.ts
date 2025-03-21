import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a throttled function that only invokes the provided function at most once per every `wait` milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      return func(...args);
    }
  };
}
