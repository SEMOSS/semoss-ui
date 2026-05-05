import { Env, InsightProvider } from "@semoss/sdk/react";
import { LoadingScreen, ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

/**
 * The App component is the main entry point of the application.
 * It contains the Notification, LoadingScreen, ThemeProvider and Router components.
 * The ThemeProvider is used to set the default theme to "light".
 * The Router is used to render the pages.
 * The LoadingScreen is used to display a loading indicator when the application is loading.
 * The Notification is used to display notifications to the user.
 * The InsightProvider is used to provide insights to the application.
 */
function App() {
	return (
		<InsightProvider>
			<LoadingScreen>
				<ThemeProvider defaultTheme="light">
					<div className="absolute inset-0 h-screen w-screen overflow-auto">
						<Router />
					</div>
					<Toaster />
				</ThemeProvider>
			</LoadingScreen>
		</InsightProvider>
	);
}

export default App;
