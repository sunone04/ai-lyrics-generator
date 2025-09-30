import { SEO_LIMITS, TITLE_SUFFIX } from './constants';

// Ensure text length <= max. If truncated, prefer cutting at word boundary and add ellipsis '…' within limit.
export function truncateForMeta(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;

  // Reserve 1 char for ellipsis if we need to truncate
  const target = Math.max(0, max - 1);
  let cut = text.slice(0, target);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > target * 0.6) {
    cut = cut.slice(0, lastSpace);
  }
  return `${cut}…`;
}

// Base title gets template suffix in layout, so clamp base to keep total <= limit
export function buildTitleBase(base: string, limit: number = SEO_LIMITS.TITLE_MAX): string {
  const suffixLen = TITLE_SUFFIX.length;
  const baseMax = Math.max(0, limit - suffixLen);
  return truncateForMeta(base, baseMax);
}

export function buildDescription(desc: string, limit: number = SEO_LIMITS.DESCRIPTION_MAX): string {
  return truncateForMeta(desc, limit);
}

// For OG/Twitter titles which do not use the layout template
export function clampTitle(text: string, limit: number = SEO_LIMITS.TITLE_MAX): string {
  return truncateForMeta(text, limit);
}

