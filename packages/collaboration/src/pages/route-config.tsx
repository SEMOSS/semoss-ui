import { Navigate, type RouteObject } from "react-router";
import { AuthorizedLayout } from "@/components/layouts/authorized-layout";
import { RootLayout } from "@/components/layouts/root-layout";
import { CollaborationLayout } from "@/features/collaboration/components/collaboration-layout";
import { settingsSections } from "@/features/settings/settings-sections";
import { ErrorPage } from "@/pages/error.page";
import { NotFoundPage } from "@/pages/not-found.page";

/** Work and Brain share a canonical conversation route. */
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
							...[
								"work",
								"work/all",
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
								"brain/memory",
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
								path: "new",
								id: "new-session",
								lazy: async () => ({
									Component: (
										await import("@/pages/new-session.page")
									).NewSessionPage,
								}),
							},
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
