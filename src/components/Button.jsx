import PropTypes from 'prop-types';
import cn from 'classnames';

const Button = ({ label, onClick, classNames, children }) => {
  return (
    <button title={label} className={cn('btn', classNames)} onClick={onClick}>
      {children ? children : label}
    </button>
  );
};

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  classNames: PropTypes.string,
};

export default Button;
