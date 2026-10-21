import { Component, type ReactNode } from "react";
import { Alert, AlertDescription } from "@semoss/ui/next";

/** Keeps a failed optional graph download or render inside the flow section. */
// biome-ignore lint/nursery/useReactFunctionComponents: React error boundaries require a class.
export class RoutineFlowBoundary extends Component<
	{ children: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError(): { hasError: boolean } {
		return { hasError: true };
	}

	render() {
		return this.state.hasError ? (
			<Alert variant="destructive">
				<AlertDescription>
					The flow could not load. Refresh the page to try again.
				</AlertDescription>
			</Alert>
		) : (
			this.props.children
		);
	}
}
