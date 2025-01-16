import { useEffect } from "react";

const useCtrlAltShiftKeyCombination = (key: string, callback: ()=>void) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        if (typeof callback === 'function') {
          callback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
};

export default useCtrlAltShiftKeyCombination;
