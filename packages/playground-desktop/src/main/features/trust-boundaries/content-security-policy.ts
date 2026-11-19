/**
 * Boundary: what the app page may load and run.
 * Enforces: only the app's own built files run as script on the app origin.
 * Server files forwarded on that origin under the module are not script
 * sources, so nothing a server serves can run with the bridge. Frames come
 * only from the tool frame origin, blobs, data, and https pages (such as
 * previews). No page may frame the app page.
 * Exceptions, each one needed by the app's own code, none letting a server
 * file run:
 * - `'unsafe-eval'` and `'wasm-unsafe-eval'`: Monaco, Mermaid and the Office
 *   viewers evaluate code; the app's own scripts may, but load no other's.
 * - `blob:` scripts and workers: Monaco and the PDF viewer start workers so.
 * - `connect-src ws: wss:`: the insight socket, through the proxy.
 * - `img-src https: http:`: images in messages come from anywhere, as on the web.
 * - `style-src 'unsafe-inline'`: the UI library sets inline styles.
 * - `object-src 'none'` is kept as it was, so a PDF preview in an `<object>`
 *   shows its fallback.
 * Development serves the page from electron-vite with no policy; it is not a
 * boundary.
 */

/** The folder the built renderer keeps every script and worker in. */
const ASSETS_PATH = "/assets/";

/**
 * The production page's Content-Security-Policy.
 *
 * @param origins - The app's origin and the tool frame origin.
 * @returns The policy.
 */
export const appPagePolicy = ({
	appOrigin,
	toolFrameOrigin,
}: {
	readonly appOrigin: string;
	readonly toolFrameOrigin: string;
}): string =>
	[
		"default-src 'self'",
		// the app's own built files only: never a server file under the module
		`script-src ${appOrigin}${ASSETS_PATH} 'unsafe-eval' 'wasm-unsafe-eval' blob:`,
		// Monaco runs its workers from blob URLs
		`worker-src ${appOrigin}${ASSETS_PATH} blob:`,
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https: http:",
		"font-src 'self' data: https://fonts.gstatic.com",
		"media-src 'self' data: blob:",
		// the proxy and its sockets; the PowerPoint viewer fetches its fallback fonts' stylesheet
		"connect-src 'self' ws: wss: data: blob: https://fonts.googleapis.com https://fonts.gstatic.com",
		// tool views, and https previews as on the web; never this machine's other origins
		`frame-src ${toolFrameOrigin} blob: data: https:`,
		"frame-ancestors 'none'",
		"form-action 'self'",
		"object-src 'none'",
		"base-uri 'self'",
	].join("; ");
