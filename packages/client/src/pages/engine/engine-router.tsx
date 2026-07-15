import { observer } from "mobx-react-lite";
import { createElement, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Help } from "@/components/help";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { ImportPage } from "../import";
import type { ENGINE_ROUTES } from "./engine.constants";
import { EngineEditPage } from "./engine-edit-page";
import { EngineIndexPage } from "./engine-index-page";
import { EngineLayout } from "./engine-layout";

const getStoredAdminMode = () => {
	if (typeof window === "undefined") {
		return false;
	}
	return window.localStorage.getItem("semoss.adminMode") === "true";
};

interface EngineRouterProps {
	/** Filter to a specific engine type by path (e.g., "model", "database") */
	route: (typeof ENGINE_ROUTES)[number];
}

export const EngineRouter = observer(({ route }: EngineRouterProps) => {
	const { configStore } = useRootStore();

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
					<Route index element={<EngineIndexPage route={route} />} />
					<Route
						path="new"
						element={
							<ImportPage name={route.name} type={route.type} />
						}
					/>
					<Route
						path=":engineId"
						element={<EngineLayout route={route} />}
					>
						{route.specific.map((s) => (
							<Route
								key={s.path}
								path={s.path}
								element={createElement(s.component, {})}
							/>
						))}
						<Route path="edit" element={<EngineEditPage />} />
					</Route>
					<Route path="*" element={<Navigate to="." replace />} />
				</Routes>
			</SettingsContext.Provider>

			<Help />
		</>
	);
});
