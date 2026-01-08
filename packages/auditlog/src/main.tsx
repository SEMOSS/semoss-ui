import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
	<ErrorBoundary
		title="Something went wrong!"
		description="We're working hard to fix it. If the issue
                      persists, please reach out and let us know."
	>
		<App />
	</ErrorBoundary>,
);
