import { useEffect, useRef, useState } from 'react';

/**
 * Debouncea
 * @param value - new value
 * @param delay - delay timer
 * @returns debounced value
 */
export const useDebounceValue = <T>(value: T, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState<T>(undefined);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        // waittill it is set
        timerRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timerRef.current);
        };
    }, [value, delay]);

    return debouncedValue;
};
