import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { LoadingScreen } from "@semoss/ui";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
import { LoginPage } from "./LoginPage";
import { MainLayout } from "./MainLayout";
import { NewRoomPage } from "./NewRoomPage";
import { RoomPage } from "./RoomPage";
import { WorkspacePage } from "./WorkspacePage";

/**
 * The main router for the application. It handles the routing logic and renders the appropriate components based on the current URL.
 */
export const Router = () => {
	const { isInitialized, error } = useInsight();

	// don't load anything if it is pending
	if (!isInitialized) {
		return <LoadingScreen.Trigger />;
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
						<Route path="agent">
							<Route index element={<WorkspacePage />} />
							<Route
								path=":agentId/new"
								element={<NewRoomPage />}
							/>
						</Route>
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
