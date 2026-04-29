import { observer } from "mobx-react-lite";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spinner } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { PageLayout } from "./PageLayout";

const AppCatalogPage = lazy(() =>
	import("./app/app-catalog-page").then((m) => ({
		default: m.AppCatalogPage,
	})),
);
const AppDetailPage = lazy(() =>
	import("./app/app-detail-page").then((m) => ({
		default: m.AppDetailPage,
	})),
);
const CreateAppPage = lazy(() =>
	import("./app/create-app-page").then((m) => ({
		default: m.CreateAppPage,
	})),
);
const EditAppPage = lazy(() =>
	import("./app/edit-app-page").then((m) => ({ default: m.EditAppPage })),
);
const NewPromptBuilderAppPage = lazy(() =>
	import("./app/NewPromptBuilderAppPage").then((m) => ({
		default: m.NewPromptBuilderAppPage,
	})),
);
const ViewAppPage = lazy(() =>
	import("./app/view-app-page").then((m) => ({ default: m.ViewAppPage })),
);
const AuditLogsDashboard = lazy(() =>
	import("./audit-logs-dashboard").then((m) => ({
		default: m.AuditLogsDashboard,
	})),
);
const EngineRouter = lazy(() =>
	import("./engine/EngineRouter").then((m) => ({ default: m.EngineRouter })),
);
const LandingPage = lazy(() =>
	import("./landing-page").then((m) => ({ default: m.LandingPage })),
);
const CookieNotice = lazy(() =>
	import("./legal/CookieNotice").then((m) => ({ default: m.CookieNotice })),
);
const PrivacyNotice = lazy(() =>
	import("./legal/PrivacyNotice").then((m) => ({
		default: m.PrivacyNotice,
	})),
);
const PromptRouter = lazy(() =>
	import("./prompt/PromptRouter").then((m) => ({ default: m.PromptRouter })),
);
const SettingsRouter = lazy(() =>
	import("./settings/SettingsRouter").then((m) => ({
		default: m.SettingsRouter,
	})),
);
const SharePage = lazy(() =>
	import("./share-page").then((m) => ({ default: m.SharePage })),
);
const LoginPage = lazy(() =>
	import("./LoginPage").then((m) => ({ default: m.LoginPage })),
);

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
							<Route path=":appId" element={<AppDetailPage />} />
							<Route
								path=":appId/view/*"
								element={<ViewAppPage />}
							/>
							<Route
								path=":appId/edit/*"
								element={<EditAppPage />}
							/>
							<Route
								path=":appId/dashboard/*"
								element={
									<AuditLogsDashboard catalogName={"Apps"} />
								}
							/>
						</Route>
						<Route path="engine/*" element={<EngineRouter />} />
						<Route path="prompt/*" element={<PromptRouter />} />
						<Route path="settings/*" element={<SettingsRouter />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>
				</Route>
				{showCookieNotice && (
					<Route path="/cookie-notice" element={<CookieNotice />} />
				)}
				{showPrivacyNotice && (
					<Route path="/privacy-notice" element={<PrivacyNotice />} />
				)}
				<Route path="/login" element={<LoginPage />} />
			</Routes>
		</Suspense>
	);
});
