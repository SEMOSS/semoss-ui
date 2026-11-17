import { type RefObject, useLayoutEffect, useRef } from "react";

/**
 * Keep a ref that always holds the latest value, for event handlers, timers,
 * and long-lived subscriptions that must read it without being set up again
 * each time it changes.
 *
 * The ref is written in a layout effect, never during render, so a render
 * that React throws away leaves it as it was. It holds the value from the
 * last commit: read it from handlers and effects, not while rendering.
 *
 * @param value - The value to keep.
 * @returns A ref whose `current` is the last committed value.
 */
export const useLatestRef = <T>(value: T): Readonly<RefObject<T>> => {
	const ref = useRef(value);
	useLayoutEffect(() => {
		ref.current = value;
	}, [value]);
	return ref;
};
