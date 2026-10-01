import { useEffect, useRef } from "react";
import { useWorkbench } from "./use-workbench";

/**
 * React to a workbench event for the lifetime of the calling component.
 *
 * Panels are strangers to each other: one can open another (`selectPanel`) or
 * publish its own state (`setValue`), but neither says "a file was renamed" to
 * whoever cares. This does. The panel that knows something happened emits it,
 * and every mounted panel listening for that event reacts.
 *
 * `handler` may be an inline arrow — it is held in a ref refreshed every
 * render, so a changing closure never re-subscribes and an emitted event
 * always runs the latest one. Only `event` re-subscribes.
 *
 * Delivery is synchronous and only to what is mounted *now*: nothing is
 * retained and nothing replays. A panel that was not mounted for an event
 * reads fresh when it mounts, which is what makes that correct rather than
 * lossy.
 *
 * @name useWorkbenchEvent
 * @param event - What to listen for.
 * @param handler - What to do when it happens.
 */
export const useWorkbenchEvent = <T = unknown>(
	event: string,
	handler: (payload: T) => void,
): void => {
	const subscribe = useWorkbench((state) => state.events.actions.subscribe);

	// the latest handler, so a subscription never runs a stale closure
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(
		() => subscribe<T>(event, (payload) => handlerRef.current(payload)),
		[subscribe, event],
	);
};
