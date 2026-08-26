import { Component, type ReactNode } from "react";

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
		return { message: err instanceof Error ? err.message : String(err) };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		if (this.state.message === null) {
			return this.props.children;
		}
		return (
			<div className="p-4 text-destructive text-sm">
				<div className="text-destructive/70 text-xs uppercase tracking-widest">
					Panel failed
				</div>
				<p className="mt-1">{this.state.message}</p>
			</div>
		);
	}
}
