import { create } from "zustand";
import { saveDashboard } from "./api";
import type { DashboardConfig } from "./types";

export type AppMode = "view" | "edit";

interface PortalState {
	/** Config loaded from server (dashboard.json). Reflects latest published state. */
	config: DashboardConfig | null;
	loadError: string | null;
	saving: boolean;
	saveError: string | null;
	mode: AppMode;
	/** Fetch dashboard.json from server and populate config. */
	load: () => Promise<void>;
	setMode: (m: AppMode) => void;
	/**
	 * Upload the edited config to the server, then reload so all users
	 * (including the current user) see the latest dashboard.json.
	 */
	saveEdits: (draft: DashboardConfig) => Promise<void>;
}

export const usePortalStore = create<PortalState>((set) => ({
	config: null,
	loadError: null,
	saving: false,
	saveError: null,
	mode: "view",

	load: async () => {
		try {
			const r = await fetch("./dashboard.json?_=" + Date.now(), {
				credentials: "include",
			});
			if (!r.ok) throw new Error("HTTP " + r.status);
			const config = (await r.json()) as DashboardConfig;
			set({ config, loadError: null });
		} catch (e: unknown) {
			set({ loadError: String((e as Error)?.message ?? e) });
		}
	},

	setMode: (m) => set({ mode: m }),

	saveEdits: async (draft) => {
		set({ saving: true, saveError: null });
		try {
			await saveDashboard(draft.projectId, draft);
			// Reload so every user (including current) fetches the updated dashboard.json
			window.location.reload();
		} catch (e: unknown) {
			set({
				saving: false,
				saveError: String((e as Error)?.message ?? e),
			});
		}
	},
}));
