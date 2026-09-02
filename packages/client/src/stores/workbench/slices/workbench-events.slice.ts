import type { WorkbenchSlice } from "../workbench.types";

/** Transient events exchanged by panels in one workbench instance. */
export interface WorkbenchEventMap {
	// TODO: Migrate shared file events here after Playground and other
	// non-workbench consumers have an equivalent scoped event mechanism.
	/** The checked-out project Git branch changed. */
	"git:branch-changed": { branch: string };
	/** Project Git status should be refreshed. */
	"git:status-changed": undefined;
}

type WorkbenchEventName = keyof WorkbenchEventMap;
type WorkbenchEventPayload<Name extends WorkbenchEventName> =
	WorkbenchEventMap[Name];
type WorkbenchEventListener<Name extends WorkbenchEventName> = (
	payload: WorkbenchEventPayload<Name>,
) => void;

/** Actions-only event bus scoped to one workbench store. */
export interface WorkbenchEventsSliceState {
	/** Stable event bus actions. */
	actions: {
		/** Publish an event synchronously to this workbench's subscribers. */
		emit: <Name extends WorkbenchEventName>(
			name: Name,
			payload: WorkbenchEventPayload<Name>,
		) => void;
		/** Subscribe to one event and return its cleanup function. */
		subscribe: <Name extends WorkbenchEventName>(
			name: Name,
			listener: WorkbenchEventListener<Name>,
		) => () => void;
	};
}

/** Create a synchronous, non-persisted event bus for one workbench. */
export const createWorkbenchEventsSlice =
	(): WorkbenchSlice<WorkbenchEventsSliceState> => () => {
		const listeners = new Map<
			WorkbenchEventName,
			Set<WorkbenchEventListener<WorkbenchEventName>>
		>();

		return {
			actions: {
				emit: (name, payload) => {
					for (const listener of listeners.get(name) ?? []) {
						listener(payload);
					}
				},
				subscribe: (name, listener) => {
					const storedListener =
						listener as WorkbenchEventListener<WorkbenchEventName>;

					const eventListeners = listeners.get(name) ?? new Set();

					eventListeners.add(storedListener);

					listeners.set(name, eventListeners);

					return () => {
						eventListeners.delete(storedListener);

						if (eventListeners.size === 0) {
							listeners.delete(name);
						}
					};
				},
			},
		};
	};
