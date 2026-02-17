import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingScreen } from "@semoss/ui";
import { useRootStore } from "@/hooks";
import { AuditLogsDashboard } from "./AuditLogsDashboard";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import {
	AppCatalogPage,
	AppDetailPage,
	CreateAppPage,
	EditAppPage,
	NewPromptBuilderAppPage,
	ViewAppPage,
} from "./app";
import { EngineRouter } from "./engine";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { CookieNotice } from "./legal/CookieNotice";
import { PrivacyNotice } from "./legal/PrivacyNotice";
import { PageLayout } from "./PageLayout";
import { PromptRouter } from "./prompt";
import { SharePage } from "./SharePage";
import { SettingsRouter } from "./settings";
import { WorkflowRouter } from "./workflow";

export const Router = observer(() => {
	const { configStore } = useRootStore();

	// don't load anything if it is pending
	if (configStore.store.status === "INITIALIZING") {
		return <LoadingScreen.Trigger message={"Initializing"} />;
	}

	const showCookieNotice = !!configStore.theme.cookiePolicyNoticePage;
	const showPrivacyNotice = !!configStore.theme.privacyNoticePage;

	return (
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
						<Route path=":appId/view/*" element={<ViewAppPage />} />
						<Route path=":appId/edit/*" element={<EditAppPage />} />
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
					<Route path="workflow/*" element={<WorkflowRouter />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Route>
			{showCookieNotice && (
				<Route path="/cookie-notice" element={<CookieNotice />} />
			)}
			{showPrivacyNotice && (
				<Route path="/privacy-notice" element={<PrivacyNotice />} />
			)}
			<Route path="/login" element={<LoginPage />}></Route>
		</Routes>
	);
});
