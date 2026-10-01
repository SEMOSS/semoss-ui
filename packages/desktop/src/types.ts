export interface DesktopInstanceProfile {
	id: string;
	displayName: string;
	endpoint: string;
	module: string;
	platformPath: string;
	allowInsecureHttp: boolean;
}

export interface LoginProvider {
	provider: string;
	name: string;
	label?: string;
	isOauth: boolean;
}

export interface InstanceTheme {
	name: string;
	logo: string;
	logoLight: string;
	includeNameWithLogo: boolean;
	loginHeroImage: string;
	loginHeroImageDark: string;
}

export interface InstanceConfig {
	logins?: Record<string, unknown>;
	availableProviders?: LoginProvider[];
	nativeRegistration?: boolean;
	csrf?: boolean;
	"X-CSRF-Token"?: string;
	version?: {
		version?: string;
		datetime?: string;
	};
	theme?: {
		THEME_MAP?: string;
	};
	[key: string]: unknown;
}

export interface DesktopUser {
	id: string;
	name: string;
	email: string;
	provider: string;
	lastLogin?: string;
	defaultTextGenerationModelId: string;
}

export interface CatalogItem {
	id: string;
	name: string;
	type: string;
	subtype?: string;
	description?: string;
	favorite?: boolean;
}

export type ConnectionStatus =
	| "idle"
	| "loading"
	| "connected"
	| "authenticated"
	| "error";
