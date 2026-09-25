import { Navigate, type RouteObject } from "react-router";
import { AgentLayout } from "@/components/layouts/agent-layout";
import { AuthorizedLayout } from "@/components/layouts/authorized-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { CollaborationLayout } from "@/features/collaboration/components/collaboration-layout";
import { LegacyRoomLayout } from "@/features/collaboration/components/legacy-room-layout";
import { ErrorPage } from "@/pages/error.page";
import { NotFoundPage } from "@/pages/not-found.page";

/** Work and Brain own the product routes; existing room links remain valid. */
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
						id: "collaboration",
						Component: CollaborationLayout,
						children: [
							{
								index: true,
								id: "home",
								element: <Navigate to="/work" replace />,
							},
							...[
								"work",
								"work/waiting",
								"work/done",
								"work/topic/:topicId",
							].map((path) => ({
								path,
								id: path,
								lazy: async () => ({
									Component: (
										await import("@/pages/work.page")
									).WorkPage,
								}),
							})),
							{
								path: "work/thread/:threadId",
								id: "work-thread",
								lazy: async () => ({
									Component: (
										await import("@/pages/work-thread.page")
									).WorkThreadPage,
								}),
							},
							...[
								"brain",
								"brain/profile",
								"brain/sources",
								"brain/people",
								"brain/people/:personId",
								"brain/threads",
								"brain/threads/:threadId",
								"brain/topics/:topicId",
							].map((path) => ({
								path,
								id: path,
								lazy: async () => ({
									Component: (
										await import("@/pages/brain.page")
									).BrainPage,
								}),
							})),
							{
								Component: LegacyRoomLayout,
								children: [
									{
										path: "room/:roomId",
										Component: AgentLayout,
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
											{
												path: "*",
												id: "room-not-found",
												Component: NotFoundPage,
											},
										],
									},
								],
							},
							...["room", "new"].map((path) => ({
								path,
								element: <Navigate to="/work" replace />,
							})),
							{
								path: "agents/*",
								id: "legacy-agents",
								element: <Navigate to="/brain" replace />,
							},
							{
								path: "settings",
								element: (
									<Navigate to="/brain/sources" replace />
								),
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
