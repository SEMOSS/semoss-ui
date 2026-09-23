import { createStore } from "zustand/vanilla";
import type { SessionState, SessionStore } from "./session.types";
import { createAccessSlice } from "./slices/access.slice";
import { createConfigSlice } from "./slices/config.slice";
import { createLifecycleSlice } from "./slices/lifecycle.slice";
import { createSessionActionsSlice } from "./slices/session-actions.slice";
import { createUserSlice } from "./slices/user.slice";

/** Create an isolated vanilla Zustand session store. */
export const createSessionStore = (): SessionStore => {
	let generation = 0;
	const getGeneration = () => generation;
	const bumpGeneration = () => {
		generation += 1;
	};

	return createStore<SessionState>()((set, get) => {
		const access = createAccessSlice({
			setAccess: (update) =>
				set((state) => ({ access: update(state.access) })),
			getAccess: () => get().access,
			getSession: () => ({ config: get().config, user: get().user }),
		});
		return {
			lifecycle: createLifecycleSlice(),
			config: createConfigSlice(set),
			user: createUserSlice({
				set,
				get,
				getGeneration,
				bumpGeneration,
			}),
			insightId: null,
			access,
			actions: createSessionActionsSlice({
				set,
				get,
				getGeneration,
				bumpGeneration,
			}),
		};
	});
};
