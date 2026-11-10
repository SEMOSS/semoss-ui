import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./error-state";

interface ErrorBoundaryProps {
	/**
	 * Title of the boundary
	 **/
	title?: string;

	/**
	 * Description of the boundary
	 **/
	description?: string;

	/**
	 * Component that will be rendered if errored.
	 */
	fallback?: ReactNode;

	children?: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
	hasError: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public state: ErrorBoundaryState = {
		error: null,
		hasError: false,
	};

	/**
	 * Update state so the next render will show the fallback UI.
	 */
	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error: error,
		};
	}

	/**
	 * Catch the error an log it
	 */
	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			// render nothing if its passed in as "null"
			if (this.props.fallback === null || this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<ErrorState
					title={this.props.title}
					description={this.props.description}
					className="absolute inset-0 h-auto w-auto"
				>
					{this.state.error ? (
						<div className="mt-2 flex items-center gap-2 rounded-md bg-destructive px-4 py-3 text-destructive-foreground text-sm">
							{this.state.error.message}
						</div>
					) : null}
				</ErrorState>
			);
		}

		return this.props.children;
	}
}
