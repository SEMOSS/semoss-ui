import { HashRouter, Route, Routes } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { AuditLogPage } from "@/components/audit-log-page";
// import { useRootStore } from "@/hooks";
// import { AuditLogsDashboard } from "./AuditLogsDashboard";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { LoginPage } from "./LoginPage";
import { RootLayout } from "./root-layout";

export const Router = () => {
	const { isInitialized } = useInsight();

	// // don't load anything if it is pending
	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// const showCookieNotice = !!configStore.theme.cookiePolicyNoticePage;
	// const showPrivacyNotice = !!configStore.theme.privacyNoticePage;

	return (
		<RootLayout>
			<HashRouter>
				<Routes>
					<Route path="/" element={<AuthenticatedLayout />}>
						{/* <Route path="*" element={<MainLayout />}> */}
						<Route
							index
							element={<AuditLogPage catalogName="Apps" />}
						/>
						{/* </Route> */}
					</Route>
					{/*{showCookieNotice && (
                        <Route path="/cookie-notice" element={<CookieNotice />} />
                    )}
                    {showPrivacyNotice && (
                        <Route path="/privacy-notice" element={<PrivacyNotice />} />
                    )} */}
					<Route path="/login" element={<LoginPage />}></Route>
				</Routes>
			</HashRouter>
		</RootLayout>
	);
};
