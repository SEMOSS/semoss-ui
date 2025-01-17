import { useEffect, useMemo, useRef } from "react";
/**
 * Deep copy an object
 *
 * @param instance - instance of the object that we want to copy
 * @param intercept - intercept method
 *
 * @returns a copied object
 */
export const copy = <T>(
    instance: T,
    intercept: (instance: unknown) => unknown = (instance) => instance,
): T => {
    // intercept the instance and update it if relevant
    instance = intercept(instance) as T;

    if (!instance) {
        return instance;
    }

    if (instance instanceof Date) {
        return new Date(instance.getTime()) as unknown as T;
    }

    if (instance instanceof Array) {
        return instance.map((c) => {
            return copy(c, intercept);
        }) as unknown as T;
    }

    if (instance instanceof Object) {
        const copied: { [key: string]: unknown } = {};
        for (const k in instance) {
            copied[k] = copy(
                (instance as Record<string, unknown>)[k],
                intercept,
            );
        }

        return copied as unknown as T;
    }

    return instance;
};

/**
 * Set a value from an object based on the path. This will generate partials.
 *
 * @param target - target object to set the value on
 * @param path - path to the attribute
 * @param path - value to set
 */
export const setValueByPath = <T extends object>(
    target: T,
    path: string,
    value: unknown,
) => {
    // get the keys
    const p = path.split(".");

    // get the last key. If there is none, ignore it
    const last = p.pop();
    if (!last) {
        return;
    }

    // traverse to the correct element
    let current = target;
    while (p.length) {
        const key = p.shift();

        if (!key) {
            return;
        }

        // create the object if the key doesn't exist. This will allow partials
        if (!current[key]) {
            current[key] = {};
        }

        current = current[key];
    }

    // set the value
    current[last] = value;
};

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
export const debounced = (callback, delay) => {
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
