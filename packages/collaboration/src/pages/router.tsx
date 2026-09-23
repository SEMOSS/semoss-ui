import { useState } from "react";
import { createHashRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AgentIndex } from "@/components/layouts/agent-index";
import { AgentLayout } from "@/components/layouts/agent-layout";
import { AgentRoomLayout } from "@/components/layouts/agent-room-layout";
import { AuthorizedLayout } from "@/components/layouts/authorized-layout";
import { MainLayout } from "@/components/layouts/main-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { AgentSettingsPage } from "@/pages/agent-settings.page";
import { AgentsOverviewPage } from "@/pages/agents-overview.page";
import { ErrorPage } from "@/pages/error.page";
import { HomePage } from "@/pages/home.page";
import { LoginPage } from "@/pages/login.page";
import { NewRoomPage } from "@/pages/new-room.page";
import { NotFoundPage } from "@/pages/not-found.page";
import { RoomPage } from "@/pages/room.page";
import { SettingsPage } from "@/pages/settings.page";

const routes: RouteObject[] = [
	{
		Component: RootLayout,
		ErrorBoundary: ErrorPage,
		children: [
			{
				id: "authorized",
				Component: AuthorizedLayout,
				ErrorBoundary: ErrorPage,
				children: [
					{
						id: "main",
						Component: MainLayout,
						children: [
							{
								index: true,
								id: "home",
								Component: HomePage,
							},
							{
								path: "new",
								id: "room-new",
								Component: NewRoomPage,
							},
							{
								path: "agents",
								id: "agents",
								Component: AgentsOverviewPage,
							},
							{
								path: "agents/new",
								id: "agent-new",
								Component: AgentSettingsPage,
							},
							{
								path: "agents/:agentId",
								id: "agent",
								Component: AgentLayout,
								children: [
									{
										index: true,
										id: "agent-index",
										Component: AgentIndex,
									},
									{
										path: "settings",
										id: "agent-settings",
										Component: AgentSettingsPage,
									},
									{
										id: "agent-room-layout",
										Component: AgentRoomLayout,
										children: [
											{
												path: ":roomId",
												id: "room",
												Component: RoomPage,
											},
										],
									},
								],
							},
							{
								path: "settings",
								id: "settings",
								Component: SettingsPage,
							},
							{
								path: "*",
								id: "not-found",
								Component: NotFoundPage,
							},
						],
					},
				],
			},
			{
				path: "/login",
				id: "login",
				Component: LoginPage,
			},
		],
	},
];

export const Router = () => {
	const [router] = useState(() => createHashRouter(routes));
	return <RouterProvider router={router} />;
};
