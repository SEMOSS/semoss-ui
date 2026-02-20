import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthenticatedLayout } from "./authenticated-layout";
import { DashboardPage } from "./dashboard-page";
import { ErrorPage } from "./error-page";
import { InitializedLayout } from "./initialized-layout";
import { LoginPage } from "./login-page";
import { MainLayout } from "./main-layout";
import { RulesPage } from "./rules-page";
import { SettingsPage } from "./settings-page";
import { ValidateRulesPage } from "./validate-rules-page";
import { VisualizeRulesPage } from "./visualize-rules-page";

const router = createHashRouter(
	[
		{
			// wrap everything in an error boundary to catch any errors in the layouts or login page
			element: <InitializedLayout />,
			errorElement: <ErrorPage />,
			children: [
				{
					element: <AuthenticatedLayout />,
					children: [
						{
							element: <MainLayout />,
							// all the main app routes
							// wrap in an error boundary to catch any errors
							errorElement: <ErrorPage isInnerComponent />,
							children: [
								{
									path: "/",
									element: <DashboardPage />,
								},
								{
									path: "/dashboard",
									element: <DashboardPage />,
								},
								{
									path: "/rules",
									element: <RulesPage />,
								},
								{
									path: "/visualize-rules",
									element: <VisualizeRulesPage />,
								},
								{
									path: "/visualize-rules/:ruleId",
									element: <VisualizeRulesPage />,
								},
								{
									path: "/validate-rules",
									element: <ValidateRulesPage />,
								},
								{
									path: "/settings",
									element: <SettingsPage />,
								},
								{
									path: "*",
									element: <Navigate to="/" replace />,
								},
							],
						},
					],
				},
				{
					path: "/login",
					element: <LoginPage />,
				},
				{
					path: "*",
					element: <Navigate to="/login" replace />,
				},
			],
		},
	],
	{
		future: {
			v7_relativeSplatPath: true,
		},
	},
);

/**
 * The main router for the application. It handles the routing logic and renders the appropriate components based on the current URL.
 */
export const Router = () => {
	return <RouterProvider router={router} />;
};
