import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import useFocusTrap from '@/hooks/useFocusTrap';

/**
 * Dialog Component
 *
 * A flexible modal dialog with backdrop, header, body, and footer areas.
 * Matches the design system with both Skeuomorphic and Aqua theme support.
 *
 * @example
 * ```jsx
 * import Dialog from '@/components/Dialog';
 * import Button from '@/components/Button';
 *
 * const MyComponent = () => {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)} label="Open Dialog" />
 *
 *       <Dialog
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         title="Dialog Title"
 *         size="md"
 *         footer={
 *           <>
 *             <Button onClick={() => setOpen(false)} label="Cancel" classNames="btn-secondary" />
 *             <Button onClick={handleSubmit} label="Confirm" classNames="btn-primary" />
 *           </>
 *         }
 *       >
 *         <p>Your dialog content goes here.</p>
 *       </Dialog>
 *     </>
 *   );
 * };
 * ```
 */
const Dialog = ({
  open,
  onClose,
  title,
  children,
  footer,
  toolbar,
  headerActions,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  bodyRef,
  draggable = false,
  modal = true,
}) => {
  const dialogRef = useRef(null);
  const trapRef = useFocusTrap(open);
  const dragStateRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Close on Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeOnEscape, onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Drag handlers (optional)
  useEffect(() => {
    if (!draggable) return undefined;

    const handlePointerMove = (e) => {
      if (!dragStateRef.current.dragging) return;
      const dx = e.clientX - dragStateRef.current.startX;
      const dy = e.clientY - dragStateRef.current.startY;
      setOffset({ x: dragStateRef.current.origX + dx, y: dragStateRef.current.origY + dy });
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.dragging) return;
      dragStateRef.current.dragging = false;
      try {
        document.releasePointerCapture && document.releasePointerCapture();
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggable]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const sizeClasses = {
    sm: 'dialog-sm',
    md: 'dialog-md',
    lg: 'dialog-lg',
    xl: 'dialog-xl',
    full: 'dialog-full',
  };

  return (
    <>
      {/* Backdrop (optional for modal dialogs) */}
      {modal && (
        <div
          className="dialog-backdrop"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Dialog Container */}
      <div className="dialog-container">
        <div
          ref={(node) => {
            dialogRef.current = node;
            trapRef.current = node;
          }}
          className={cn('dialog', sizeClasses[size], className, { draggable })}
          style={draggable ? { position: 'fixed', left: '50%', top: '50%', transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` } : undefined}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              className="dialog-header"
              onPointerDown={(e) => {
                if (!draggable) return;
                // start dragging
                dragStateRef.current.dragging = true;
                dragStateRef.current.startX = e.clientX;
                dragStateRef.current.startY = e.clientY;
                dragStateRef.current.origX = offset.x;
                dragStateRef.current.origY = offset.y;
                e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
              }}
            >
              {title && (
                <h5 id="dialog-title" className="dialog-title">
                  {title}
                </h5>
              )}
              {headerActions && (
                <div className="dialog-header__actions">{headerActions}</div>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="btn-icon dialog-close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          )}

          {/* Toolbar */}
          {toolbar && <div className="dialog-toolbar">{toolbar}</div>}

          {/* Body */}
          <div className="dialog-body" ref={bodyRef}>{children}</div>

          {/* Footer */}
          {footer && <div className="dialog-footer">{footer}</div>}
        </div>
      </div>
    </>
  );
};


export default Dialog;
