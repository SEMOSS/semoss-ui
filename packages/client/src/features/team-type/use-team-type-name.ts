import { formatUnderscoreLabel } from "@semoss/utility/text";
import { useConfig } from "@/hooks";
import { CUSTOM_TEAM_TYPE } from "./team-type";

/**
 * The display names the backend gives its login providers, by the label a team
 * stores. A team keeps its provider's label after that login is turned off,
 * when the server no longer lists it with its name.
 */
const PROVIDER_NAMES: Record<string, string> = {
	ADFS: "ADFS",
	CAC: "CAC",
	DROPBOX: "Dropbox",
	FORGEROCK: "Forgerock",
	GENERIC: "Generic",
	GITHUB: "GitHub",
	GITLAB: "GitLab",
	GOOGLE: "Google",
	JIRA: "Jira",
	KEYCLOAK: "Keycloak",
	LDAP: "Active Directory",
	LINKEDIN: "LinkedIn",
	LINOTP: "LinOTP",
	MICROSOFT: "Microsoft",
	NATIVE: "Native",
	OKTA: "Okta",
	PRODUCT_HUNT: "Product Hunt",
	SALESFORCE: "Salesforce",
	SAML: "SAML",
	SERVICENOW: "ServiceNow",
	SITEMINDER: "SiteMinder",
	SURVEYMONKEY: "SurveyMonkey",
	TWITTER: "Twitter",
};

/**
 * The name to show for where a team's members come from: "Custom", or the
 * login provider's display name, such as "Microsoft".
 *
 * @param type - CUSTOM, or the provider's label or key
 * @returns the server's name for the provider, the backend's usual name when
 * the server does not list it, or the type in title case
 */
export const useTeamTypeName = (type: string): string => {
	const providers = useConfig((state) => state.config.availableProviders);
	if (type === CUSTOM_TEAM_TYPE) {
		return "Custom";
	}
	const normalized = type.toUpperCase();
	const match = providers.find(
		(provider) =>
			(provider.label ?? provider.provider).toUpperCase() ===
				normalized || provider.provider.toUpperCase() === normalized,
	);
	return (
		match?.name ??
		PROVIDER_NAMES[normalized] ??
		formatUnderscoreLabel(type.toLowerCase())
	);
};
