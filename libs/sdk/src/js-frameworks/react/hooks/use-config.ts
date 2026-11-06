import { useEffect } from "react";
import type { ConfigStore } from "../../../stores/config/config.store";
import { pickActions, useStoreSelector } from "../utility/store-selector";
import { useSessionStore } from "./use-session";

/** The config's actions, handed to selectors beside its state. */
const CONFIG_ACTIONS = ["load", "reset", "isAdminOnly"] as const;

/** The config's state, with its actions. */
type ConfigState = ReturnType<ConfigStore["getSnapshot"]> &
	Pick<ConfigStore, (typeof CONFIG_ACTIONS)[number]>;

/**
 * Read the system config of the view's session, rendering again only when
 * the selected part changes. The config is read on first use without needing
 * a session, so a signed out page can use it; every view shares that one
 * read.
 *
 * @param selector - Picks the part to read. Defaults to all of it, which
 * renders on every change.
 * @returns The selected part.
 *
 * @example
 * ```tsx
 * const providers = useConfig((state) => state.config?.availableProviders ?? []);
 * const theme = useConfig((state) => state.theme);
 * ```
 */
export const useConfig = <T = ConfigState>(
	selector: (state: ConfigState) => T = (state) => state as T,
): T => {
	const { config } = useSessionStore();

	// a failed read shows through the state's `error`
	useEffect(() => {
		void config.load().catch(() => undefined);
	}, [config]);

	return useStoreSelector(config, (snapshot) =>
		selector({ ...snapshot, ...pickActions(config, CONFIG_ACTIONS) }),
	);
};
