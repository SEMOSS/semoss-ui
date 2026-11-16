import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AgentCatalog } from "@/features/agents/agent-catalog";
import { AgentCreate } from "@/features/agents/agent-create";
import { KnowledgeLibrary } from "@/features/knowledge/knowledge-library";
import { EmbedPage } from "@/pages/embed.page";
import { ErrorPage } from "@/pages/error.page";
import { LoginPage } from "@/pages/login.page";
import { NewRoomPage } from "@/pages/new-room.page";
import { RoomPage } from "@/pages/room.page";
import { AgentDetailPage } from "./agent-detail.page";
import { AgentEditPage } from "./agent-edit.page";
import { AuthenticatedLayout } from "./authenticated-layout";
import { InitializedLayout } from "./initialized-layout";
import { KnowledgeDetailPage } from "./knowledge-detail.page";
import { MainLayout } from "./main-layout";

const router = createHashRouter([
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
								errorElement: <ErrorPage isInnerComponent />,
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
										path: "embed/*",
										element: <EmbedPage />,
									},
									{
										path: "agent",
										element: <AgentCatalog />,
									},

									{
										path: "agent/new",
										element: <AgentCreate />,
									},
									{
										path: "agent/:workspaceId",
										element: <AgentDetailPage />,
									},
									{
										path: "agent/:workspaceId/edit",
										element: <AgentEditPage />,
									},
									{
										path: "knowledge",
										element: <KnowledgeLibrary />,
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
]);

/**
 * The main router for the application. It handles the routing logic and renders the appropriate components based on the current URL.
 */
export const Router = () => {
	return <RouterProvider router={router} />;
};
