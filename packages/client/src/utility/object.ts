/**
 * Get a value from an object based on the path
 *
 * @param target - target object to get the value from
 * @param path - path to the attribute
 *
 * @returns path to the attribute
 */
export const getValueByPath = (target: unknown, path: string) => {
    if (!(target instanceof Object)) {
        return target;
    }

    if (path.length === 0) {
        return target;
    }

    const pathArr = path.split('.');
    for (const p of pathArr) {
        // skip if it isn't an object or the property does not exist
        if (
            !(target instanceof Object) ||
            !Object.prototype.hasOwnProperty.call(target, p)
        ) {
            return undefined;
        }

        // move forward
        target = (target as Record<string, unknown>)[p];
    }

    return target;
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
