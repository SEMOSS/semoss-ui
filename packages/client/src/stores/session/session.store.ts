import { createStore, type StoreApi } from "zustand";
import { download, logout, runPixel, upload } from "@semoss/sdk/react";
import {
	login as authenticate,
	confirmOTP,
	isAdminUser,
	loginLDAP,
	loginOTP,
	oauth,
	registerUser,
} from "@/api";
import type { ConfigStore } from "@/stores/config";
import type { ALL_TYPES } from "@/types";

interface User {
	loggedIn: boolean;
	id: string;
	name: string;
	email: string;
	admin: boolean;
	meta: unknown;
	lastLogin?: string;
	groupInfo?: { groups: string[] };
}

export interface SessionStoreState {
	status: "INITIALIZING" | "MISSING AUTHENTICATION" | "SUCCESS" | "ERROR";
	authenticated: boolean;
	insightID: string;
	userEpoch: string;
	isNative: boolean;
	user: User;
	defaultTextGenerationModel: string;
	defaultCodeGenerationModel: string;
	/** Fetch the logged-in user via GetUserInfo(); loggedIn comes from ConfigStore.initialize(). */
	initialize: (loggedIn: boolean) => Promise<void>;
	login: (username: string, password: string) => Promise<boolean>;
	loginLDAP: (username: string, password: string) => Promise<boolean>;
	loginOTP: (username: string, password: string) => Promise<boolean>;
	confirmOTP: (otp: string) => Promise<boolean>;
	register: (
		name: string,
		username: string,
		email: string,
		password: string,
		phone: string,
		phoneextension: string,
		countrycode: string,
	) => Promise<boolean>;
	oauth: (provider: string) => Promise<boolean>;
	logout: () => Promise<void>;
	runPixel: <O extends unknown[] | []>(
		pixel: string,
	) => ReturnType<typeof runPixel<O>>;
	download: (fileKey: string) => ReturnType<typeof download>;
	upload: (
		files: File | File[],
		projectId?: string | null,
		path?: string | null,
	) => ReturnType<typeof upload>;
	isEngineOperationAvailable: (
		type: ALL_TYPES,
		flag: "access" | "add" | "delete" | "discoverable" | "public",
	) => boolean;
	setUserDefaultModel: (meta: Record<string, unknown>) => void;
	updateUserDefaultModel: (modelName: string, modelId: string) => void;
}

const asString = (value: unknown): string =>
	typeof value === "string" ? value : "";

const resetUser = (loggedIn: boolean): User => ({
	id: "",
	name: "",
	email: "",
	admin: false,
	meta: {},
	loggedIn,
});

export const createSessionStore = (
	configStore: ConfigStore,
): StoreApi<SessionStoreState> =>
	createStore<SessionStoreState>()((set, get) => ({
		status: "INITIALIZING",
		authenticated: false,
		insightID: "",
		userEpoch: "",
		isNative: false,
		user: {
			loggedIn: false,
			id: "",
			name: "",
			email: "",
			admin: false,
			meta: {},
		},
		defaultTextGenerationModel: "",
		defaultCodeGenerationModel: "",
		initialize: async (loggedIn) => {
			set({
				user: {
					...get().user,
					loggedIn,
				},
			});

			if (!loggedIn) {
				set({ status: "MISSING AUTHENTICATION" });
				return;
			}

			try {
				const result = await runPixel<
					[
						{
							[key: string]: {
								id: string;
								name: string;
								email: string;
								userEpoch: string;
								meta: unknown;
							};
						},
					]
				>("GetUserInfo();", "new");
				if (result.errors.length > 0)
					throw Error(result.errors.join(""));
				const output = result.pixelReturn[0]?.output as Record<
					string,
					unknown
				>;
				const provider =
					output?.SAML ||
					output?.NATIVE ||
					output?.[Object.keys(output || {})[0]];
				const user = (provider || {}) as Record<string, unknown>;
				const meta = Object.entries(
					(user.meta as Record<string, unknown>) || {},
				).reduce(
					(acc, [key, value]) => {
						acc[key] = Array.isArray(value) ? value[0] : value;
						return acc;
					},
					{} as Record<string, unknown>,
				);
				const admin = await isAdminUser();
				set({
					insightID: result.insightId,
					isNative: Boolean(output?.NATIVE),
					userEpoch: asString(user.userEpoch),
					user: {
						...get().user,
						id: asString(user.id),
						name: asString(user.name),
						email: asString(user.email),
						admin,
						meta,
						lastLogin: asString(user.lastLogin) || undefined,
						groupInfo: user.groupInfo as
							| { groups: string[] }
							| undefined,
					},
					defaultTextGenerationModel: asString(
						meta["text-generation-model"],
					),
					defaultCodeGenerationModel: asString(
						meta["code-generation-model"],
					),
					status: "SUCCESS",
				});
			} catch (error) {
				console.error(error);
				set({ status: "ERROR" });
			}
		},
		login: async (username, password) => {
			await authenticate(username, password);
			set({ user: resetUser(true) });
			await get().initialize(true);
			return true;
		},
		loginLDAP: async (username, password) => {
			await loginLDAP(username, password);
			set({ user: resetUser(true) });
			await get().initialize(true);
			return true;
		},
		loginOTP: async (username, password) => {
			const response = await loginOTP(username, password);
			return response !== "change-password";
		},
		confirmOTP: async (otp) => {
			await confirmOTP(otp);
			set({ user: resetUser(true) });
			await get().initialize(true);
			return true;
		},
		register: async (
			name,
			username,
			email,
			password,
			phone,
			phoneextension,
			countrycode,
		) => {
			await registerUser(
				name,
				username,
				email,
				password,
				phone,
				phoneextension,
				countrycode,
			);
			set({ user: resetUser(true) });
			return true;
		},
		oauth: async (provider) => {
			await oauth(provider);
			set({ user: resetUser(true) });
			await get().initialize(true);
			return true;
		},
		logout: async () => {
			await logout();
			set({
				user: resetUser(false),
				status: "MISSING AUTHENTICATION",
				insightID: "",
			});
		},
		runPixel: async <O extends unknown[] | []>(pixel: string) =>
			runPixel<O>(pixel, get().insightID || "new"),
		download: async (fileKey) =>
			download(get().insightID || "new", fileKey),
		upload: async (files, projectId = null, path = "") =>
			upload(files, get().insightID || "new", projectId, path ?? ""),
		isEngineOperationAvailable: (type, flag) => {
			if (get().user.admin) return true;
			const moduleMap = {
				PROJECT: "Project",
				WORKSPACE: "Workspace",
				SKILL: "Skill",
				DATABASE: "Db",
				FUNCTION: "Function",
				MODEL: "Model",
				STORAGE: "Storage",
				VECTOR: "Vector",
				GUARDRAIL: "Guardrail",
			} as const;
			const operationMap = {
				access: "AddAccess",
				add: "Add",
				delete: "Delete",
				discoverable: "SetDiscoverable",
				public: "SetPublic",
			} as const;
			return (
				configStore.getState().config[
					`adminOnly${moduleMap[type]}${operationMap[flag]}`
				] === false
			);
		},
		setUserDefaultModel: (meta) =>
			set({
				defaultTextGenerationModel: asString(
					meta["text-generation-model"],
				),
				defaultCodeGenerationModel: asString(
					meta["code-generation-model"],
				),
			}),
		updateUserDefaultModel: (modelName, modelId) => {
			if (modelName === "text-generation-model") {
				set({ defaultTextGenerationModel: modelId });
			}
			if (modelName === "code-generation-model") {
				set({ defaultCodeGenerationModel: modelId });
			}
		},
	}));
