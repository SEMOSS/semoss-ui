import { type ReactNode, Suspense } from "react";
import type { ToolViewProps } from "./tool-view.types";
import { ToolViewBoundary } from "./tool-view-boundary";
import type { ResolvedToolView } from "./use-tool-view";

/** Props for {@link ToolViewRenderer}. */
export interface ToolViewRendererProps extends Omit<ToolViewProps, "params"> {
	/** The view, from `useToolView`. */
	view: ResolvedToolView;
	/** Shown while the view's code loads. */
	loading: ReactNode;
	/** Shown in place of a view that fails to load or render. */
	fallback: ReactNode;
}

/**
 * Draws a `component://` tool view inside the host's own chrome, with the
 * URI's parameters, a placeholder while it loads, and the host's fallback if
 * it fails.
 */
export const ToolViewRenderer = ({
	view,
	loading,
	fallback,
	...props
}: ToolViewRendererProps) => {
	const View = view.component;
	return (
		<ToolViewBoundary fallback={fallback}>
			<Suspense fallback={loading}>
				<View {...props} params={view.params} />
			</Suspense>
		</ToolViewBoundary>
	);
};
