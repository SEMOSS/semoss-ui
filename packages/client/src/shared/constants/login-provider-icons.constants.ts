const LOGIN_PROVIDER_LOGO_LOADERS = {
	...import.meta.glob("../../assets/loginProviders/*.{png,svg}", {
		query: "?url",
		import: "default",
	}),
	...import.meta.glob("../../assets/img/*.{png,svg}", {
		query: "?url",
		import: "default",
	}),
} as Record<string, () => Promise<string>>;

const LOGIN_PROVIDER_LOGO_PATH_BY_PROVIDER: Record<string, string> = {
	adfs: "../../assets/loginProviders/MICROSOFT.png",
	cac: "../../assets/loginProviders/CAC.svg",
	dropbox: "../../assets/img/DROPBOX.png",
	generic: "../../assets/loginProviders/GENERIC.svg",
	github: "../../assets/img/GITHUB.svg",
	gitlab: "../../assets/loginProviders/GITLAB.svg",
	google: "../../assets/img/GOOGLE.svg",
	keycloak: "../../assets/loginProviders/KEYCLOAK.svg",
	linkedin: "../../assets/loginProviders/LINKEDIN.svg",
	microsoft: "../../assets/loginProviders/MICROSOFT.png",
	ms: "../../assets/loginProviders/MICROSOFT.png",
	okta: "../../assets/loginProviders/OKTA.svg",
	product_hunt: "../../assets/loginProviders/product_hunt.png",
	salesforce: "../../assets/loginProviders/SALESFORCE.svg",
	saml: "../../assets/loginProviders/saml.png",
	siteminder: "../../assets/loginProviders/siteminder.png",
	surveymonkey: "../../assets/loginProviders/SURVEYMONKEY.svg",
	twitter: "../../assets/loginProviders/X_TWITTER.svg",
	x_twitter: "../../assets/loginProviders/X_TWITTER.svg",
};

const LOGIN_PROVIDER_ALIASES: Record<string, string> = {
	azure: "ms",
	azure_ad: "ms",
	azuread: "ms",
	microsoft: "ms",
	office365: "ms",
	o365: "ms",
	x: "x_twitter",
};

export const getLoginProviderKey = (provider: string) => {
	const normalizedProvider = provider
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");

	const aliasedProvider = LOGIN_PROVIDER_ALIASES[normalizedProvider];
	if (aliasedProvider) return aliasedProvider;

	if (LOGIN_PROVIDER_LOGO_PATH_BY_PROVIDER[normalizedProvider]) {
		return normalizedProvider;
	}

	const tokenMatch = normalizedProvider
		.split("_")
		.find((token) => LOGIN_PROVIDER_LOGO_PATH_BY_PROVIDER[token]);

	return tokenMatch ?? normalizedProvider;
};

export const getLoginProviderLogoPath = (provider: string) => {
	const normalizedProvider = getLoginProviderKey(provider);
	return LOGIN_PROVIDER_LOGO_PATH_BY_PROVIDER[normalizedProvider] || null;
};

export const getLoginProviderInitials = (value: string) => {
	const tokens = value
		.trim()
		.split(/[\W_]+/)
		.filter(Boolean);

	if (tokens.length === 0) return "?";

	if (tokens.length === 1) {
		return tokens[0].slice(0, 2).toUpperCase();
	}

	return tokens
		.slice(0, 2)
		.map((token) => token[0])
		.join("")
		.toUpperCase();
};

export const loadLoginProviderLogo = async (provider: string) => {
	const logoPath = getLoginProviderLogoPath(provider);
	if (!logoPath) return null;

	const loadLogo = LOGIN_PROVIDER_LOGO_LOADERS[logoPath];
	if (!loadLogo) return null;

	try {
		return await loadLogo();
	} catch {
		return null;
	}
};

export const loadLoginProviderLogos = async (providers: string[]) => {
	const loadedPairs = await Promise.all(
		providers.map(async (provider) => {
			const normalizedProvider = getLoginProviderKey(provider);
			if (!normalizedProvider) return null;

			const logo = await loadLoginProviderLogo(normalizedProvider);
			if (!logo) return null;

			return [normalizedProvider, logo] as const;
		}),
	);

	return loadedPairs.reduce(
		(accumulator, loadedPair) => {
			if (!loadedPair) return accumulator;

			const [provider, logo] = loadedPair;
			accumulator[provider] = logo;

			return accumulator;
		},
		{} as Record<string, string>,
	);
};
