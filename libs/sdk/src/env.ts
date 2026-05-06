import type { MCPToolRequest } from "./types";

/**
 * Singleton object holding environment information
 */
const envStore: {
	APP: string;
	MODULE: string;
	ACCESS_KEY: string;
	SECRET_KEY: string;
	BEARER_TOKEN: string;
	BEARER_PROVIDER: string;
	CSRF: boolean;
	TOOL: MCPToolRequest | null;
} = {
	APP: "",
	MODULE: "",
	ACCESS_KEY: "",
	SECRET_KEY: "",
	BEARER_TOKEN: "",
	BEARER_PROVIDER: "",
	CSRF: false,
	TOOL: null,
};

export const Env = {
	/**
	 * Get the APP ID
	 */
	get APP() {
		return envStore.APP;
	},

	/**
	 * Module for the backend
	 */
	get MODULE() {
		return envStore.MODULE;
	},

	/**
	 * Access key to authenticate with. Should only be set in development mode
	 */
	get ACCESS_KEY() {
		return envStore.ACCESS_KEY;
	},

	/**
	 * Secret key to authenticate with. Should only be set in development mode
	 */
	get SECRET_KEY() {
		return envStore.SECRET_KEY;
	},

	/**
	 * Bearer token passed from embed host
	 */
	get BEARER_TOKEN() {
		return envStore.BEARER_TOKEN;
	},

	/**
	 * Bearer provider passed from embed host
	 */
	get BEARER_PROVIDER() {
		return envStore.BEARER_PROVIDER;
	},

	/**
	 * CSRF token for the current session
	 */
	get CSRF() {
		return envStore.CSRF;
	},

	/**
	 * Current tool information
	 */
	get TOOL() {
		return envStore.TOOL;
	},

	/**
	 * Update the environment variables
	 * @param updated - updated variables
	 */
	update(updated: Partial<typeof envStore>) {
		Object.assign(envStore, updated);
	},
};
