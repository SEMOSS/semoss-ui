import { createStore } from "zustand/vanilla";
import type { SessionState } from "./session.types";
import { createAccessSlice } from "./slices/access.slice";

type AccessState = Pick<SessionState, "access">;

/** Create a standalone scoped access store for a host without a session. */
export const createAccessStore = () =>
	createStore<AccessState>()((set, get) => ({
		access: createAccessSlice({
			setAccess: (update) =>
				set((state) => ({ access: update(state.access) })),
			getAccess: () => get().access,
		}),
	}));
