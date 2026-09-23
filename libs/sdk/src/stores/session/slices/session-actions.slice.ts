import {
	confirmOTP,
	download as downloadFile,
	loginLDAP,
	login as loginNative,
	loginOTP,
	logout as logoutSession,
	oauth,
	registerUser,
	runPixel as runPixelRequest,
	upload as uploadFiles,
} from "../../../api";
import { CSRF, HttpError } from "../../../utility";
import type { SessionState, SessionStore } from "../session.types";

const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error));

export const createSessionActionsSlice = ({
	set,
	get,
	getGeneration,
	bumpGeneration,
}: {
	set: SessionStore["setState"];
	get: SessionStore["getState"];
	getGeneration: () => number;
	bumpGeneration: () => void;
}): SessionState["actions"] => {
	let initializationPromise: Promise<void> | null = null;

	const clearIdentity = (
		authentication: SessionState["lifecycle"]["authentication"],
	): void => {
		bumpGeneration();
		get().access.actions.clearPermissions();
		set((state) => ({
			user: { ...state.user, current: null },
			insightId: null,
			lifecycle: {
				...state.lifecycle,
				authentication,
				error: null,
			},
		}));
	};

	const initialize = (): Promise<void> => {
		if (initializationPromise) {
			return initializationPromise;
		}

		const requestGeneration = getGeneration();
		set((state) => ({
			lifecycle: {
				...state.lifecycle,
				initialization: "loading",
				error: null,
			},
		}));

		const request = (async () => {
			try {
				await get().config.actions.refresh();
				if (requestGeneration !== getGeneration()) {
					return;
				}

				if (Object.keys(get().config.data?.logins ?? {}).length === 0) {
					clearIdentity("unauthenticated");
				} else {
					await get().user.actions.refresh();
				}
				set((state) => ({
					lifecycle: {
						...state.lifecycle,
						initialization: "ready",
						error: null,
					},
				}));
			} catch (error: unknown) {
				if (requestGeneration === getGeneration()) {
					set((state) => ({
						lifecycle: {
							...state.lifecycle,
							initialization: "error",
							error: toError(error),
						},
					}));
				}
				throw error;
			}
		})();

		const sharedRequest = request.finally(() => {
			if (initializationPromise === sharedRequest) {
				initializationPromise = null;
			}
		});
		initializationPromise = sharedRequest;
		return sharedRequest;
	};

	return {
		initialize,
		login: async (input) => {
			clearIdentity("unknown");
			try {
				if (input.method === "native") {
					await loginNative(input.username, input.password);
				} else if (input.method === "ldap") {
					await loginLDAP(input.username, input.password);
				} else if (input.method === "oauth") {
					await oauth(input.provider);
				} else if (input.method === "otp") {
					await confirmOTP(input.otp);
				}

				await get().config.actions.refresh();
				await get().user.actions.refresh();
				set((state) => ({
					lifecycle: {
						...state.lifecycle,
						initialization: "ready",
						error: null,
					},
				}));
			} catch (error: unknown) {
				set((state) => ({
					lifecycle: { ...state.lifecycle, error: toError(error) },
				}));
				throw error;
			}
		},
		requestOtp: async ({ username, pin }) => {
			try {
				await loginOTP(username, pin);
				return "otp-required";
			} catch (error: unknown) {
				if (
					error instanceof HttpError &&
					error.status === 401 &&
					error.data.requirePwdChange === true
				) {
					return "password-change-required";
				}
				throw error;
			}
		},
		register: async (input) => {
			await registerUser(input);
			clearIdentity("unauthenticated");
		},
		logout: async () => {
			const request = logoutSession();
			clearIdentity("unauthenticated");
			CSRF.token = "";
			try {
				await request;
			} catch (error: unknown) {
				set((state) => ({
					lifecycle: { ...state.lifecycle, error: toError(error) },
				}));
				throw error;
			}
		},
		runPixel: async <O extends unknown[] | []>(pixel: string) => {
			const requestGeneration = getGeneration();
			const result = await runPixelRequest<O>(
				pixel,
				get().insightId ?? "new",
			);
			if (requestGeneration === getGeneration()) {
				set({ insightId: result.insightId });
			}
			return result;
		},
		download: (fileKey) => downloadFile(get().insightId ?? "new", fileKey),
		upload: (files, projectId = null, path = "") =>
			uploadFiles(files, get().insightId ?? "new", projectId, path ?? ""),
	};
};
