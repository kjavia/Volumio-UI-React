import { useState, useCallback } from 'react';

let _id = 0;

const useToast = (duration = 5000) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, [duration]);

  return { toasts, showToast };
};

export default useToast;
