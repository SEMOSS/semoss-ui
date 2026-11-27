import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AgentCatalog } from "@/features/agents/agent-catalog";
import { AgentCreate } from "@/features/agents/agent-create";
import { KnowledgeLibrary } from "@/features/knowledge/knowledge-library";
import { EmbedPage } from "@/pages/embed.page";
import { ErrorPage } from "@/pages/error.page";
import { LoginPage } from "@/pages/login.page";
import { NewChatPage } from "@/pages/new-chat.page";
import { RoomPage } from "@/pages/room.page";
import { AgentDetailPage } from "./agent-detail.page";
import { AgentEditPage } from "./agent-edit.page";
import { AppLayout } from "./app-layout";
import { AuthenticatedLayout } from "./authenticated-layout";
import { InitializedLayout } from "./initialized-layout";
import { KnowledgeDetailPage } from "./knowledge-detail.page";

/** Every route, built once at module load so a rerender never resets navigation. */
const router = createHashRouter([
	{
		// catches errors in the layouts and the login page
		element: <InitializedLayout />,
		errorElement: <ErrorPage />,
		children: [
			{
				element: <AuthenticatedLayout />,
				children: [
					{
						element: <AppLayout />,
						children: [
							{
								// catches errors in the pages, keeping the navigation beside them
								errorElement: <ErrorPage isInnerComponent />,
								children: [
									{
										path: "new",
										element: <NewChatPage />,
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

/** The playground's hash router. */
export const Router = () => {
	return <RouterProvider router={router} />;
};
