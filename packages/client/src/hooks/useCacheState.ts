import { useState } from "react";

type CacheState<T> = {
	state: T;
};

/**
 * Access state from the cache
 */
export const useCacheState = <T>(initialState: T, name: string) => {
	const key = `smss--${name}`;

	// set the data
	const [state, setState] = useState<T>(() => {
		try {
			const item = localStorage.getItem(key);
			if (item) {
				// try to get the state
				const data = JSON.parse(item) as CacheState<T>;
				return data.state;
			}
		} catch (e) {
			console.error(e);
		}

		// return the inital state if not set from local storage
		return initialState;
	});

	/**
	 * Handle changing of the data
	 */
	const onChange = (data: T) => {
		// save to cache
		const item: CacheState<T> = {
			state: data,
		};

		localStorage.setItem(key, JSON.stringify(item));

		// update the state
		setState(data);
	};

	return [state, onChange] as const;
};
