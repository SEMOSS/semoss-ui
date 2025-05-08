import { SerializedState } from "../store";
import { useDebounced } from "./useDebounced";
// import BRAIN from "../assets/BRAIN.png";
// import { ENGINE_IMAGES } from "../constants";

export { useDebounced as debounced };

/**
 * @desc Checks if output and verify if its a JSON object
 */
export const isOutputJSON = (output: unknown) => {
    if (typeof output === "object" && output !== null) {
        return output;
    }
    if (typeof output === "string") {
        try {
            return JSON.parse(output);
        } catch (e) {
            const validateJsonString = output.replace(/'/g, '"');
            try {
                return JSON.parse(validateJsonString);
            } catch (InnerError) {
                return null;
            }
        }
    }
    return null;
};

/**
 * @desc Copies string to clipboard
 */
export const copyTextToClipboard = (text: string, notificationService) => {
    try {
        navigator.clipboard.writeText(text);

        notificationService.add({
            color: "success",
            message: "Succesfully copied to clipboard",
        });
    } catch (e) {
        notificationService.add({
            color: "error",
            message: e.message,
        });
    }
};

export const capitalizeFirstLetter = (str) => {
    return str.replace(/\w{1}/, (match) => match.toUpperCase());
};

/**
 * @desc splits a string at the period
 * Used in the UI Builder and notebook
 */
export const splitAtPeriod = (str, side = "left") => {
    const indexOfPeriod = str.indexOf(".");
    if (indexOfPeriod === -1) {
        return str; // No period found, return the entire string
    }

    if (side === "left") {
        return str.substring(0, indexOfPeriod);
    } else if (side === "right") {
        return str.substring(indexOfPeriod + 1);
    } else {
        throw new Error("Invalid side argument. Choose 'left' or 'right'");
    }
};

/**
 * Ignore the result of a promise
 * @param executor - function that returns a promise
 * @returns
 */
export const cancellablePromise = <R>(
    executor: () => Promise<R>,
): {
    promise: Promise<R>;
    cancel: () => void;
} => {
    // track if it is cancelled or not
    let cancelled = false;

    // track a timeout to delay execution
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return {
        promise: new Promise<R>((resolve, reject) => {
            // wrap in a timeout to execute after the current thread is done
            timeout = setTimeout(async () => {
                try {
                    const response = await executor();

                    // ignore if cancelled
                    if (cancelled) {
                        return;
                    }

                    return resolve(response);
                } catch (err) {
                    return reject(err);
                }
            }, 0);
        }),
        cancel: () => {
            // clear the timeout if it's there
            if (timeout) {
                clearTimeout(timeout);
            }

            // mark as cancelled
            cancelled = true;
        },
    };
};

/**
 * Ignore the result of a promise
 * @param executor - function that returns a promise
 * @returns
 */
export const syncronousPromise = <R>(
    executor: () => Promise<R>,
): {
    promise: Promise<R>;
    cancel: () => void;
} => {
    return {
        promise: new Promise<R>((resolve, reject) => {
            try {
                const response = executor();
                return resolve(response);
            } catch (err) {
                return reject(err);
            }
        }),
        cancel: () => {},
    };
};

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

export const debounce = (func, wait) => {
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
 * Get a value from an object based on the path
 *
 * @param target - target object to get the value from
 * @param path - path to the attribute
 *
 * @returns path to the attribute
 */
export const getValueByPath = <T extends object>(target: T, path: string) => {
    if (!(target instanceof Object)) {
        return target;
    }

    if (path.length === 0) {
        return target;
    }

    const pathArr = path.split(".");
    for (const p of pathArr) {
        // skip if it isn't an object or the property does not exist
        if (
            !(target instanceof Object) ||
            !Object.prototype.hasOwnProperty.call(target, p)
        ) {
            return undefined;
        }

        // move forward
        target = target[p];
    }

    return target;
};

export const getHomePage = (state: SerializedState) => {
    let active = "";
    const blocks = state.blocks;

    Object.entries(blocks).forEach((kv) => {
        const id = kv[0];
        const json = kv[1] as { widget: string };

        if (json.widget === "page") {
            active = id;
        }
    });

    if (active) {
        return active;
    }

    return "page-1";
};
