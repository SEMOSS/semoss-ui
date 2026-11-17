/**
 * Whether the chat runs in a frame, read once when the module loads; a frame
 * without access to its parent counts.
 */
export const isIframed: boolean = (() => {
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
})();
