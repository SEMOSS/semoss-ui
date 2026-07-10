import { observer } from "mobx-react-lite";
import { createElement, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Spinner } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { APP_DETAIL_TABS } from "./app/app-detail.constants";
import { CookieNoticePage } from "./cookie-notice-page";
import { ENGINE_ROUTES, EngineRedirect, EngineRouter } from "./engine";
import { LandingPage } from "./landing-page";
import { PrivacyNoticePage } from "./privacy-notice-page";

const AppIdRedirect = () => {
	const { appId } = useParams();
	return <Navigate to={`/app/${appId}`} replace />;
};

import { AuthenticatedLayout } from "./authenticated-layout";

const PageLayout = lazy(() =>
	import("./PageLayout").then((m) => ({ default: m.PageLayout })),
);

const AppCatalogPage = lazy(() =>
	import("./app/app-catalog-page").then((m) => ({
		default: m.AppCatalogPage,
	})),
);
const AppGithubSelectRepoPage = lazy(() =>
	import("./app/app-github-select-repo-page").then((m) => ({
		default: m.AppGithubSelectRepoPage,
	})),
);
const AppDetailLayout = lazy(() =>
	import("./app/app-detail-layout").then((m) => ({
		default: m.AppDetailLayout,
	})),
);
const CreateAppPage = lazy(() =>
	import("./app/create-app-page").then((m) => ({
		default: m.CreateAppPage,
	})),
);
const AppEditPage = lazy(() =>
	import("./app/app-edit-page").then((m) => ({ default: m.AppEditPage })),
);
const NewPromptBuilderAppPage = lazy(() =>
	import("./app/NewPromptBuilderAppPage").then((m) => ({
		default: m.NewPromptBuilderAppPage,
	})),
);
const ViewAppPage = lazy(() =>
	import("./app/view-app-page").then((m) => ({ default: m.ViewAppPage })),
);

const PromptRouter = lazy(() =>
	import("./prompt/PromptRouter").then((m) => ({ default: m.PromptRouter })),
);
const SettingsRouter = lazy(() =>
	import("./settings/settings-router").then((m) => ({
		default: m.SettingsRouter,
	})),
);
const SkillPage = lazy(() =>
	import("./skill/skill-page").then((m) => ({ default: m.SkillPage })),
);
const CreateSkillPage = lazy(() =>
	import("./skill/create-skill-page").then((m) => ({
		default: m.CreateSkillPage,
	})),
);
const SkillEditPage = lazy(() =>
	import("./skill/skill-edit-page").then((m) => ({
		default: m.SkillEditPage,
	})),
);
const AgentPage = lazy(() =>
	import("./agent/agent-page").then((m) => ({ default: m.AgentPage })),
);
const CreateAgentPage = lazy(() =>
	import("./agent/create-agent-page").then((m) => ({
		default: m.CreateAgentPage,
	})),
);
const AgentEditPage = lazy(() =>
	import("./agent/agent-edit-page").then((m) => ({
		default: m.AgentEditPage,
	})),
);
const FeaturesRouter = lazy(() =>
	import("./features/FeaturesRouter").then((m) => ({
		default: m.FeaturesRouter,
	})),
);
const SharePage = lazy(() =>
	import("./share-page").then((m) => ({ default: m.SharePage })),
);

import { LoginPage } from "./login-page";

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
						<Route path="app/*">
							<Route index element={<AppCatalogPage />} />
							<Route path="new" element={<CreateAppPage />} />
							<Route
								path="new/prompt"
								element={<NewPromptBuilderAppPage />}
							/>
							<Route path=":appId" element={<AppDetailLayout />}>
								{APP_DETAIL_TABS.map((tab) =>
									tab.path === "" ? (
										<Route
											key="index"
											index
											element={createElement(
												tab.component,
												{},
											)}
										/>
									) : (
										<Route
											key={tab.path}
											path={tab.path}
											element={createElement(
												tab.component,
												{},
											)}
										/>
									),
								)}
								{/* Post-install repo picker. Sub-route of the
								    GitHub tab; the install callback redirects here
								    when multiple repos were granted. */}
								<Route
									path="github/select-repo"
									element={createElement(
										AppGithubSelectRepoPage,
										{},
									)}
								/>
								<Route path="*" element={<AppIdRedirect />} />
							</Route>
							<Route
								path=":appId/view/*"
								element={<ViewAppPage />}
							/>
							<Route
								path=":appId/edit/*"
								element={<AppEditPage />}
							/>
						</Route>
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
						<Route path="skill/*">
							<Route index element={<SkillPage />} />
							<Route path="new" element={<CreateSkillPage />} />
							<Route
								path=":appId/edit/*"
								element={<SkillEditPage />}
							/>
							<Route
								path=":appId/*"
								element={<AppIdRedirect />}
							/>
						</Route>
						<Route path="agent/*">
							<Route index element={<AgentPage />} />
							<Route path="new" element={<CreateAgentPage />} />
							<Route
								path=":appId/edit/*"
								element={<AgentEditPage />}
							/>
							<Route
								path=":appId/*"
								element={<AppIdRedirect />}
							/>
						</Route>
						<Route path="features/*" element={<FeaturesRouter />} />
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
