import React from 'react';
import classNames from 'classnames';
import { useSocket } from '../contexts/SocketContext';
import PlayerButtons from './PlayerButtons';
import SideMenu from './SideMenu';

const Header = () => {
  const { isConnected } = useSocket();
  // Mock auth service and user
  const user = { name: 'User' };
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'it', label: 'Italiano' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    // ... add others as needed
  ];

  /*
   * Note: The original Angular app uses matchmediaService for isPhone check.
   * Here we rely on CSS classes (d-none d-md-block) or could use a hook.
   * The original template:
   * <div ng-if="!header.matchmediaService.isPhone"> ... </div>
   * <ng-include ... ng-if="header.matchmediaService.isPhone"> ... </ng-include>
   *
   * Since this is a direct port, I'll assume we show the desktop version by default
   * and hide on mobile via CSS if possible, or we can use a simple check.
   */

  const changeLanguage = (e) => {
    console.log('Change language to', e.target.value);
  };

  const logout = () => {
    console.log('Logout');
  };

  if (isConnected) {
    return (
      <header className="header-content d-flex align-items-center justify-content-between p-3 bg-dark text-white">
        <div className="d-none d-md-flex align-items-center w-100 justify-content-between">
          <div id="logo">
            <img
              src="/assets/images/volumio-logo.png"
              alt="Volumio"
              style={{ maxHeight: '40px' }}
            />
          </div>
          <div className="d-flex align-items-center">
            <PlayerButtons />
            <SideMenu />
          </div>
        </div>

        {/* Mobile Tab Bar Header Replacement - simplified for now */}
        <div className="d-md-none w-100 text-center">
          <img src="/assets/images/volumio-logo.png" alt="Volumio" style={{ maxHeight: '30px' }} />
        </div>
      </header>
    );
  }

  return (
    <div className="header-content p-3 bg-dark text-white d-flex justify-content-end align-items-center">
      {user && (
        <div className="logout-container me-3">
          <button
            className="btn btn-danger btn-sm d-flex align-items-center gap-2"
            onClick={logout}
          >
            <span className="material-icons" style={{ fontSize: '1rem' }}>
              exit_to_app
            </span>
            Logout
          </button>
        </div>
      )}
      <div className="language-container">
        <select className="form-select form-select-sm" onChange={changeLanguage}>
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Header;
