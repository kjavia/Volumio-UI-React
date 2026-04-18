import { useEffect } from 'react';

/**
 * Spatial keyboard navigation — move focus between interactive elements
 * with arrow keys.  Finds the nearest focusable element in the pressed
 * direction based on bounding-rect geometry.
 */

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), ' +
  'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), ' +
  'textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

function getFocusables() {
  // If an aria-modal dialog is open, restrict to elements inside it
  const modal = document.querySelector('[aria-modal="true"]');
  const scope = modal || document;

  return [...scope.querySelectorAll(FOCUSABLE)].filter((el) => {
    // Must be visible (non-zero rect) and not hidden
    if (el.offsetParent === null && el.tagName !== 'BODY') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

function center(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Return the best candidate in `direction` from `origin`.
 * direction: 'up' | 'down' | 'left' | 'right'
 */
function bestCandidate(origin, candidates, direction) {
  const oc = center(origin);
  let best = null;
  let bestDist = Infinity;

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    const ec = center(rect);

    // Filter: candidate must be in the correct direction
    const dx = ec.x - oc.x;
    const dy = ec.y - oc.y;

    let inDirection = false;
    switch (direction) {
      case 'up':    inDirection = dy < -5; break;
      case 'down':  inDirection = dy > 5;  break;
      case 'left':  inDirection = dx < -5; break;
      case 'right': inDirection = dx > 5;  break;
    }
    if (!inDirection) continue;

    // Weighted distance — favour the primary axis, penalise off-axis
    let primary, secondary;
    if (direction === 'up' || direction === 'down') {
      primary = Math.abs(dy);
      secondary = Math.abs(dx);
    } else {
      primary = Math.abs(dx);
      secondary = Math.abs(dy);
    }
    const dist = primary + secondary * 3; // heavy cross-axis penalty

    if (dist < bestDist) {
      bestDist = dist;
      best = el;
    }
  }
  return best;
}

export default function useSpatialNav() {
  useEffect(() => {
    const dirMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };

    function handler(e) {
      const direction = dirMap[e.key];
      if (!direction) return;

      // Don't hijack left/right inside text inputs (needed for cursor movement)
      // — but allow spatial nav when the field is empty (no text to navigate)
      const tag = e.target.tagName;
      const type = e.target.type;
      if (tag === 'INPUT' && (type === 'text' || type === 'search' || type === 'number') && (direction === 'left' || direction === 'right') && e.target.value.length > 0) return;
      if (tag === 'TEXTAREA') return;
      if (tag === 'SELECT') return;
      // Range inputs: left/right control the slider, up/down navigate away
      if (tag === 'INPUT' && type === 'range' && (direction === 'left' || direction === 'right')) return;

      const all = getFocusables();
      const active = document.activeElement;
      const origin = active && active !== document.body
        ? active.getBoundingClientRect()
        : null;

      if (!origin) {
        // Nothing focused — focus the first visible element
        if (all.length) all[0].focus({ preventScroll: true });
        return;
      }

      const candidates = all.filter((el) => el !== active);
      let next = bestCandidate(origin, candidates, direction);

      // Skip for browse-result items — handled by BrowseDialog's state-based navigation.
      const inBrowseResult = active.closest?.('.browse-result-card, .browse-result-row');
      if (inBrowseResult) return;

      if (next) {
        e.preventDefault();
        next.focus({ preventScroll: true });
        next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
