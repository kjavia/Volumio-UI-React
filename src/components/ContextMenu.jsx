import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useMenuKeyboard from '@/hooks/useMenuKeyboard';
import { VOLUMIO_BASE_URL } from '@/config';

const ContextMenu = ({
  vizStopped,
  onStopViz,
  onBackToPlayer,
  onFullscreenViz,
  isVizFullscreen,
  variant = 'dropdown',
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isDrawer = variant === 'drawer';
  const isOpen = isDrawer ? externalIsOpen : internalIsOpen;
  const setIsOpen = isDrawer ? (v) => { if (!v) externalOnClose?.(); } : setInternalIsOpen;

  const ctxMenuRef = useMenuKeyboard(isOpen, () => setIsOpen(false));

  const close = (fn) => () => { setIsOpen(false); fn?.(); };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.body.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
    setIsOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const menuItems = (
    <>
      <button className="context-menu-item" onClick={close(() => navigate('/playlist-manager'))}>
        <span className="material-icons">queue_music</span>
        Playlist Manager
      </button>
      <button className="context-menu-item" onClick={close(() => navigate('/settings'))}>
        <span className="material-icons">settings</span>
        Settings
      </button>
      {onBackToPlayer && (
        <>
          <button className="context-menu-item" onClick={close(onBackToPlayer)}>
            <span className="material-icons">arrow_back</span>
            Back to Player
          </button>
          <div className="context-menu-separator" />
        </>
      )}
      <button className="context-menu-item" onClick={handleRefresh}>
        <span className="material-icons">refresh</span>
        Refresh
      </button>
      <button className="context-menu-item" onClick={toggleFullscreen}>
        <span className="material-icons">
          {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
        </span>
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      {!vizStopped && onFullscreenViz && (
        <>
          <div className="context-menu-separator" />
          <button className="context-menu-item" onClick={close(onFullscreenViz)}>
            <span className="material-icons">
              {isVizFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            {isVizFullscreen ? 'Exit Visualization Fullscreen' : 'Visualization Fullscreen'}
          </button>
        </>
      )}
      {!vizStopped && onStopViz && (
        <>
          {!onFullscreenViz && <div className="context-menu-separator" />}
          <button className="context-menu-item" onClick={close(onStopViz)}>
            <span className="material-icons">equalizer</span>
            Stop Visualization
          </button>
        </>
      )}
      <div className="context-menu-separator" />
      <button className="context-menu-item" onClick={close(() => navigate(-1))}>
        <span className="material-icons">arrow_back</span>
        Back
      </button>
      <button className="context-menu-item danger" onClick={close(() => { window.location.assign(VOLUMIO_BASE_URL); })}>
        <span className="material-icons">power_settings_new</span>
        Exit
      </button>
    </>
  );

  if (isDrawer) {
    return createPortal(
      <>
        <div className={`context-drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
        <div ref={ctxMenuRef} className={`context-drawer ${isOpen ? 'open' : ''}`} role="menu">
          {menuItems}
        </div>
      </>,
      document.body,
    );
  }

  return (
    <div className="context-menu-container">
      <button
        className="context-menu-toggle context-menu-toggle--no-shadow"
        onClick={() => setInternalIsOpen(!internalIsOpen)}
        aria-expanded={isOpen}
        aria-label="Menu"
      >
        <span className="material-icons">more_vert</span>
      </button>

      {isOpen && (
        <>
          <div className="context-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div ref={ctxMenuRef} className="context-menu open" role="menu">
            {menuItems}
          </div>
        </>
      )}
    </div>
  );
};

ContextMenu.propTypes = {
  vizStopped: PropTypes.bool,
  onStopViz: PropTypes.func,
  onBackToPlayer: PropTypes.func,
  onFullscreenViz: PropTypes.func,
  isVizFullscreen: PropTypes.bool,
  variant: PropTypes.oneOf(['dropdown', 'drawer']),
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ContextMenu;
