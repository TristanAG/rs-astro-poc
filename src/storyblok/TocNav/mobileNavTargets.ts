import type { SbBlokData } from '@storyblok/astro';

export const MOBILE_NAV_TARGET_IDS = ['sec2', 'sec3', 'sec5', 'sec6'] as const;

/** Nav reveals when this section reaches the viewport top. */
export const MOBILE_NAV_REVEAL_TARGET_ID = MOBILE_NAV_TARGET_IDS[0];

export const MOBILE_NAV_DEFAULT_LABELS = [
  'How It Works',
  'Key Benefits',
  'What to Look For',
  'Best Products',
] as const;

export type MobileNavTargetId = (typeof MOBILE_NAV_TARGET_IDS)[number];

export interface MobileNavField {
  label: string;
}

export function normalizeMobileNavItems(items: SbBlokData[] = []): MobileNavField[] {
  return items.map((item) => ({
    label: String(item.nav_label ?? item.label ?? '').trim(),
  }));
}
