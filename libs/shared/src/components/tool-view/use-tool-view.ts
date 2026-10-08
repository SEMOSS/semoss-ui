import { useContext } from "react";
import { ToolViewContext } from "./tool-view.context";
import type { ToolViewComponent } from "./tool-view.types";
import { parseToolViewUri } from "./tool-view-uri";

/** A tool view the host can draw. */
export interface ResolvedToolView {
	/** The view's component. */
	component: ToolViewComponent;
	/** The URI's query parameters, which configure the view. */
	params: Readonly<Record<string, string>>;
}

/**
 * Find the view a tool's `component://` URI names among the host's
 * libraries.
 *
 * @param uri - The tool's `SMSS_MCP_UI.resourceURI`.
 * @return The view, or null when the URI names none the host renders.
 */
export const useToolView = (
	uri: string | undefined,
): ResolvedToolView | null => {
	const libraries = useContext(ToolViewContext);
	const parsed = parseToolViewUri(uri);
	if (!parsed || !Object.hasOwn(libraries, parsed.library)) {
		return null;
	}
	const library = libraries[parsed.library];
	if (!Object.hasOwn(library, parsed.view)) {
		return null;
	}
	return { component: library[parsed.view], params: parsed.params };
};
