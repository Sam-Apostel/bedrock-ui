import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn's `cn`, verbatim.
 *
 * Registry components import this from `@/lib/utils`, which is the path they
 * will resolve to in a consumer's app. The demo bundle aliases that specifier
 * here so the gallery renders the same files the registry serves — not copies
 * of them with the imports rewritten, which would be a gallery of something
 * else.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
