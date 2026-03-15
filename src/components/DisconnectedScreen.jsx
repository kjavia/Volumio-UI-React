import PropTypes from 'prop-types';

const DisconnectedScreen = ({ isRetrying = false, host }) => {
  return (
    <div className="d-flex vh-100 w-100 flex-column justify-content-center align-items-center bg-dark text-white gap-4">
      <div className="disconnected-icon position-relative d-flex justify-content-center align-items-center">
        <span className="material-icons" style={{ fontSize: '4rem', opacity: 0.25 }}>
          wifi_off
        </span>
        {isRetrying && (
          <div className="position-absolute" style={{ bottom: '-6px', right: '-6px' }}>
            <div
              className="spinner-border spinner-border-sm text-secondary"
              role="status"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="text-center">
        <h5 className="mb-1 fw-semibold">
          {isRetrying ? 'Connecting to Volumio…' : 'Disconnected'}
        </h5>
        {host && <p className="text-white-50 small mb-0">{host}</p>}
        {!isRetrying && (
          <p className="text-white-50 small mb-0 mt-1">
            Check that Volumio is running and reachable.
          </p>
        )}
      </div>

      {isRetrying && (
        <div className="d-flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-circle bg-secondary"
              style={{
                width: '6px',
                height: '6px',
                animation: `disconnected-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes disconnected-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

DisconnectedScreen.propTypes = {
  isRetrying: PropTypes.bool,
  host: PropTypes.string,
};

export default DisconnectedScreen;
