import { createContext } from "react";

type SettingsEngineInfo = {
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	data: Record<string, unknown> | undefined;
};

export type SettingsContextType = {
	/** True if the Settings is in admin mode */
	adminMode: boolean;
	/**
	 * Cached EngineInfo / AdminEngineInfo result for the current engine
	 * detail route, fetched once by the settings layout and consumed by
	 * downstream components (e.g. SettingsTiles) to avoid duplicate calls.
	 */
	engineInfo?: SettingsEngineInfo;
};

/**
 * Context
 */
export const SettingsContext = createContext<SettingsContextType>(undefined);
