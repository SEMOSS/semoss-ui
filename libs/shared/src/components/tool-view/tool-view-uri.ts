/**
 * The scheme of a tool view the host draws with one of its own components,
 * in the page, rather than loading a page in a frame.
 */
export const TOOL_VIEW_URI_SCHEME = "component://";

/** A `component://<componentName>?<params>` URI, read. */
export interface ToolViewUri {
	/** The complete registered component name, such as `mail-compose`, lowercased. */
	componentName: string;
	/** The query parameters, such as `{ intent: "reply", provider: "google" }`. */
	params: Readonly<Record<string, string>>;
}

/** One flat name of letters, digits, and dashes; paths and fragments are not views. */
const TOOL_VIEW_URI = /^component:\/\/([a-z0-9][a-z0-9-]*)(?:\?([^#\r\n]*))?$/i;

/**
 * Whether a tool's `resourceURI` names a host component. Such a URI is never
 * a page: a host that cannot draw the view shows its generic view instead.
 *
 * @param uri - The tool's `SMSS_MCP_UI.resourceURI`.
 * @return Whether it uses the component scheme, even if its syntax is invalid.
 */
export const isToolViewUri = (uri: unknown): boolean =>
	typeof uri === "string" && /^component:/i.test(uri.trim());

/**
 * Read a `component://<componentName>?<params>` URI.
 *
 * @param uri - The tool's `SMSS_MCP_UI.resourceURI`.
 * @return The component name and parameters, or null when it is not one.
 */
export const parseToolViewUri = (uri: unknown): ToolViewUri | null => {
	const match =
		typeof uri === "string" ? TOOL_VIEW_URI.exec(uri.trim()) : null;
	if (!match) {
		return null;
	}
	const [, componentName, query = ""] = match;
	return {
		componentName: componentName.toLowerCase(),
		params: Object.fromEntries(new URLSearchParams(query)),
	};
};
