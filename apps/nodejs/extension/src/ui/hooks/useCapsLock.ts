import { useState, useEffect } from 'react';

/**
 * useCapsLock
 * Returns true if CapsLock is currently on, false otherwise.
 */
function useCapsLock() {
    const [capsLockOn, setCapsLockOn] = useState(false);

    useEffect(() => {
        const updateCapsLock = (e: KeyboardEvent) => {
            setCapsLockOn(e.getModifierState('CapsLock'));
        };

        window.addEventListener('keydown', updateCapsLock);
        window.addEventListener('keyup', updateCapsLock);

        return () => {
            window.removeEventListener('keydown', updateCapsLock);
            window.removeEventListener('keyup', updateCapsLock);
        };
    }, []);

    return capsLockOn;
}

export default useCapsLock;
