import { renderRichText } from '@storyblok/astro';

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeHtmlString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.includes('&lt;') && !trimmed.includes('<')) {
    return decodeHtmlEntities(trimmed);
  }

  return trimmed;
}

function extractInlineStyles(html: string) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join('\n');

  const withoutStyles = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();

  return { html: withoutStyles, css };
}

export function renderHtmlField(value: unknown) {
  if (!value) {
    return { html: '', css: '' };
  }

  if (typeof value === 'object') {
    const html = renderRichText(value as Parameters<typeof renderRichText>[0]);
    return { html, css: '' };
  }

  if (typeof value !== 'string') {
    return { html: '', css: '' };
  }

  return extractInlineStyles(normalizeHtmlString(value));
}
