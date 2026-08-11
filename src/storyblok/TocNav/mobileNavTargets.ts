import type { SbBlokData } from '@storyblok/astro';

export interface MobileNavField {
  label: string;
  labelSecondLine: string;
  sectionId: string;
}

export interface BuiltMobileNavItem {
  sectionId: string;
  label: string;
  labelSecondLine: string;
  emphasized: boolean;
}

export function normalizeMobileNavItems(items: SbBlokData[] = []): MobileNavField[] {
  return items
    .map((item) => ({
      label: String(item.nav_label ?? item.label ?? '').trim(),
      labelSecondLine: String(item.nav_label_second_line ?? '').trim(),
      sectionId: String(item.section_id ?? '').trim(),
    }))
    .filter((item) => item.sectionId);
}

export function buildMobileNavItems(items: SbBlokData[] = []): BuiltMobileNavItem[] {
  const normalizedItems = normalizeMobileNavItems(items);

  return normalizedItems.map((item, index, arr) => ({
    sectionId: item.sectionId,
    label: item.label || `Section ${index + 1}`,
    labelSecondLine: item.labelSecondLine,
    emphasized: index === arr.length - 1,
  }));
}
