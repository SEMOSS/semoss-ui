import { moduleUrlFor } from "@/config/profiles";
import type {
	DesktopInstanceProfile,
	InstanceConfig,
	InstanceTheme,
} from "@/types";
import { request } from "./transport";

const DEFAULT_THEME: InstanceTheme = {
	name: "SEMOSS",
	logo: "",
	logoLight: "",
	includeNameWithLogo: true,
	loginHeroImage: "",
	loginHeroImageDark: "",
};

const readErrorMessage = async (response: Response): Promise<string> => {
	try {
		const body: unknown = await response.json();
		if (body && typeof body === "object" && !Array.isArray(body)) {
			const record = body as Record<string, unknown>;
			const message =
				record.message || record.error || record.errorMessage;
			if (typeof message === "string" && message.trim()) {
				return message;
			}
		}
	} catch {
		// The status text below is the deliberate fallback for non-JSON errors.
	}

	return response.statusText || `Request failed (${response.status})`;
};

export const fetchInstanceConfig = async (
	profile: DesktopInstanceProfile,
): Promise<InstanceConfig> => {
	const response = await request(
		profile,
		`${moduleUrlFor(profile)}/api/config`,
		{
			headers: { Accept: "application/json" },
		},
	);

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}

	return (await response.json()) as InstanceConfig;
};

export const readInstanceTheme = (config: InstanceConfig): InstanceTheme => {
	const rawTheme = config.theme?.THEME_MAP;
	if (!rawTheme) {
		return DEFAULT_THEME;
	}

	try {
		const parsed: unknown = JSON.parse(rawTheme);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return DEFAULT_THEME;
		}
		return {
			...DEFAULT_THEME,
			...(parsed as Partial<InstanceTheme>),
		};
	} catch {
		return DEFAULT_THEME;
	}
};

export const loginWithPassword = async (
	profile: DesktopInstanceProfile,
	provider: "native" | "ldap",
	username: string,
	password: string,
): Promise<void> => {
	const endpoint = provider === "ldap" ? "loginLDAP" : "login";
	const form = new URLSearchParams({
		username,
		password,
		disableRedirect: "true",
	});
	const response = await request(
		profile,
		`${moduleUrlFor(profile)}/api/auth/${endpoint}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: form.toString(),
		},
	);

	if (!response.ok) {
		throw new Error(await readErrorMessage(response));
	}
};
