import cn from 'classnames';

const Button = ({ label, onClick, classNames, children, disabled, ...rest }) => {
  return (
    <button title={label} className={cn('btn', classNames)} onClick={onClick} disabled={disabled} {...rest}>
      {children ? children : label}
    </button>
  );
};


export default Button;
