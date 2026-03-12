import { createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { DocumentLibrary } from "@/pages/knowledge-page";
import { EditWorkspacePage } from "./edit-workspace-page";
import { EmbedPage } from "./embed-page";
import { ErrorPage } from "./error-page";
import { InitializedLayout } from "./initialized-layout";
import { KnowledgeDetailPage } from "./knowledge-detail-page";
import { MainLayout } from "./main-layout";
import { NewWorkspacePage } from "./new-workspace-page";
import { WorkspaceDetailPage } from "./workspace-detail-page";
import { WorkspacePage } from "./workspace-page";

const router = createHashRouter([
	{
		element: <InitializedLayout />,
		errorElement: <ErrorPage />,
		children: [
			{
				element: <MainLayout />,
				children: [
					{
						// all the main app routes
						// wrap in an error boundary to catch any errors in the room or workspace pages
						errorElement: <ErrorPage isInnerComponent />,
						children: [
							{
								path: "embed/:path",
								element: <EmbedPage />,
							},
							{
								path: "agent",
								element: <WorkspacePage />,
							},
							{
								path: "agent/new",
								element: <NewWorkspacePage />,
							},
							{
								path: "agent/:workspaceId",
								element: <WorkspaceDetailPage />,
							},
							{
								path: "agent/:workspaceId/edit",
								element: <EditWorkspacePage />,
							},
							{
								path: "knowledge",
								element: <DocumentLibrary />,
							},
							{
								path: "knowledge/:knowledgeId",
								element: <KnowledgeDetailPage />,
							},
							{
								path: "*",
								element: <Navigate to="/new" replace />,
							},
						],
					},
				],
			},
		],
	},
]);

/**
 * The main router for the application. It handles the routing logic and renders the appropriate components based on the current URL.
 */
export const Router = () => {
	return <RouterProvider router={router} />;
};
