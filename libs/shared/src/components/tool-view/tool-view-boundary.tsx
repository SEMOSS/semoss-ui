import { Component, type ErrorInfo, type ReactNode } from "react";

/** Props for {@link ToolViewBoundary}. */
export interface ToolViewBoundaryProps {
	/** Shown in place of a view that failed to load or render. */
	fallback: ReactNode;
	/** The view. */
	children: ReactNode;
}

interface ToolViewBoundaryState {
	hasFailed: boolean;
}

/**
 * Keeps a tool view that fails, such as one whose code could not be loaded,
 * from taking the conversation down with it: the host's fallback shows
 * instead.
 */
export class ToolViewBoundary extends Component<
	ToolViewBoundaryProps,
	ToolViewBoundaryState
> {
	state: ToolViewBoundaryState = { hasFailed: false };

	static getDerivedStateFromError(): ToolViewBoundaryState {
		return { hasFailed: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error("A tool view failed.", error, info.componentStack);
	}

	render(): ReactNode {
		return this.state.hasFailed ? this.props.fallback : this.props.children;
	}
}
