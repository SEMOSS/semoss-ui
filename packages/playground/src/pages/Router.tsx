import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { AgentPage } from "./agent-page";
import { AuthenticatedLayout } from "./authenticated-layout";
import { LoginPage } from "./login-page";
import { MainLayout } from "./main-layout";
import { NewRoomPage } from "./new-room-page";
import { RoomPage } from "./room-page";

/**
 * The main router for the application. It handles the routing logic and renders the appropriate components based on the current URL.
 */
export const Router = () => {
	const { isInitialized, error } = useInsight();

	// don't load anything if it is pending
	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (error) {
		return "Error";
	}

	return (
		<HashRouter
			future={{
				v7_startTransition: true,
				v7_relativeSplatPath: true,
			}}
		>
			<Routes>
				<Route element={<AuthenticatedLayout />}>
					<Route element={<MainLayout />}>
						<Route path="new" element={<NewRoomPage />} />
						<Route path="room/:roomId" element={<RoomPage />} />
						<Route path="agent" element={<AgentPage />} />
						<Route
							path="*"
							element={<Navigate to="/new" replace />}
						/>
					</Route>
				</Route>
				<Route path="/login" element={<LoginPage />}></Route>
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		</HashRouter>
	);
};
