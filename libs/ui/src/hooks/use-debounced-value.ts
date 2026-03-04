import { useEffect, useRef, useState } from "react";

/**
 * Debounce a value
 * @param value - new value
 * @param delay - delay timer
 * @returns debounced value
 */
export const useDebouncedValue = <T>(value: T, delay: number = 300) => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		timeoutRef.current = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [value, delay]);

	return debouncedValue;
};
