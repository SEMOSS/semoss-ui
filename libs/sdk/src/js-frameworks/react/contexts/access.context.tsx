import { createContext, type ReactNode, useMemo } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { SessionState } from "../../../stores/session/session.types";

type AccessState = Pick<SessionState, "access">;

export type AccessStoreSource = Pick<
	StoreApi<AccessState>,
	"getState" | "getInitialState" | "subscribe"
>;

export const AccessStoreContext = createContext<AccessStoreSource | undefined>(
	undefined,
);

interface AccessProviderProps<State extends AccessState> {
	/** A scoped session store or standalone access store. */
	store: StoreApi<State>;
	children: ReactNode;
}

const adaptAccessStore = <State extends AccessState>(
	store: StoreApi<State>,
): AccessStoreSource => {
	let current = { access: store.getState().access };
	const initial = { access: store.getInitialState().access };

	return {
		getState: () => current,
		getInitialState: () => initial,
		subscribe: (listener) =>
			store.subscribe((state, previousState) => {
				if (state.access === previousState.access) {
					return;
				}
				const previous = current;
				current = { access: state.access };
				listener(current, previous);
			}),
	};
};

/** Provide resource access from either a full session or standalone store. */
export function AccessProvider<State extends AccessState>({
	store,
	children,
}: AccessProviderProps<State>) {
	const source = useMemo(() => adaptAccessStore(store), [store]);
	return (
		<AccessStoreContext.Provider value={source}>
			{children}
		</AccessStoreContext.Provider>
	);
}
