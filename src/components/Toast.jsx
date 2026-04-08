import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './toast.scss';

const ICONS = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
};

const Toast = ({ toasts }) => {
    if (!toasts.length) return null;

    return createPortal(
        <div className="toast-stack">
            {toasts.map((t) => (
                <div key={t.id} className={`toast-item toast-item--${t.type}`}>
                    <span className="material-icons toast-item__icon">{ICONS[t.type] ?? 'info'}</span>
                    <span className="toast-item__msg">{t.message}</span>
                </div>
            ))}
        </div>,
        document.body,
    );
};

Toast.propTypes = {
    toasts: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            message: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
        }),
    ).isRequired,
};

export default Toast;
