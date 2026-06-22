import { useEffect, useRef } from 'react';
import useFocusTrap from '@/hooks/useFocusTrap';

const SlidePanel = ({ open, onClose, title, subtitle, children, width = '300px', headerActions }) => {
  const panelRef = useRef(null);
  const trapRef = useFocusTrap(open);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`slide-panel-backdrop ${open ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={(node) => {
          panelRef.current = node;
          trapRef.current = node;
        }}
        className={`slide-panel ${open ? 'open' : ''}`}
        style={{ width }}
        role="dialog"
        aria-modal={open}
        aria-label={title || 'Side panel'}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="slide-panel-header d-flex align-items-center justify-content-between px-3 py-1 py-lg-2">
          <div className="slide-panel-title-group">
            {title && <h5 className="slide-panel-title m-0 mb-2">{title}</h5>}
            {subtitle && <span className="slide-panel-subtitle">{subtitle}</span>}
          </div>
          <div className="d-flex align-items-center ms-auto gap-3">
            {headerActions}
            <button
              type="button"
              className="btn-icon dialog-close"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {/* Body — scrollable if content overflows */}
        <div className="slide-panel-body flex-grow-1 overflow-auto">{children}</div>
      </div>
    </>
  );
};


export default SlidePanel;
