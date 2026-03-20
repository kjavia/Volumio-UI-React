import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

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
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const dialogRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeOnEscape, onClose]);

  // Focus trap: return focus to dialog when it opens
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

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
      {/* Backdrop */}
      <div
        className="dialog-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="dialog-container">
        <div
          ref={dialogRef}
          className={cn('dialog', sizeClasses[size], className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="dialog-header">
              {title && (
                <h5 id="dialog-title" className="dialog-title">
                  {title}
                </h5>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="dialog-close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="dialog-body">{children}</div>

          {/* Footer */}
          {footer && <div className="dialog-footer">{footer}</div>}
        </div>
      </div>
    </>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
};

export default Dialog;
