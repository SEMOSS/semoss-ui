/**
 * URL of a dashboard's deployed SEMOSS portal (the published `public_home` app).
 * Must point at the SEMOSS backend origin, not the dev server.
 */
const BACKEND_ORIGIN = String(import.meta.env.ENDPOINT || "").replace(
	/\/+$/,
	"",
);
const MODULE_PATH = (
	String(import.meta.env.MODULE || "") || "/Monolith"
).replace(/\/+$/, "");

export const publishedPortalUrl = (id: string): string =>
	`${(BACKEND_ORIGIN || window.location.origin) + MODULE_PATH}/public_home/${encodeURIComponent(id)}/portals/`;

/**
 * Absolute URL this app is served from — the URL baked into MCP tool `resourceURI`s
 * and the host redirect so the SEMOSS playground (running on the Tomcat origin) can
 * open the app.
 *
 * Resolution order:
 *   1. `VITE_APP_URL` env — set this to the app's deployed URL (e.g.
 *      `http://<tomcat>/SemossWeb/packages/reporting-insights/dist/`) so registration
 *      bakes the correct URL **even when running the Vite dev server**.
 *   2. Otherwise the app's own `window.location` (origin + path, minus `index.html`).
 *      Correct automatically when the built app is opened under Tomcat; but on the dev
 *      server this resolves to `http://localhost:5176/`, which the playground can't
 *      reach — so set `VITE_APP_URL` for any host you register from dev.
 */
export const appPublicBaseUrl = (): string => {
	const configured = String(import.meta.env.VITE_APP_URL || "").trim();
	const raw = configured || window.location.origin + window.location.pathname;
	return (
		raw
			.replace(/index\.html$/i, "")
			.replace(/#.*$/, "")
			.replace(/\/+$/, "") + "/"
	);
};
