import { useEffect, useMemo, useRef } from "react";

const debounce = (func, wait) => {
	let timeout;

	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

/**
 * @desc useDebounce utility function returns a debounced function
 */
export const useDebounced = <T extends (...args: any[]) => any>(
	callback: T,
	delay: number,
): T => {
	const ref = useRef<T>(callback);

	useEffect(() => {
		ref.current = callback;
	}, [callback]);

	const debouncedCallback = useMemo(() => {
		const func = (...args: Parameters<T>) => {
			ref.current?.(...args);
		};

		return debounce(func, delay) as T;
	}, []);

	return debouncedCallback;
};
