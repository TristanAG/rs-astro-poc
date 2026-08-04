import type { SbBlokData } from '@storyblok/astro';

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

  return normalizedItems.map((item, index, arr) => ({
    sectionId: item.sectionId,
    label: item.label || `Section ${index + 1}`,
    emphasized: index === arr.length - 1,
  }));
}
