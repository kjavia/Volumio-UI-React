import { useState } from 'react';
import PropTypes from 'prop-types';
import SlidePanel from './SlidePanel';

const SideMenu = ({ onStopViz, onBack, onExit }) => {
  const [open, setOpen] = useState(false);

  const handle = (fn) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <>
      <button
        className="btn btn-link text-white fs-4 ms-3"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <span className="material-icons">menu</span>
      </button>

      <SlidePanel open={open} onClose={() => setOpen(false)} title="Menu">
        <nav>
          <ul className="list-unstyled m-0">
            <li className="py-2 border-bottom border-secondary">
              <button className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0">
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                  home
                </span>
                Home
              </button>
            </li>
            <li className="py-2 border-bottom border-secondary">
              <button className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0">
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                  library_music
                </span>
                Browse
              </button>
            </li>
            <li className="py-2 border-bottom border-secondary">
              <button className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0">
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                  queue_music
                </span>
                Queue
              </button>
            </li>
            <li className="py-2 border-bottom border-secondary">
              <button className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0">
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                  settings
                </span>
                Settings
              </button>
            </li>

            {/* ── Actions ─────────────────────────────────────────── */}
            {onStopViz && (
              <li className="py-2 border-bottom border-secondary">
                <button
                  className="btn btn-link text-warning text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0"
                  onClick={handle(onStopViz)}
                >
                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                    equalizer
                  </span>
                  Stop Visualization
                </button>
              </li>
            )}

            {onBack && (
              <li className="py-2 border-bottom border-secondary">
                <button
                  className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0"
                  onClick={handle(onBack)}
                >
                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                    arrow_back
                  </span>
                  Back
                </button>
              </li>
            )}

            {onExit && (
              <li className="py-2">
                <button
                  className="btn btn-link text-danger text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0"
                  onClick={handle(onExit)}
                >
                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                    power_settings_new
                  </span>
                  Exit
                </button>
              </li>
            )}
          </ul>
        </nav>
      </SlidePanel>
    </>
  );
};

SideMenu.propTypes = {
  onStopViz: PropTypes.func,
  onBack: PropTypes.func,
  onExit: PropTypes.func,
};

export default SideMenu;
