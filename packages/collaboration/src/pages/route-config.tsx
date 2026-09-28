import type { RouteObject } from "react-router";
import { AgentLayout } from "@/components/layouts/agent-layout";
import { AgentRoomLayout } from "@/components/layouts/agent-room-layout";
import { AuthorizedLayout } from "@/components/layouts/authorized-layout";
import { MainLayout } from "@/components/layouts/main-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { ErrorPage } from "@/pages/error.page";
import { NotFoundPage } from "@/pages/not-found.page";

/** Collaboration route hierarchy with leaf pages loaded on demand. */
export const routes: RouteObject[] = [
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
								lazy: async () => ({
									Component: (
										await import("@/pages/home.page")
									).HomePage,
								}),
							},
							{
								path: "new",
								id: "room-new",
								lazy: async () => ({
									Component: (
										await import("@/pages/new-room.page")
									).NewRoomPage,
								}),
							},
							{
								path: "room",
								id: "sessions",
								lazy: async () => ({
									Component: (
										await import("@/pages/sessions.page")
									).SessionsPage,
								}),
							},
							{
								path: "room/:roomId",
								id: "room-agent",
								Component: AgentLayout,
								children: [
									{
										id: "room-layout",
										Component: AgentRoomLayout,
										children: [
											{
												index: true,
												id: "room",
												lazy: async () => ({
													Component: (
														await import(
															"@/pages/room.page"
														)
													).RoomPage,
												}),
											},
										],
									},
									{
										path: "*",
										id: "room-not-found",
										Component: NotFoundPage,
									},
								],
							},
							{
								path: "agents",
								id: "agents",
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/agents-overview.page"
										)
									).AgentsOverviewPage,
								}),
							},
							{
								path: "agents/new",
								id: "agent-new",
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/agent-settings.page"
										)
									).AgentSettingsPage,
								}),
							},
							{
								path: "agents/:agentId",
								id: "agent",
								Component: AgentLayout,
								children: [
									{
										index: true,
										id: "agent-not-found",
										Component: NotFoundPage,
									},
									{
										path: "settings",
										id: "agent-settings",
										lazy: async () => ({
											Component: (
												await import(
													"@/pages/agent-settings.page"
												)
											).AgentSettingsPage,
										}),
									},
									{
										path: "*",
										id: "agent-path-not-found",
										Component: NotFoundPage,
									},
								],
							},
							{
								path: "settings",
								id: "settings",
								lazy: async () => ({
									Component: (
										await import("@/pages/settings.page")
									).SettingsPage,
								}),
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
				lazy: async () => ({
					Component: (await import("@/pages/login.page")).LoginPage,
				}),
			},
		],
	},
];
