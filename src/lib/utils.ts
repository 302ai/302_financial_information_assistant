import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Concurrency control function
export async function concurrentMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const running: Promise<void>[] = [];

  for (const item of items) {
    const p = fn(item).then(result => {
      results.push(result);
    });
    running.push(p);
    if (running.length >= concurrency) {
      await Promise.race(running);
      running.splice(0, running.length - concurrency + 1);
    }
  }
  await Promise.all(running);
  return results;
}
