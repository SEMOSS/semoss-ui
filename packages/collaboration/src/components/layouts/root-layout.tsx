import { Outlet } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Spinner, TooltipProvider } from "@semoss/ui/next";
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
				{isInitialized ? (
					<div className="h-full overflow-auto p-4">
						<Outlet />
					</div>
				) : error ? (
					<ErrorPage />
				) : (
					<div className="flex h-full w-full items-center justify-center py-4">
						<Spinner aria-label="Loading collaboration workspace" />
					</div>
				)}
			</div>
		</TooltipProvider>
	);
};
