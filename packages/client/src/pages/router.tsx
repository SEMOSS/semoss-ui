import { observer } from "mobx-react-lite";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { AuthenticatedLayout } from "./authenticated-layout";
import { CookieNoticePage } from "./cookie-notice-page";
import { ENGINE_ROUTES, EngineRedirect, EngineRouter } from "./engine";
import { LandingPage } from "./landing-page";
import { PageLayout } from "./page-layout";
import { PrivacyNoticePage } from "./privacy-notice-page";

const PromptRouter = lazy(() =>
	import("./prompt/PromptRouter").then((m) => ({ default: m.PromptRouter })),
);
const SettingsRouter = lazy(() =>
	import("./settings/settings-router").then((m) => ({
		default: m.SettingsRouter,
	})),
);
const SharePage = lazy(() =>
	import("./share-page").then((m) => ({ default: m.SharePage })),
);

import { LoginPage } from "./login-page";
import { PROJECT_ROUTES } from "./project";

type RouteConfig = {
	/** Name of the specific path */
	path: string;

	/** Element to render */
	element: React.ReactNode;

	/** Child routes */
	children?: (typeof PROJECT_ROUTES)[number][];
};

export const renderRoute = (route: RouteConfig): React.ReactElement => {
	if (route.path === "") {
		return <Route key="index" index element={route.element} />;
	}

	return (
		<Route key={route.path} path={route.path} element={route.element}>
			{route.children?.map(renderRoute)}
		</Route>
	);
};

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

	const showCookieNotice = !!configStore.theme.cookiePolicyNoticePage;
	const showPrivacyNotice = !!configStore.theme.privacyNoticePage;

	return (
		<Suspense fallback={<PageSpinner />}>
			<Routes>
				<Route path="/" element={<AuthenticatedLayout />}>
					<Route path="s/:appId/*" element={<SharePage />} />
					<Route path="*" element={<PageLayout />}>
						<Route index element={<LandingPage />} />

						{PROJECT_ROUTES.map(renderRoute)}
						<Route path="engine/*" element={<EngineRedirect />} />
						{/* Top-level engine routes - generated from ENGINE_ROUTES */}
						{ENGINE_ROUTES.map((route) => (
							<Route
								key={route.path}
								path={`${route.path}/*`}
								element={<EngineRouter route={route} />}
							/>
						))}
						<Route path="prompt/*" element={<PromptRouter />} />
						<Route path="settings/*" element={<SettingsRouter />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>
				</Route>
				{showCookieNotice && (
					<Route
						path="/cookie-notice"
						element={<CookieNoticePage />}
					/>
				)}
				{showPrivacyNotice && (
					<Route
						path="/privacy-notice"
						element={<PrivacyNoticePage />}
					/>
				)}
				<Route path="/login" element={<LoginPage />} />
			</Routes>
		</Suspense>
	);
});
