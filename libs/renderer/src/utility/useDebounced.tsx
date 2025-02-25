import { useEffect, useMemo, useRef } from "react";
import { debounce } from "./";

/**
 * @desc useDebounce utility function returns a debounced function
 */
export const useDebounced = (callback, delay) => {
    const ref = useRef(() => {});

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = () => {
            ref.current?.();
        };

        return debounce(func, delay);
    }, []);

    return debouncedCallback;
};
