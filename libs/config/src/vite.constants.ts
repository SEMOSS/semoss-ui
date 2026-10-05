/** Fixed dev-server ports, one per app, to avoid collisions when running many at once. */
export const DEV_SERVER_PORTS = {
	client: 5173,
	playground: 5174,
	terminal: 5175,
	browserAutomation: 5176,
	auditlog: 5177,
	chromeExtension: 5178,
} as const;

/**
 * Groups every file under `locales/<lng>/` into a single `locale-<lng>` chunk so
 * loading or switching a language is one request and new languages never bloat the
 * main bundle. Returns `undefined` when the id is not a locale file.
 */
export function localeManualChunks(id: string): string | undefined {
	const locale = id.match(/\/locales\/([^/]+)\/.*\.json/);
	if (locale) {
		return `locale-${locale[1]}`;
	}
	return undefined;
}
