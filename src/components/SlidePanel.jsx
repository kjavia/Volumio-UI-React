import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './SlidePanel.css';

const SlidePanel = ({ open, onClose, title, children, width = '300px' }) => {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Trap focus: return focus to panel when it opens
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

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
        ref={panelRef}
        className={`slide-panel ${open ? 'open' : ''}`}
        style={{ width }}
        role="dialog"
        aria-modal={open}
        aria-label={title || 'Side panel'}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="slide-panel-header d-flex align-items-center justify-content-between px-3 py-2">
          {title && <h5 className="slide-panel-title m-0 text-white">{title}</h5>}
          <button
            type="button"
            className="btn btn-link text-white p-0 ms-auto"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body — scrollable if content overflows */}
        <div className="slide-panel-body flex-grow-1 overflow-auto px-3 py-2">{children}</div>
      </div>
    </>
  );
};

SlidePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  width: PropTypes.string,
};

export default SlidePanel;
