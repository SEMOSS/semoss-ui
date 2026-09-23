import {
	isAdminUser,
	runPixel as runPixelRequest,
	setUserMetadata,
} from "../../../api";
import type {
	SessionState,
	SessionStore,
	SessionUser,
	SystemConfig,
} from "../session.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const backendString = (value: unknown): string | null => {
	if (typeof value !== "string" || value === "null") {
		return null;
	}
	return value;
};

const parseStringRecord = (value: unknown): Record<string, string> => {
	if (value === null || value === undefined) {
		return {};
	}
	if (!isRecord(value)) {
		throw new Error("Invalid user information: san must be an object");
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => {
			if (typeof entry !== "string") {
				throw new Error(
					`Invalid user information: san.${key} must be a string`,
				);
			}
			return [key, entry];
		}),
	);
};

const parseMetadata = (value: unknown): Record<string, readonly string[]> => {
	if (value === undefined || value === null) {
		return {};
	}
	if (!isRecord(value)) {
		throw new Error("Invalid user information: meta must be an object");
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, entry]) => {
			if (
				!Array.isArray(entry) ||
				entry.some((item) => typeof item !== "string")
			) {
				throw new Error(
					`Invalid user information: meta.${key} must be an array of strings`,
				);
			}
			return [key, [...entry] as string[]];
		}),
	);
};

const parseGroups = (value: unknown): SessionUser["groupInfo"] => {
	if (!isRecord(value)) {
		return { groupType: null, groups: [] };
	}

	const groupType =
		value.groupType === null || value.groupType === undefined
			? null
			: backendString(value.groupType);
	const rawGroups = value.groups;
	if (rawGroups === null || rawGroups === undefined) {
		return { groupType, groups: [] };
	}
	if (
		!Array.isArray(rawGroups) ||
		rawGroups.some((group) => typeof group !== "string")
	) {
		throw new Error(
			"Invalid user information: groupInfo.groups must be an array of strings",
		);
	}

	return { groupType, groups: [...rawGroups] as string[] };
};

const parseSessionUser = (
	value: unknown,
	admin: boolean,
	config: SystemConfig | null,
): SessionUser | null => {
	if (!isRecord(value)) {
		throw new Error("Invalid GetUserInfo response");
	}

	const providerNames = Object.keys(value)
		.filter((provider) => isRecord(value[provider]))
		.sort();
	const provider = providerNames.includes("SAML")
		? "SAML"
		: providerNames.includes("NATIVE")
			? "NATIVE"
			: providerNames[0];

	if (!provider) {
		const anonymous = config?.loginDetails.ANONYMOUS;
		if (!anonymous?.id) {
			return null;
		}
		return {
			provider: "ANONYMOUS",
			id: anonymous.id,
			name: anonymous.name,
			username: "",
			email: "",
			admin,
			userEpoch: "",
			meta: {},
			lastLogin: null,
			lastPasswordReset: null,
			san: anonymous.san ?? {},
			groupInfo: { groupType: null, groups: [] },
		};
	}

	const profile = value[provider];
	if (!isRecord(profile)) {
		throw new Error(`Invalid GetUserInfo response for ${provider}`);
	}
	const id = backendString(profile.id);
	if (!id) {
		throw new Error(
			`Invalid GetUserInfo response: ${provider}.id is missing`,
		);
	}

	return {
		provider,
		id,
		name: backendString(profile.name) ?? "",
		username: backendString(profile.username) ?? "",
		email: backendString(profile.email) ?? "",
		admin,
		userEpoch: backendString(profile.userEpoch) ?? "",
		meta: parseMetadata(profile.meta),
		lastLogin: backendString(profile.lastLogin),
		lastPasswordReset: backendString(profile.lastPwdReset),
		san: parseStringRecord(profile.san),
		groupInfo: parseGroups(profile.groupInfo),
	};
};

const identityOf = (user: SessionUser | null): string | null =>
	user ? `${user.provider}:${user.id}:${user.userEpoch}` : null;

export const createUserSlice = ({
	set,
	get,
	getGeneration,
	bumpGeneration,
}: {
	set: SessionStore["setState"];
	get: SessionStore["getState"];
	getGeneration: () => number;
	bumpGeneration: () => void;
}): SessionState["user"] => ({
	current: null,
	actions: {
		refresh: async () => {
			const requestGeneration = getGeneration();
			const [result, admin] = await Promise.all([
				runPixelRequest<[Record<string, unknown>]>(
					"GetUserInfo();",
					get().insightId ?? "new",
				),
				isAdminUser(),
			]);
			if (result.errors.length > 0) {
				throw new Error(result.errors.join(""));
			}
			if (requestGeneration !== getGeneration()) {
				return;
			}

			const nextUser = parseSessionUser(
				result.pixelReturn[0]?.output,
				admin,
				get().config.data,
			);
			const previousIdentity = identityOf(get().user.current);
			const nextIdentity = identityOf(nextUser);
			if (previousIdentity !== nextIdentity) {
				bumpGeneration();
				get().access.actions.clearPermissions();
			}

			set((state) => ({
				user: { ...state.user, current: nextUser },
				insightId: nextUser ? result.insightId : null,
				lifecycle: {
					...state.lifecycle,
					authentication: nextUser
						? "authenticated"
						: "unauthenticated",
					error: null,
				},
			}));
		},
		updateMetadata: async (key, value) => {
			await setUserMetadata(key, value);
			await get().user.actions.refresh();
		},
	},
});
