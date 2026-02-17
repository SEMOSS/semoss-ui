import { Env, InsightProvider } from "@semoss/sdk/react";
import { Toaster } from "@/components/sonner";
import { Router } from "./pages";

if (import.meta.env.DEV) {
	Env.update({
		MODULE: import.meta.env.MODULE || "",
		ACCESS_KEY: import.meta.env.ACCESS_KEY || "", // undefined in production
		SECRET_KEY: import.meta.env.SECRET_KEY || "", // undefined in production
		APP: import.meta.env.APP || "",
	});
}

/**
 * Renders the SEMOSS React app.
 *
 * @component
 */
export const App = () => {
	return (
		// The InsightProvider starts a new Insight and sets the context to the current project. This components are imported from SEMOSS SDK
		<InsightProvider>
			{/* The Router decides which page to render based on the url.
					This component is custom to this project, and can be edited in Router.tsx */}
			<Router />
			<Toaster />
		</InsightProvider>
	);
};
