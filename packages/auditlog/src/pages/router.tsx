import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
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

/**
 * The app's routes. Each route waits on the SDK's session itself: the login
 * page and `AuthenticatedLayout` read `useSession`.
 */
export const Router = () => {
	return (
		<RootLayout>
			<RouterProvider router={router} />
		</RootLayout>
	);
};
