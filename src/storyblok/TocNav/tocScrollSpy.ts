const MOBILE_BREAKPOINT = 767;
const FIXED_NAV_GAP = 12;
const ACTIVATION_TOLERANCE = 4;
const SCROLL_SETTLE_FRAMES = 8;
const SCROLL_SETTLE_TIMEOUT = 2000;
const ACTIVATION_NUDGE = 1;

export interface TocSection {
  id: string;
  element: HTMLElement;
}

let lockedSectionId: string | null = null;
let scrollEndCleanup: (() => void) | null = null;
let coreInitialized = false;

function getScrollMargin(): number {
  const target = document.querySelector<HTMLElement>('.target');
  if (target) {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop);
    if (!Number.isNaN(margin) && margin > 0) return margin;
  }

  return 68;
}

function isMobileViewport(): boolean {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function isFixedNavVisible(): boolean {
  if (!isMobileViewport()) return false;

  const nav = document.querySelector<HTMLElement>('[data-four-fixed-nav].active');
  if (!nav) return false;

  return getComputedStyle(nav).display !== 'none';
}

export function getActivationOffset(): number {
  const scrollMargin = getScrollMargin();

  if (!isFixedNavVisible()) return scrollMargin;

  const nav = document.querySelector<HTMLElement>('[data-four-fixed-nav].active');
  if (!nav) return scrollMargin;

  return Math.max(scrollMargin, nav.offsetHeight + FIXED_NAV_GAP);
}

function collectSections(): TocSection[] {
  const seen = new Set<string>();
  const sections: TocSection[] = [];

  document
    .querySelectorAll<HTMLElement>('[data-toc-link], [data-four-fixed-nav] a[data-section-id]')
    .forEach((link) => {
      const id = link.dataset.tocLink || link.dataset.sectionId;
      if (!id || seen.has(id)) return;

      const element = document.getElementById(id);
      if (!element) return;

      seen.add(id);
      sections.push({ id, element });
    });

  const scrollTop = window.scrollY;
  sections.sort((a, b) => {
    const aTop = a.element.getBoundingClientRect().top + scrollTop;
    const bTop = b.element.getBoundingClientRect().top + scrollTop;
    return aTop - bTop;
  });

  return sections;
}

export function getActiveSectionId(sections: TocSection[]): string {
  if (sections.length === 0) return '';

  const scrollTop = window.scrollY;
  const activationLine = scrollTop + getActivationOffset();

  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const sectionTop = sections[index].element.getBoundingClientRect().top + scrollTop;
    if (sectionTop <= activationLine) {
      return sections[index].id;
    }
  }

  return sections[0].id;
}

function setSidebarActive(activeId: string | null) {
  document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]').forEach((link) => {
    const isActive = Boolean(activeId && link.dataset.tocLink === activeId);
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function setMobileNavActive(activeId: string | null) {
  document.querySelectorAll<HTMLElement>('[data-four-fixed-nav] a[data-section-id]').forEach((link) => {
    const isActive = Boolean(activeId && link.dataset.sectionId === activeId);
    link.parentElement?.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function updateActiveState() {
  if (lockedSectionId) {
    setSidebarActive(lockedSectionId);
    if (isFixedNavVisible()) setMobileNavActive(lockedSectionId);
    else setMobileNavActive(null);
    return;
  }

  const sections = collectSections();
  if (sections.length === 0) {
    setSidebarActive(null);
    setMobileNavActive(null);
    return;
  }

  const activeId = getActiveSectionId(sections);
  setSidebarActive(activeId);
  setMobileNavActive(isFixedNavVisible() ? activeId : null);
}

function isTargetAtActivationLine(target: HTMLElement): boolean {
  return Math.abs(target.getBoundingClientRect().top - getActivationOffset()) <= ACTIVATION_TOLERANCE;
}

function waitForScrollSettled(onComplete: () => void, target: HTMLElement): () => void {
  let cancelled = false;
  let lastScrollY = window.scrollY;
  let unchangedFrames = 0;
  let rafId = 0;
  let scrollEndFired = false;

  const cleanup = () => {
    cancelled = true;
    window.removeEventListener('scrollend', onScrollEnd);
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
  };

  const tryComplete = () => {
    if (cancelled) return;

    const scrollStopped = scrollEndFired || unchangedFrames >= SCROLL_SETTLE_FRAMES;
    if (scrollStopped && isTargetAtActivationLine(target)) {
      cleanup();
      requestAnimationFrame(() => {
        requestAnimationFrame(onComplete);
      });
    }
  };

  const onScrollEnd = () => {
    scrollEndFired = true;
    tryComplete();
  };

  if ('onscrollend' in window) {
    window.addEventListener('scrollend', onScrollEnd, { once: true });
  }

  const timeoutId = window.setTimeout(() => {
    if (cancelled) return;
    cleanup();
    requestAnimationFrame(() => {
      requestAnimationFrame(onComplete);
    });
  }, SCROLL_SETTLE_TIMEOUT);

  const check = () => {
    if (cancelled) return;

    if (window.scrollY === lastScrollY) {
      unchangedFrames += 1;
    } else {
      unchangedFrames = 0;
      lastScrollY = window.scrollY;
    }

    tryComplete();
    if (!cancelled) {
      rafId = requestAnimationFrame(check);
    }
  };

  rafId = requestAnimationFrame(check);

  return cleanup;
}

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  scrollEndCleanup?.();
  scrollEndCleanup = null;

  lockedSectionId = sectionId;
  updateActiveState();

  const top = Math.max(
    0,
    window.scrollY + target.getBoundingClientRect().top - getActivationOffset() + ACTIVATION_NUDGE,
  );
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  window.scrollTo({ top, behavior });

  const releaseLock = () => {
    scrollEndCleanup = null;
    lockedSectionId = null;

    // After a click-scroll, trust the destination if the target has settled
    // on the activation line even when spy math is a pixel or two behind.
    if (isTargetAtActivationLine(target)) {
      setSidebarActive(sectionId);
      setMobileNavActive(isFixedNavVisible() ? sectionId : null);
      return;
    }

    updateActiveState();
  };

  if (behavior === 'auto') {
    requestAnimationFrame(() => {
      requestAnimationFrame(releaseLock);
    });
    return;
  }

  scrollEndCleanup = waitForScrollSettled(releaseLock, target);
}

function handleDocumentClick(event: Event) {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest<HTMLAnchorElement>(
    '[data-toc-link], [data-four-fixed-nav] a[data-section-id], .three-col-header-item[data-section-id]',
  );
  if (!link) return;

  event.preventDefault();

  const sectionId = link.dataset.tocLink || link.dataset.sectionId || link.hash.slice(1);
  if (!sectionId) return;

  scrollToSection(sectionId);
}

let rafPending = false;

function scheduleUpdate() {
  if (rafPending) return;

  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    updateActiveState();
  });
}

function initCore() {
  if (coreInitialized) {
    lockedSectionId = null;
    scrollEndCleanup?.();
    scrollEndCleanup = null;
    updateActiveState();
    return;
  }

  coreInitialized = true;

  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  updateActiveState();
}

const visibilityInitialized = new WeakSet<HTMLElement>();

export function initFixedNavVisibility(revealTargetId: string) {
  const REVEAL_EARLY_OFFSET = 150;
  const nav = document.querySelector<HTMLElement>('[data-four-fixed-nav]');
  if (!nav) return;

  if (!visibilityInitialized.has(nav)) {
    visibilityInitialized.add(nav);

    let framePending = false;

    function updateVisibility() {
      framePending = false;

      const revealTarget = revealTargetId ? document.getElementById(revealTargetId) : null;
      const visible = revealTarget
        ? revealTarget.getBoundingClientRect().top <= REVEAL_EARLY_OFFSET
        : false;

      nav.classList.toggle('active', visible);
      scheduleUpdate();
    }

    function requestVisibilityUpdate() {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(updateVisibility);
    }

    window.addEventListener('scroll', requestVisibilityUpdate, { passive: true });
    window.addEventListener('resize', requestVisibilityUpdate);
    updateVisibility();
  } else {
    scheduleUpdate();
  }
}

export function initTocScrollSpy() {
  initCore();
}

document.addEventListener('astro:page-load', () => {
  lockedSectionId = null;
  scrollEndCleanup?.();
  scrollEndCleanup = null;
  initCore();
});

document.addEventListener('astro:before-swap', () => {
  lockedSectionId = null;
  scrollEndCleanup?.();
  scrollEndCleanup = null;
});
