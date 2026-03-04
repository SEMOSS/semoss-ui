import React from "react";
import ReactDOM from "react-dom/client";
import SemossChatbotApp from "./App";

// Simple error boundary for debugging
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("React Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						padding: "20px",
						color: "#ff6b6b",
						fontFamily: "monospace",
					}}
				>
					<h2>React Error</h2>
					<pre>{this.state.error?.toString()}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}

// Initialize React app when DOM is ready
console.log("React app initializing...");
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<ErrorBoundary>
		<SemossChatbotApp />
	</ErrorBoundary>,
);
