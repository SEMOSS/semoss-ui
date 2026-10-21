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
	if (!parsed) {
		return null;
	}
	let component: ToolViewComponent | undefined;
	for (const library of Object.values(libraries)) {
		if (!Object.hasOwn(library, parsed.componentName)) continue;
		// Ambiguous registrations must not depend on library insertion order.
		if (component) return null;
		component = library[parsed.componentName];
	}
	return component ? { component, params: parsed.params } : null;
};
