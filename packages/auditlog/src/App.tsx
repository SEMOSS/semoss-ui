import { Env, InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

function App() {
	return (
		<InsightProvider>
			<ThemeProvider defaultTheme="light">
				<div className="absolute inset-0 h-screen w-screen overflow-auto">
					<Router />
				</div>
				<Toaster />
			</ThemeProvider>
		</InsightProvider>
	);
}

export default App;
