import { useState } from "react";
import { createHashRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useSession } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	P,
	Spinner,
} from "@semoss/ui/next";
import { AuthenticatedLayout } from "./authenticated.layout";
import { CookieNoticePage } from "./cookie-notice.page";
import { ENGINE_ROUTES } from "./engine/engine.routes";
import { EngineRedirect } from "./engine/engine-redirect";
import { LandingPage } from "./landing.page";
import { LoginPage } from "./login.page";
import { PageLayout } from "./page-layout";
import { PrivacyNoticePage } from "./privacy-notice.page";
import { ProjectLayout } from "./project/project.layout";
import { PROJECT_ROUTES } from "./project/project.routes";
import { PROMPT_ROUTE } from "./prompt/prompt.routes";
import { SETTINGS_ROUTE } from "./settings/settings.routes";
import { SharePage } from "./share-page";
import { TemplatePage } from "./template.page";

const router = createHashRouter([
	{
		path: "/",
		element: <AuthenticatedLayout />,
		children: [
			{
				// ProjectLayout provides the ProjectContext the share view reads
				path: "s/:appId",
				element: <ProjectLayout />,
				children: [
					{ index: true, element: <SharePage /> },
					{ path: "*", element: <SharePage /> },
				],
			},
			{
				// pathless layout route (replaces the former `path="*"` wrapper)
				element: <PageLayout />,
				children: [
					{ index: true, element: <LandingPage /> },
					{ path: "templates", element: <TemplatePage /> },
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

export const Router = () => {
	const status = useSession((state) => state.status);
	const errorMessage = useSession((state) => state.error?.message ?? "");
	const refresh = useSession((state) => state.refresh);
	const [isRetrying, setIsRetrying] = useState(false);

	if (status === "INITIALIZING") {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// the config or the user could not be read, so no page has what it needs
	if (status === "ERROR") {
		const handleRetry = async () => {
			setIsRetrying(true);
			// never rejects: a failure shows as the ERROR status again
			await refresh();
			setIsRetrying(false);
		};

		return (
			<div className="flex h-screen w-screen items-center justify-center p-4">
				<Alert variant="destructive" className="max-w-md">
					<AlertTitle>Unable to load your session</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{errorMessage}</P>
						<Button
							type="button"
							variant="outline"
							disabled={isRetrying}
							onClick={handleRetry}
						>
							{isRetrying ? (
								<>
									<Spinner />
									Retrying...
								</>
							) : (
								"Retry"
							)}
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return <RouterProvider router={router} />;
};
