export { deepCopy as copy } from "@semoss/utility/object";

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
		if (!(target instanceof Object) || !Object.hasOwn(target, p)) {
			return undefined;
		}

		// move forward
		target = target[p];
	}

	return target;
};
