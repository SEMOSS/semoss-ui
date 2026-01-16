import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthenticatedLayout } from "./authenticated-layout";
import { EditWorkspacePage } from "./edit-workspace-page";
import { EmbedPage } from "./embed-page";
import { ErrorPage } from "./error-page";
import { InitializedLayout } from "./initialized-layout";
import { LoginPage } from "./login-page";
import { MainLayout } from "./main-layout";
import { NewRoomPage } from "./new-room-page";
import { NewWorkspacePage } from "./new-workspace-page";
import { RoomPage } from "./room-page";
import { WorkspaceDetailPage } from "./workspace-detail-page";
import { WorkspacePage } from "./workspace-page";

const router = createHashRouter(
	[
		{
			// wrap eveything in an error boundary to catch any errors in the layouts or login page
			element: <InitializedLayout />,
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
											path: "embed/:path",
											element: <EmbedPage />,
										},
										{
											path: "workspace",
											element: <WorkspacePage />,
										},
										{
											path: "workspace/new",
											element: <NewWorkspacePage />,
										},
										{
											path: "workspace/:workspaceId",
											element: <WorkspaceDetailPage />,
										},
										{
											path: "workspace/:workspaceId/edit",
											element: <EditWorkspacePage />,
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
	return <RouterProvider router={router} />;
};
