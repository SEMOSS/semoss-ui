import { useState } from "react";
import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import {
	AgentCatalogView,
	AgentNewView,
	KnowledgeView,
	RoomsListView,
} from "@semoss/chat";
import type { ChatPreferencesAdapter } from "@semoss/sdk";
import { LoginPage } from "../features/auth/login-page";
import type { InstanceStore } from "../features/instances/instance.store";
import { AgentDetailPage } from "./agent-detail-page";
import { AgentEditPage } from "./agent-edit-page";
import { AuthenticatedLayout } from "./authenticated-layout";
import { DesktopLayout } from "./desktop-layout";
import { InitializedLayout } from "./initialized-layout";
import { KnowledgeDetailPage } from "./knowledge-detail-page";
import { NewRoomPage } from "./new-room-page";
import { RoomPage } from "./room-page";

/** Props for {@link DesktopRouter}. */
export interface DesktopRouterProps {
	/** The saved instances; one is in use. */
	instances: InstanceStore;
	/** Where the picked model is kept. */
	preferences: ChatPreferencesAdapter;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

/**
 * The routes of the signed in app, and sign in: the instance's config first,
 * then the session, then the chat's surfaces from `@semoss/chat`.
 *
 * @component
 */
export const DesktopRouter = ({
	instances,
	preferences,
	onSwitchServer,
	onSignOut,
}: DesktopRouterProps) => {
	// made once: a new router would start the app's navigation over. The
	// props are the app's long-lived stores and callbacks.
	const [router] = useState(() =>
		createHashRouter([
			{
				element: <InitializedLayout onSwitchServer={onSwitchServer} />,
				children: [
					{
						path: "login",
						element: (
							<LoginPage
								instances={instances}
								onSwitchServer={onSwitchServer}
							/>
						),
					},
					{
						element: <AuthenticatedLayout />,
						children: [
							{
								element: (
									<DesktopLayout
										preferences={preferences}
										onSwitchServer={onSwitchServer}
										onSignOut={onSignOut}
									/>
								),
								children: [
									{ path: "new", element: <NewRoomPage /> },
									{
										path: "room/:roomId",
										element: <RoomPage />,
									},
									{
										path: "chats",
										element: <RoomsListView />,
									},
									{
										path: "agent",
										element: <AgentCatalogView />,
									},
									{
										path: "agent/new",
										element: <AgentNewView />,
									},
									{
										path: "agent/:agentId",
										element: <AgentDetailPage />,
									},
									{
										path: "agent/:agentId/edit",
										element: <AgentEditPage />,
									},
									{
										path: "knowledge",
										element: <KnowledgeView />,
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
		]),
	);
	return <RouterProvider router={router} />;
};
