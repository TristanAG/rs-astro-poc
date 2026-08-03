import type { SbBlokData } from '@storyblok/astro';

/** Fallback anchor IDs when no Storyblok mobile nav items are configured. */
export const MOBILE_NAV_TARGET_IDS = ['sec2', 'sec3', 'sec5', 'sec6'] as const;

export const MOBILE_NAV_DEFAULT_LABELS = [
  'How It Works',
  'Key Benefits',
  'What to Look For',
  'Best Products',
] as const;

export interface MobileNavField {
  label: string;
  sectionId: string;
}

export function normalizeMobileNavItems(items: SbBlokData[] = []): MobileNavField[] {
  return items
    .map((item) => ({
      label: String(item.nav_label ?? item.label ?? '').trim(),
      sectionId: String(item.section_id ?? '').trim(),
    }))
    .filter((item) => item.sectionId);
}

export function buildMobileNavItems(items: SbBlokData[] = []) {
  const normalizedItems = normalizeMobileNavItems(items);

  if (normalizedItems.length > 0) {
    return normalizedItems.map((item, index, arr) => ({
      sectionId: item.sectionId,
      label: item.label || `Section ${index + 1}`,
      emphasized: index === arr.length - 1,
    }));
  }

  return MOBILE_NAV_TARGET_IDS.map((sectionId, index) => ({
    sectionId,
    label: MOBILE_NAV_DEFAULT_LABELS[index] || `Section ${index + 1}`,
    emphasized: index === MOBILE_NAV_TARGET_IDS.length - 1,
  }));
}
