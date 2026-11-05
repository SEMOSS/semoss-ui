import { Outlet } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "./error-page";
import { RootLayout } from "./root-layout";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const InitializedLayout = () => {
	const status = useSession((state) => state.status);

	if (status === "ERROR") {
		// Show an error page if the session could not be read
		return <ErrorPage />;
	} else if (status === "INITIALIZING") {
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
