// HashRouter (not BrowserRouter): the app is served from an arbitrary SEMOSS
// sub-path (…/Monolith/public_home/<id>/portals/), and hash routing is
// path-independent so navigation + refresh work there. Matches the project-tracker app.
import {
	HashRouter,
	Navigate,
	Route,
	Routes,
	useLocation,
	useParams,
} from "react-router-dom";
import { Env } from "@semoss/sdk";
import { InsightProvider } from "@semoss/sdk-react";
import { ToastProvider } from "./components/ui/Toast";
import { MainLayout } from "./layouts/MainLayout";
import { AiBuilderPage } from "./pages/AiBuilderPage";
import { AuthenticatedLayout } from "./pages/AuthenticatedLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { McpCreatePage } from "./pages/McpCreatePage";
import { NewDashboardChoicePage } from "./pages/NewDashboardChoicePage";
import { NewDashboardPage } from "./pages/NewDashboardPage";
import { PublishedPage } from "./pages/PublishedPage";
import { WorkspaceProvider } from "./workspace/WorkspaceProvider";

// Initialize the SEMOSS SDK Env in BOTH dev and production. This app ships as a
// static bundle served under SemossWeb (…/reporting-insights/dist/) — it is NOT a
// SEMOSS-published portal, so it never receives the injected `semoss-env` <script>
// that would otherwise set Env.MODULE. Without this, the production build leaves
// Env.MODULE empty and every pixel/API call is misrouted (no `/Monolith` prefix),
// which manifests as the app hanging on a spinner — notably when it's embedded in
// the playground's MCP tool iframe. `import.meta.env.MODULE` is baked at build time
// from .env (defaults to `/Monolith`).
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY || "",
	SECRET_KEY: import.meta.env.SECRET_KEY || "",
});

/**
 * Keys the editor so it always mounts with the right state:
 *  - editing an existing dashboard → key by its id (stable; remounts when switching dashboards)
 *  - "New Dashboard" → key by the navigation key, so every click yields a blank editor
 *    instead of reusing the previously-open dashboard's values.
 */
function DashboardEditorRoute() {
	const { id } = useParams();
	const location = useLocation();
	return <NewDashboardPage key={id ? `edit-${id}` : `new-${location.key}`} />;
}

function App() {
	return (
		<div className="h-full w-full">
			<InsightProvider>
				<ToastProvider>
					<HashRouter>
						<Routes>
							{/* Public route — login page (full-screen, no MainLayout) */}
							<Route path="/login" element={<LoginPage />} />

							{/* Protected routes — AuthenticatedLayout checks isAuthorized */}
							<Route element={<AuthenticatedLayout />}>
								<Route
									path="/"
									element={
										<WorkspaceProvider>
											<MainLayout />
										</WorkspaceProvider>
									}
								>
									{/* Home + "My Dashboards" were removed — Dashboards (Published) is the landing page. */}
									<Route
										index
										element={
											<Navigate to="/published" replace />
										}
									/>
									<Route
										path="dashboards"
										element={
											<Navigate to="/published" replace />
										}
									/>
									{/* New dashboard: choose AI vs manual, then the respective builder. */}
									<Route
										path="dashboards/new"
										element={<NewDashboardChoicePage />}
									/>
									<Route
										path="dashboards/new/ai"
										element={<AiBuilderPage />}
									/>
									<Route
										path="dashboards/new/manual"
										element={<DashboardEditorRoute />}
									/>
									{/* MCP auto-build target — playground create_dashboard forwards here. */}
									<Route
										path="mcp/create"
										element={<McpCreatePage />}
									/>
									<Route
										path="published"
										element={<PublishedPage />}
									/>
									{/* Admin/Permissions page removed — redirect any old links. */}
									<Route
										path="admin"
										element={
											<Navigate to="/published" replace />
										}
									/>
									<Route
										path="dashboard/:id"
										element={<DashboardPage />}
									/>
									<Route
										path="dashboard/:id/edit"
										element={<DashboardEditorRoute />}
									/>
								</Route>
							</Route>
						</Routes>
					</HashRouter>
				</ToastProvider>
			</InsightProvider>
		</div>
	);
}

export default App;
