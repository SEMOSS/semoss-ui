/**
 * Whether the app runs inside another page's frame, read once when the module
 * loads; a cross-origin parent, which throws, counts.
 */
export const isIframed: boolean = (() => {
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
})();
