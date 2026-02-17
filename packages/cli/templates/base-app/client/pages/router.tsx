import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { ErrorPage } from "./error-page";
import { HomePage } from "./home-page";
import { AuthorizedLayout, InitializedLayout } from "./layouts";
import { LoginPage } from "./login-page";

const router = createHashRouter([
	{
		// Wrap every route in InitializedLayout to ensure SEMOSS is ready to handle requests
		Component: InitializedLayout,
		// Catch errors in any of the initialized pages, to prevent the whole app from crashing
		ErrorBoundary: ErrorPage,
		children: [
			{
				// Wrap pages that should only be available to logged in users
				Component: AuthorizedLayout,
				// Also catch errors in any of the authorized pages, allowing the navigation to continue working
				ErrorBoundary: ErrorPage,
				children: [
					{
						// If the path is empty, use the home page
						index: true,
						Component: HomePage,
					},
					// {
					//     // Example of a new page
					//     path: '/new-page',
					//     Component: NewPage,
					// }
				],
			},
			{
				// The login page should be available to non-logged in users (duh)
				path: "/login",
				Component: LoginPage,
			},
			{
				// Any other urls should be sent to the home page
				path: "*",
				Component: () => <Navigate to="/" />,
			},
		],
	},
]);

/**
 * Renders pages based on url.
 *
 * @component
 */
export const Router = () => {
	return <RouterProvider router={router} />;
};
