/**
 * Embedded (read-only preview) detection.
 *
 * When a dashboard is shown inside the SEMOSS playground it renders the app in an
 * iframe. In that context the viewer should only VIEW the dashboard — the app
 * chrome (header) and management controls (Edit / Share / Delete / back) are hidden
 * so the tool preview is a clean, read-only render of the created dashboard.
 *
 * Detection order:
 *   1. explicit override — `?embed=1` / `?embed=0` (also read from the hash query,
 *      since the app uses HashRouter), useful for testing/forcing either mode.
 *   2. otherwise embedded iff running inside an iframe (`window.self !== window.top`).
 *      A cross-origin parent throws on access, which itself means we're embedded.
 */
export function isEmbedded(): boolean {
	if (typeof window === "undefined") return false;

	try {
		const search = new URLSearchParams(window.location.search);
		const hashQ = window.location.hash.includes("?")
			? new URLSearchParams(
					window.location.hash.slice(
						window.location.hash.indexOf("?") + 1,
					),
				)
			: new URLSearchParams();
		const v = (search.get("embed") ?? hashQ.get("embed"))?.toLowerCase();
		if (v === "1" || v === "true" || v === "yes") return true;
		if (v === "0" || v === "false" || v === "no") return false;
	} catch {
		/* fall through to iframe detection */
	}

	try {
		return window.self !== window.top;
	} catch {
		// Cross-origin parent → access denied → we ARE inside a (foreign) iframe.
		return true;
	}
}
