import { getSystemConfig } from "../../../api";
import { Env } from "../../../env";
import type { SessionState, SessionStore } from "../session.types";

export const createConfigSlice = (
	set: SessionStore["setState"],
): SessionState["config"] => ({
	data: null,
	actions: {
		refresh: async () => {
			const data = await getSystemConfig();
			Env.update({ CSRF: data.csrf });
			set((state) => ({
				config: { ...state.config, data },
			}));
		},
	},
});
