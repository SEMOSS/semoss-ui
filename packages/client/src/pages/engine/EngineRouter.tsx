import { observer } from "mobx-react-lite";
import { createElement } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Help } from "@/components/help";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { SettingsContext } from "@/contexts";
import { AuditLogsDashboard } from "../AuditLogsDashboard";
import { ImportPage } from "../import";
import { ENGINE_ROUTES } from "./engine.constants";
import { EngineIndexPage } from "./engine-index-page";
import { EngineLayout } from "./engine-layout";

export const EngineRouter = observer(() => {
	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<SettingsContext.Provider value={{ adminMode: false }}>
				<Routes>
					{ENGINE_ROUTES.map((r) => (
						<Route key={r.path} path={r.path} element={<Outlet />}>
							<Route
								index
								element={<EngineIndexPage route={r} />}
							/>
							<Route
								path="new"
								element={
									<ImportPage name={r.name} type={r.type} />
								}
							/>
							<Route
								path=":engineId"
								element={<EngineLayout route={r} />}
							>
								{r.specific.map((s) => (
									<Route
										key={s.path}
										path={s.path}
										element={createElement(s.component, {})}
									/>
								))}
							</Route>
							<Route
								path=":engineId/dashboard"
								element={
									<AuditLogsDashboard catalogName={r.name} />
								}
							/>
							<Route
								path="*"
								element={<Navigate to="." replace />}
							/>
						</Route>
					))}
				</Routes>
			</SettingsContext.Provider>

			<Help />
		</>
	);
});
