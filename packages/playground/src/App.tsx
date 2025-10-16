import { Env, InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

export const App = () => {
	return (
		<InsightProvider>
			<ThemeProvider>
				<div className="absolute inset-0 overflow-hidden">
					<Router />
				</div>
				<Toaster />
			</ThemeProvider>
		</InsightProvider>
	);
};
