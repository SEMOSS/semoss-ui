import { Component, type ReactNode } from "react";
import { WorkbenchPanelError } from "./workbench-panel-error";

interface WorkbenchPanelErrorBoundaryProps {
	/** Reported once when the panel body throws. */
	onError: () => void;
	children: ReactNode;
}

interface WorkbenchPanelErrorBoundaryState {
	message: string | null;
}

/** Contains a broken panel body so it can't take the workbench down. */
export class WorkbenchPanelErrorBoundary extends Component<
	WorkbenchPanelErrorBoundaryProps,
	WorkbenchPanelErrorBoundaryState
> {
	state: WorkbenchPanelErrorBoundaryState = { message: null };

	static getDerivedStateFromError(
		err: unknown,
	): WorkbenchPanelErrorBoundaryState {
		const message = err instanceof Error ? err.message : String(err);
		return { message: message.trim() || "Unknown Error" };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		if (this.state.message === null) {
			return this.props.children;
		}
		return (
			<WorkbenchPanelError
				message={this.state.message}
				testId="workbench-panel-error-message"
			/>
		);
	}
}
