import { formatUnderscoreLabel } from "@semoss/utility/text";

/**
 * The display names the backend gives its logins, by the label it stores for a
 * person or a team. A label keeps its name here after that login is turned off,
 * when the server no longer lists it.
 */
export const LOGIN_TYPE_NAMES: Readonly<Record<string, string>> = {
	ADFS: "ADFS",
	// "API" rather than the backend's "API Login", since lists say "<name> login"
	API_USER: "API",
	CAC: "CAC",
	DROPBOX: "Dropbox",
	FORGEROCK: "Forgerock",
	GENERIC: "Generic",
	GITHUB: "GitHub",
	GITLAB: "GitLab",
	GOOGLE: "Google",
	GOOGLE_MAP: "GoogleMap",
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
	WINDOWS_USER: "Windows NLTM",
};

/**
 * @param type - a login's stored label, such as MICROSOFT or API_USER
 * @returns the backend's name for it, or the label in title case
 */
export const getLoginTypeName = (type: string): string =>
	LOGIN_TYPE_NAMES[type.toUpperCase()] ??
	formatUnderscoreLabel(type.toLowerCase());
