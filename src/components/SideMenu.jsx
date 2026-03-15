import { useState } from 'react';
import SlidePanel from './SlidePanel';

const SideMenu = () => {
  const [open, setOpen] = useState(false);

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
            <li className="py-2">
              <button className="btn btn-link text-white text-decoration-none w-100 text-start d-flex align-items-center gap-2 px-0">
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                  settings
                </span>
                Settings
              </button>
            </li>
          </ul>
        </nav>
      </SlidePanel>
    </>
  );
};

export default SideMenu;
