import type { SessionState } from "../session.types";

export const createLifecycleSlice = (): SessionState["lifecycle"] => ({
	initialization: "idle",
	authentication: "unknown",
	error: null,
});
