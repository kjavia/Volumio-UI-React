import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), ' +
  'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), ' +
  'textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside a container while `active` is true.
 *
 * - On activation: focuses the `initialFocusRef` if provided and visible,
 *   otherwise the first interactive child (or the container itself).
 * - Tab / Shift+Tab wrap within the container.
 * - On deactivation: restores focus to the element that was focused before.
 *
 * @param {boolean} active — whether the trap is engaged (dialog open)
 * @param {React.RefObject} [initialFocusRef] — optional element to focus on activation
 * @returns {React.RefObject} — attach to the container element
 */
export default function useFocusTrap(active, initialFocusRef) {
  const containerRef = useRef(null);
  const previousFocus = useRef(null);

  const getFocusables = useCallback(() => {
    if (!containerRef.current) return [];
    return [...containerRef.current.querySelectorAll(FOCUSABLE)].filter((el) => {
      // Must be visible
      if (el.offsetParent === null && el.tagName !== 'BODY') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  }, []);

  // Focus first element on activation, restore on deactivation
  useEffect(() => {
    if (!active) return;

    // Remember what had focus before
    previousFocus.current = document.activeElement;

    // Small delay so the DOM has rendered the dialog contents
    const id = requestAnimationFrame(() => {
      const initial = initialFocusRef?.current;
      if (initial && typeof initial.focus === 'function') {
        initial.focus({ preventScroll: true });
        return;
      }
      const focusables = getFocusables();
      if (focusables.length > 0) {
        focusables[0].focus({ preventScroll: true });
      } else if (containerRef.current) {
        containerRef.current.focus({ preventScroll: true });
      }
    });

    return () => {
      cancelAnimationFrame(id);
      // Restore previous focus
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus({ preventScroll: true });
      }
    };
  }, [active, getFocusables]);

  // Tab trap
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      if (!containerRef.current) return;

      const focusables = getFocusables();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift+Tab on first → wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        // Tab on last → wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }

      // If focus is somehow outside the container, pull it back
      if (!containerRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, getFocusables]);

  return containerRef;
}
