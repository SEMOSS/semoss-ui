import { Outlet } from "react-router";
import { useConfig } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "./error-page";
import { RootLayout } from "./root-layout";

/**
 * Wait for the server config, which every route needs (theme, sign in
 * providers), then lay the app out.
 */
export const InitializedLayout = () => {
	const status = useConfig((state) => state.status);

	if (status === "ERROR") {
		return <ErrorPage />;
	}

	if (status !== "READY") {
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
