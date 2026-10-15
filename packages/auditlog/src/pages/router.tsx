import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { AuditLogPage } from "@/components/audit-log-page";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { LoginPage } from "./LoginPage";
import { RootLayout } from "./root-layout";

const router = createHashRouter([
	{
		path: "/",
		element: <AuthenticatedLayout />,
		children: [
			{ index: true, element: <AuditLogPage catalogName="Apps" /> },
		],
	},
	{
		path: "/login",
		element: <LoginPage />,
	},
]);

export const Router = () => {
	const { isInitialized } = useInsight();

	// don't render routes until the insight is ready
	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<RootLayout>
			<RouterProvider router={router} />
		</RootLayout>
	);
};
