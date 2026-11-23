import { Outlet } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { RootLayout } from "./root-layout";

/**
 * Wait for the SDK's session to read the config and the user, then provide
 * the theme to every route. A session that could not be read is shown by
 * `AuthenticatedLayout`, so the login page stays reachable.
 */
export const InitializedLayout = () => {
	const status = useSession((state) => state.status);

	if (status === "INITIALIZING") {
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
