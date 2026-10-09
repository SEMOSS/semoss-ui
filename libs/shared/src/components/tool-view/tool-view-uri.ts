/**
 * The scheme of a tool view the host draws with one of its own components,
 * in the page, rather than loading a page in a frame.
 */
export const TOOL_VIEW_URI_SCHEME = "component://";

/** A `component://<library>/<view>?<params>` URI, read. */
export interface ToolViewUri {
	/** The library, such as `mail`, lowercased. */
	library: string;
	/** The view in it, such as `compose`, lowercased. */
	view: string;
	/** The query parameters, such as `{ intent: "reply", provider: "google" }`. */
	params: Readonly<Record<string, string>>;
}

/** A library and a view name, each letters, digits, and dashes. */
const TOOL_VIEW_URI =
	/^component:\/\/([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)\/?(?:\?(.*))?$/i;

/**
 * Whether a tool's `resourceURI` names a host component. Such a URI is never
 * a page: a host that cannot draw the view shows its generic view instead.
 *
 * @param uri - The tool's `SMSS_MCP_UI.resourceURI`.
 * @return Whether it is a `component://` URI.
 */
export const isToolViewUri = (uri: string | undefined): boolean =>
	uri?.trim().toLowerCase().startsWith(TOOL_VIEW_URI_SCHEME) ?? false;

/**
 * Read a `component://<library>/<view>?<params>` URI.
 *
 * @param uri - The tool's `SMSS_MCP_UI.resourceURI`.
 * @return The library, view, and parameters, or null when it is not one.
 */
export const parseToolViewUri = (
	uri: string | undefined,
): ToolViewUri | null => {
	const match = uri ? TOOL_VIEW_URI.exec(uri.trim()) : null;
	if (!match) {
		return null;
	}
	const [, library, view, query = ""] = match;
	return {
		library: library.toLowerCase(),
		view: view.toLowerCase(),
		params: Object.fromEntries(new URLSearchParams(query)),
	};
};
