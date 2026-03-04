import { Outlet } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "./error-page";
import { RootLayout } from "./root-layout";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const InitializedLayout = () => {
	const { isInitialized, error } = useInsight();

	if (error) {
		// Show an error page if there was an error during initialization
		return <ErrorPage />;
	} else if (!isInitialized) {
		// don't load anything if it is pending
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<RootLayout>
			<Outlet />
		</RootLayout>
	);
};
