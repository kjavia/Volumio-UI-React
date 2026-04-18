import { useEffect, useRef, useCallback } from 'react';

/**
 * Keyboard navigation for popup menus.
 *
 * - Up / Down arrow keys cycle through menu items (wraps circularly)
 * - Enter / Space activates the focused item
 * - Escape closes the menu
 * - Focuses the first item when the menu opens
 *
 * @param {boolean} open  — whether the menu is currently visible
 * @param {Function} onClose — called when Escape is pressed
 * @returns {React.RefObject} — attach to the menu container element
 */
export default function useMenuKeyboard(open, onClose) {
  const menuRef = useRef(null);
  const prevFocus = useRef(null);

  const getItems = useCallback(() => {
    if (!menuRef.current) return [];
    return [...menuRef.current.querySelectorAll(
      'button:not([disabled]), [role="menuitem"]:not([disabled])'
    )];
  }, []);

  // Focus first item on open, restore focus on close
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;

    const id = requestAnimationFrame(() => {
      const items = getItems();
      if (items.length) items[0].focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(id);
      if (prevFocus.current && typeof prevFocus.current.focus === 'function') {
        prevFocus.current.focus({ preventScroll: true });
      }
    };
  }, [open, getItems]);

  // Keyboard handler
  useEffect(() => {
    if (!open) return;

    function handler(e) {
      const items = getItems();
      if (!items.length) return;

      const idx = items.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          e.stopPropagation();
          const next = idx < items.length - 1 ? idx + 1 : 0;
          items[next].focus({ preventScroll: true });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          e.stopPropagation();
          const prev = idx > 0 ? idx - 1 : items.length - 1;
          items[prev].focus({ preventScroll: true });
          break;
        }
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
          break;
        case 'Tab':
          // Prevent Tab from leaving the menu
          e.preventDefault();
          break;
        default:
          break;
      }
    }

    document.addEventListener('keydown', handler, true); // capture phase
    return () => document.removeEventListener('keydown', handler, true);
  }, [open, onClose, getItems]);

  return menuRef;
}
