import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import useMenuKeyboard from '@/hooks/useMenuKeyboard';

const EDGE_MARGIN = 8; // px gap kept from viewport edges

/** Clamps x/y so a DOM element stays fully within the viewport. */
function clampToViewport(el, x, y) {
  const { width, height } = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.max(EDGE_MARGIN, Math.min(x, vw - width - EDGE_MARGIN)),
    y: Math.max(EDGE_MARGIN, Math.min(y, vh - height - EDGE_MARGIN)),
  };
}

// ─── Submenu flyout (rendered in a portal) ────────────────────────────────
const SubmenuFlyout = ({ items, triggerRef, onCloseAll, onMouseEnter, onMouseLeave }) => {
  const flyoutRef = useRef(null);

  useLayoutEffect(() => {
    const el = flyoutRef.current;
    const trigger = triggerRef.current;
    if (!el || !trigger) return;
    const { width, height } = el.getBoundingClientRect();
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer right of trigger; fall back to left
    let x = r.right + 2;
    if (x + width > vw - EDGE_MARGIN) x = r.left - width - 2;
    x = Math.max(EDGE_MARGIN, x);
    // Align top with trigger; push up if overflows bottom
    let y = r.top;
    if (y + height > vh - EDGE_MARGIN) y = vh - height - EDGE_MARGIN;
    y = Math.max(EDGE_MARGIN, y);
    // Set position directly on DOM — avoids setState-in-effect lint warning
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.visibility = 'visible';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      ref={flyoutRef}
      className="context-menu open"
      role="menu"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 10001,
        visibility: 'hidden',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, i) => {
        if (item.separator) return <div key={i} className="context-menu-separator" />;
        if (item.empty != null) return <div key={i} className="context-menu-empty">{item.empty}</div>;
        return (
          <button
            key={i}
            className={`context-menu-item${item.danger ? ' danger' : ''}`}
            onClick={() => { onCloseAll(); item.onClick?.(); }}
          >
            {item.icon && <span className="material-icons">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
};

// ─── Submenu trigger button ────────────────────────────────────────────────
const SubmenuItem = ({ item, onCloseAll }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const hoverTimer = useRef(null);

  const cancelClose = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    hoverTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const submenuItems = item.submenu?.length
    ? item.submenu
    : [{ empty: item.empty ?? 'No items available.' }];

  return (
    <div
      ref={triggerRef}
      className="context-menu-item context-menu-item--has-submenu"
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={open}
      tabIndex={0}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); setOpen(true); }
        if (e.key === 'Escape' || e.key === 'ArrowLeft') setOpen(false);
      }}
    >
      {item.icon && <span className="material-icons">{item.icon}</span>}
      <span className="context-menu-item__label">{item.label}</span>
      <span className="material-icons context-menu-item__chevron">chevron_right</span>
      {open && (
        <SubmenuFlyout
          items={submenuItems}
          triggerRef={triggerRef}
          onCloseAll={onCloseAll}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
};

// ─── Shared item renderer ──────────────────────────────────────────────────
function renderItems(items, close, onCloseAll) {
  return items.map((item, i) => {
    if (item.separator) return <div key={i} className="context-menu-separator" />;
    if (item.section != null) return <div key={i} className="context-menu-section">{item.section}</div>;
    if (item.submenu !== undefined) return <SubmenuItem key={i} item={item} onCloseAll={onCloseAll} />;
    if (item.empty != null) return <div key={i} className="context-menu-empty">{item.empty}</div>;
    return (
      <button
        key={i}
        className={`context-menu-item${item.danger ? ' danger' : ''}`}
        onClick={close(item.onClick)}
      >
        {item.icon && <span className="material-icons">{item.icon}</span>}
        {item.label}
      </button>
    );
  });
}

/**
 * Generic reusable context menu component.
 *
 * Item shapes:
 *   { label, icon?, onClick, danger? }              — regular button
 *   { label, icon?, submenu: Item[], empty?: string } — submenu trigger
 *   { separator: true }                             — horizontal divider
 *   { section: string }                             — section header label
 *   { empty: string }                               — placeholder text
 *
 * Variants:
 *   'dropdown'   — toggle button + dropdown (default)
 *   'drawer'     — slide-in drawer via portal; controlled via isOpen/onClose
 *   'positioned' — fixed {x,y} portal; controlled via isOpen/onClose/position;
 *                  automatically clamped to stay within the viewport
 */
const ContextMenu = ({
  items = [],
  variant = 'dropdown',
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  position,
  toggleIcon = 'more_vert',
  toggleLabel = 'Menu',
  toggleClassName = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const menuNodeRef = useRef(null);

  const isDrawer = variant === 'drawer';
  const isPositioned = variant === 'positioned';
  const isControlled = isDrawer || isPositioned;

  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = isControlled
    ? (v) => { if (!v) externalOnClose?.(); }
    : setInternalIsOpen;

  const ctxMenuRef = useMenuKeyboard(isOpen, () => setIsOpen(false));

  // Combine keyboard-hook ref with measurement ref
  const setMenuRef = useCallback((el) => {
    menuNodeRef.current = el;
    ctxMenuRef.current = el;
  }, [ctxMenuRef]);

  // Clamp positioned menu to viewport — set DOM styles directly to avoid setState-in-effect
  // Single effect handles both hide-before-measure and show-after-clamp in the correct order
  useLayoutEffect(() => {
    const el = menuNodeRef.current;
    if (!el) return;
    if (!isPositioned || !isOpen || !position) {
      el.style.visibility = 'hidden';
      return;
    }
    const clamped = clampToViewport(el, position.x, position.y);
    el.style.left = `${clamped.x}px`;
    el.style.top = `${clamped.y}px`;
    el.style.visibility = 'visible';
  }, [isPositioned, isOpen, position]);

  const close = (fn) => () => { setIsOpen(false); fn?.(); };
  const closeAll = () => setIsOpen(false);

  if (isPositioned) {
    if (!isOpen || !position) return null;
    // When positioned, listen for document mousedown in capture phase so
    // outside clicks close the menu but still propagate to underlying
    // elements (so a click on a grid cell both closes the menu and selects
    // the cell). We avoid rendering a backdrop which would intercept clicks.
    useLayoutEffect(() => {
      if (!isOpen) return undefined;
      const handler = (e) => {
        const el = menuNodeRef.current;
        if (!el) return;
        if (el.contains(e.target)) return; // click inside menu — ignore
        externalOnClose?.();
      };
      document.addEventListener('mousedown', handler, true);
      return () => document.removeEventListener('mousedown', handler, true);
    }, [isOpen, externalOnClose]);

    return createPortal(
      <div
        ref={setMenuRef}
        className="context-menu open"
        role="menu"
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 10001,
          visibility: 'hidden',
        }}
      >
        {renderItems(items, close, closeAll)}
      </div>,
      document.body,
    );
  }

  if (isDrawer) {
    return createPortal(
      <>
        <div
          className={`context-drawer-backdrop ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(false)}
        />
        <div ref={ctxMenuRef} className={`context-drawer ${isOpen ? 'open' : ''}`} role="menu">
          {renderItems(items, close, closeAll)}
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className="context-menu-container">
      <button
        className={`context-menu-toggle context-menu-toggle--no-shadow${toggleClassName ? ` ${toggleClassName}` : ''}`}
        onClick={() => setInternalIsOpen(!internalIsOpen)}
        aria-expanded={isOpen}
        aria-label={toggleLabel}
      >
        <span className="material-icons">{toggleIcon}</span>
      </button>

      {isOpen && (
        <>
          <div className="context-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div ref={ctxMenuRef} className="context-menu open" role="menu">
            {renderItems(items, close, closeAll)}
          </div>
        </>
      )}
    </div>
  );
};

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  variant: PropTypes.oneOf(['dropdown', 'drawer', 'positioned']),
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  toggleIcon: PropTypes.string,
  toggleLabel: PropTypes.string,
  toggleClassName: PropTypes.string,
};

export default ContextMenu;
