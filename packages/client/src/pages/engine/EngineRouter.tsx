import { observer } from "mobx-react-lite";
import { createElement, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Help } from "@/components/help";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { AuditLogsDashboard } from "../audit-logs-dashboard";
import { ImportPage } from "../import";
import { ENGINE_ROUTES } from "./engine.constants";
import { EngineEditPage } from "./engine-edit-page";
import { EngineIndexPage } from "./engine-index-page";
import { EngineLayout } from "./engine-layout";

export const EngineRouter = observer(() => {
	const { configStore } = useRootStore();
	const ADMIN_MODE_STORAGE_KEY = "semoss.adminMode";
	const getStoredAdminMode = () => {
		if (typeof window === "undefined") {
			return false;
		}
		return window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true";
	};
	const [adminMode, setAdminMode] = useState(getStoredAdminMode());

	useEffect(() => {
		if (!configStore.store.user.admin) {
			setAdminMode(false);
			return;
		}
		setAdminMode(getStoredAdminMode());
	}, [configStore.store.user.admin]);

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<SettingsContext.Provider value={{ adminMode }}>
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
								<Route
									path="edit"
									element={<EngineEditPage />}
								/>
							</Route>
							<Route
								path=":engineId/auditlogs"
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
