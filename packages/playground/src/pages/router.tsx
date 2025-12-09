import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { AuthenticatedLayout } from "./authenticated-layout";
import { ErrorPage } from "./error-page";
import { LoginPage } from "./login-page";
import { MainLayout } from "./main-layout";
import { NewRoomPage } from "./new-room-page";
import { RoomPage } from "./room-page";
import { RootLayout } from "./root-layout";
import { WorkspaceDetailPage } from "./workspace-detail-page";
import { WorkspacePage } from "./workspace-page";

const router = createHashRouter(
	[
		{
			// wrap eveything in an error boundary to catch any errors in the layouts or login page
			errorElement: <ErrorPage />,
			children: [
				{
					element: <AuthenticatedLayout />,
					children: [
						{
							element: <MainLayout />,
							children: [
								{
									// all the main app routes
									// wrap in an error boundary to catch any errors in the room or workspace pages
									errorElement: (
										<ErrorPage isInnerComponent />
									),
									children: [
										{
											path: "new",
											element: <NewRoomPage />,
										},
										{
											path: "room/:roomId",
											element: <RoomPage />,
										},
										{
											path: "workspace",
											element: <WorkspacePage />,
										},
										{
											path: "workspace/:workspaceId",
											element: <WorkspaceDetailPage />,
										},
										{
											path: "*",
											element: (
												<Navigate to="/new" replace />
											),
										},
									],
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
	const { isInitialized, error } = useInsight();

	// don't load anything if it is pending
	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (error) {
		return "Error";
	}

	return (
		<RootLayout>
			<RouterProvider router={router} />
		</RootLayout>
	);
};
