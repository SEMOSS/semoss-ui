import type { WorkbenchSlice } from "../../types";

/** Events actions exposed under the store's `actions` namespace. */
interface WorkbenchEventsActions {
	/**
	 * Announce that something happened, to whoever is listening right now.
	 *
	 * Synchronous and fire-and-forget: handlers run in registration order
	 * before this returns, nothing is retained, and a panel that subscribes
	 * afterwards will not see it. That is the point — an event says "this just
	 * happened", and a panel that was not mounted for it reads fresh when it
	 * mounts.
	 *
	 * A handler that throws is logged and skipped; one broken subscriber must
	 * not cost the others their event, and must not fail the caller that
	 * emitted it.
	 *
	 * @param event - What happened. The dock never interprets this.
	 * @param payload - Whatever that event carries.
	 */
	emit: <T>(event: string, payload: T) => void;

	/**
	 * Listen for an event until the returned cleanup is called.
	 *
	 * @param event - What to listen for.
	 * @param handler - Called with the emitted payload.
	 * @return Cleanup that drops this subscription.
	 */
	subscribe: <T>(event: string, handler: (payload: T) => void) => () => void;
}

/** The events slice: no fields, just its `actions` contribution. */
export interface WorkbenchEventsSliceState {
	actions: WorkbenchEventsActions;
}

/**
 * Creates the panel-to-panel event bus for one workbench.
 *
 * Panels are otherwise strangers: a panel can drive another imperatively
 * (`selectPanel`) or publish its own state (`setValue`), but it has no way to
 * say "a file was renamed" to whoever cares. This is that channel, and it is
 * scoped to one dock — it is created with the store and dies with it, so a
 * subscription cannot outlive its workbench or reach a different one.
 *
 * The event is an opaque string and the payload is the caller's: this package
 * stays domain-agnostic, the same way `WorkbenchPanelType` is a string the core
 * never enumerates. Hosts name their own events.
 *
 * **Subscribers are deliberately not state.** They are held in this closure
 * rather than in the slice, for the same reason `slotElements` is: nothing
 * renders them, so registering one must not wake every selector in the dock,
 * and an emit must not be a store write. The store carries no
 * `subscribeWithSelector` middleware, so a store write notifies *every* vanilla
 * subscriber — including during a 60fps drag. Keeping the registry here makes
 * an emit cost exactly the handlers for that one event.
 *
 * @name createWorkbenchEventsSlice
 * @return Zustand state creator for the workbench events slice.
 */
export const createWorkbenchEventsSlice =
	(): WorkbenchSlice<WorkbenchEventsSliceState> => () => {
		// Closure-scoped, never in state -- see the note above.
		// biome-ignore lint/suspicious/noExplicitAny: the payload type is the caller's; the bus only routes it
		const subscribers = new Map<string, Set<(payload: any) => void>>();

		return {
			actions: {
				emit: (event, payload) => {
					const handlers = subscribers.get(event);
					if (!handlers) {
						return;
					}
					// A copy, so a handler that subscribes or unsubscribes
					// while this runs cannot disturb the iteration.
					for (const handler of [...handlers]) {
						try {
							handler(payload);
						} catch (error) {
							console.error(
								`Workbench event handler for "${event}" threw.`,
								error,
							);
						}
					}
				},

				subscribe: (event, handler) => {
					const handlers =
						subscribers.get(event) ?? new Set<typeof handler>();
					handlers.add(handler);
					subscribers.set(event, handlers);

					return () => {
						const live = subscribers.get(event);
						if (!live?.delete(handler)) {
							return;
						}
						// Drop the event with its last listener, so a dock that
						// opens and closes many panels does not accumulate
						// empty sets keyed by every event it ever saw.
						if (live.size === 0) {
							subscribers.delete(event);
						}
					};
				},
			},
		};
	};
