import { observer } from "mobx-react-lite";
import { lazy } from "react";
import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Spinner } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { AuthenticatedLayout } from "./authenticated-layout";
import { CookieNoticePage } from "./cookie-notice-page";
import { ENGINE_ROUTES, EngineRedirect } from "./engine";
import { LandingPage } from "./landing-page";
import { LoginPage } from "./login-page";
import { PageLayout } from "./page-layout";
import { PrivacyNoticePage } from "./privacy-notice-page";
import { PROJECT_ROUTES } from "./project";
import { PROMPT_ROUTE } from "./prompt/prompt.routes";
import { SETTINGS_ROUTE } from "./settings/settings.routes";

const SharePage = lazy(() =>
	import("./share-page").then((m) => ({ default: m.SharePage })),
);

const router = createHashRouter([
	{
		path: "/",
		element: <AuthenticatedLayout />,
		children: [
			{ path: "s/:appId/*", element: <SharePage /> },
			{
				// pathless layout route (replaces the former `path="*"` wrapper)
				element: <PageLayout />,
				children: [
					{ index: true, element: <LandingPage /> },
					...PROJECT_ROUTES,
					{ path: "engine/*", element: <EngineRedirect /> },
					...ENGINE_ROUTES,
					PROMPT_ROUTE,
					SETTINGS_ROUTE,
					{ path: "*", element: <Navigate to="/" replace /> },
				],
			},
		],
	},
	{ path: "/cookie-notice", element: <CookieNoticePage /> },
	{ path: "/privacy-notice", element: <PrivacyNoticePage /> },
	{ path: "/login", element: <LoginPage /> },
]);

const PageSpinner = () => (
	<div className="flex h-screen w-screen items-center justify-center">
		<Spinner />
	</div>
);

export const Router = observer(() => {
	const { configStore } = useRootStore();

	if (configStore.store.status === "INITIALIZING") {
		return <PageSpinner />;
	}

	return <RouterProvider router={router} />;
});
