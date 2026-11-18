import { Navigate, type RouteObject } from "react-router";
import { AuthorizedLayout } from "@/components/layouts/authorized-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { CollaborationLayout } from "@/features/collaboration/components/collaboration-layout";
import { settingsSections } from "@/features/settings/settings-sections";
import { ErrorPage } from "@/pages/error.page";
import { NotFoundPage } from "@/pages/not-found.page";

/** Work and Brain share canonical topic and conversation routes. */
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
								lazy: async () => ({
									Component: (
										await import("@/pages/dashboard.page")
									).DashboardPage,
								}),
							},
							{
								path: "routines",
								id: "routines",
								lazy: async () => ({
									Component: (
										await import("@/pages/routines.page")
									).RoutinesPage,
								}),
							},
							{
								path: "twins",
								id: "twins",
								lazy: async () => ({
									Component: (
										await import("@/pages/twins.page")
									).TwinsPage,
								}),
							},
							{
								path: "twins/mine",
								id: "twins/mine",
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/twin-settings.page"
										)
									).TwinSettingsPage,
								}),
							},
							{
								path: "twins/mine/contents",
								id: "twins/mine/contents",
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/twin-contents.page"
										)
									).TwinContentsPage,
								}),
							},
							{
								path: "twins/chat",
								id: "twins/chat",
								lazy: async () => ({
									Component: (
										await import("@/pages/twin-chat.page")
									).TwinChatPage,
								}),
							},
							...[
								"work",
								"work/topics",
								"work/review",
								"work/all",
								"work/waiting",
								"work/done",
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
								path: "topics/:topicId",
								id: "topic",
								lazy: async () => ({
									Component: (
										await import("@/pages/topic.page")
									).TopicPage,
								}),
							},
							{
								path: "topics/:topicId/contents",
								id: "topic-contents",
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/topic-contents.page"
										)
									).TopicContentsPage,
								}),
							},
							{
								path: "work/item/:taskId",
								id: "work/item/:taskId",
								lazy: async () => ({
									Component: (
										await import("@/pages/work-item.page")
									).WorkItemPage,
								}),
							},
							...[
								"work/topic/:topicId",
								"brain/topics/:topicId",
							].map((path) => ({
								path,
								id: path,
								lazy: async () => ({
									Component: (
										await import(
											"@/pages/legacy-topic.page"
										)
									).LegacyTopicPage,
								}),
							})),
							{
								path: "thread/:threadId",
								id: "thread",
								lazy: async () => ({
									Component: (
										await import("@/pages/thread.page")
									).ThreadPage,
								}),
							},
							...[
								"brain",
								"brain/topics",
								"brain/memory",
								"brain/sources",
								"brain/people",
								"brain/people/:personId",
								"brain/threads",
								"brain/threads/:threadId",
							].map((path) => ({
								path,
								id: path,
								lazy: async () => ({
									Component: (
										await import("@/pages/brain.page")
									).BrainPage,
								}),
							})),
							...["room"].map((path) => ({
								path,
								element: <Navigate to="/work" replace />,
							})),
							{
								path: "agents/*",
								id: "legacy-agents",
								element: <Navigate to="/brain" replace />,
							},
							{
								path: "brain/profile",
								element: (
									<Navigate
										to="/settings/about-you"
										replace
									/>
								),
							},
							{
								path: "settings/dashboard",
								element: (
									<Navigate
										to="/settings/about-you"
										replace
									/>
								),
							},
							{
								path: "settings",
								id: "settings",
								lazy: async () => ({
									Component: (
										await import("@/pages/settings.page")
									).SettingsPage,
								}),
								children: [
									{
										index: true,
										element: (
											<Navigate
												to="/settings/about-you"
												replace
											/>
										),
									},
									...settingsSections.map(({ id }) => ({
										path: id,
										id: `settings/${id}`,
										element: <></>,
									})),
								],
							},
							{
								path: "*",
								id: "not-found",
								Component: NotFoundPage,
							},
						],
					},
					{
						path: "onboarding",
						id: "onboarding",
						lazy: async () => ({
							Component: (await import("@/pages/onboarding.page"))
								.OnboardingPage,
						}),
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
