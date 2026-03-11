import PropTypes from 'prop-types';
import cn from 'classnames';

const Button = ({label, onClick, classNames}) => {
  return (
    <button className={cn('btn', classNames)} onClick={onClick}>
      {label}
    </button>
  );
};

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  classNames: PropTypes.string,
};

export default Button;
