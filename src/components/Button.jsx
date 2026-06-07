import PropTypes from 'prop-types';
import cn from 'classnames';

const Button = ({ label, onClick, classNames, children, disabled, ...rest }) => {
  return (
    <button title={label} className={cn('btn', classNames)} onClick={onClick} disabled={disabled} {...rest}>
      {children ? children : label}
    </button>
  );
};

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  classNames: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;
