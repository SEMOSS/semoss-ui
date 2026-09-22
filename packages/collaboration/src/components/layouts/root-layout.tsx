import { Outlet } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Spinner, Toaster, TooltipProvider } from "@semoss/ui/next";
import { ErrorPage } from "@/pages/error.page";

/**
 * Renders the base layout. Shows an error or spinner if not initialized, and
 * provides the app-wide tooltip context.
 */
export const RootLayout = () => {
	const { isInitialized, error } = useInsight();

	return (
		<TooltipProvider delayDuration={250}>
			<div className="flex h-dvh flex-col">
				{/* Allow users to navigate around the app */}

				{isInitialized ? (
					// If initialized, set up padding and scroll
					<div className="h-full overflow-auto p-4">
						{/* Outlet is a react router component; it allows the router to choose the child based on the route */}
						<Outlet />
					</div>
				) : error ? (
					// If there was an error during initialization, show it
					<ErrorPage />
				) : (
					<div className="flex h-full w-full items-center justify-center py-4">
						<Spinner aria-label="Loading collaboration workspace" />
					</div>
				)}
				<Toaster />
			</div>
		</TooltipProvider>
	);
};
