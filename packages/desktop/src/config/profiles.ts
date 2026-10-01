import type { DesktopInstanceProfile } from "@/types";

const DEFAULT_PROFILE: DesktopInstanceProfile = {
	id: "local",
	displayName: "Local SEMOSS",
	endpoint: "",
	module: "/Monolith",
	platformPath: "/SemossWeb/packages/client/dist/",
	allowInsecureHttp: true,
};

const isProfile = (value: unknown): value is DesktopInstanceProfile => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === "string" &&
		typeof candidate.displayName === "string" &&
		typeof candidate.endpoint === "string" &&
		typeof candidate.module === "string" &&
		typeof candidate.platformPath === "string" &&
		typeof candidate.allowInsecureHttp === "boolean"
	);
};

export const readCompiledProfiles = (): DesktopInstanceProfile[] => {
	const raw = import.meta.env.VITE_DESKTOP_PROFILES?.trim();
	if (!raw) {
		return [DEFAULT_PROFILE];
	}

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [DEFAULT_PROFILE];
		}

		const profiles = parsed.filter(isProfile);
		return profiles.length > 0 ? profiles : [DEFAULT_PROFILE];
	} catch {
		return [DEFAULT_PROFILE];
	}
};

export const readDefaultProfileId = (): string =>
	import.meta.env.VITE_DESKTOP_DEFAULT_PROFILE?.trim() || DEFAULT_PROFILE.id;

export const moduleUrlFor = (profile: DesktopInstanceProfile): string =>
	`${profile.endpoint}${profile.module}`.replace(/\/+$/, "");

export const platformUrlFor = (
	profile: DesktopInstanceProfile,
	hashPath = "/",
): string => {
	const base = `${profile.endpoint}${profile.platformPath}`.replace(
		/\/?$/,
		"/",
	);
	const normalizedHash = hashPath.startsWith("/") ? hashPath : `/${hashPath}`;
	return `${base}#${normalizedHash}`;
};

export const playgroundUrlFor = (profile: DesktopInstanceProfile): string => {
	const playgroundPath = profile.platformPath.replace(
		/\/packages\/client\/dist\/?$/,
		"/packages/playground/dist/",
	);
	return `${profile.endpoint}${playgroundPath}`.replace(/\/?$/, "/");
};
