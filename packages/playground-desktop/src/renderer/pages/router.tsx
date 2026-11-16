import {
	createHashRouter,
	Navigate,
	type RouteObject,
	RouterProvider,
} from "react-router";
import { DesktopLayout } from "./desktop-layout";
import { LoginPage } from "./login.page";
import { NewRoomPage } from "./new-room.page";
import { RoomPage } from "./room.page";
import { ServerPage } from "./server.page";
import { SessionLayout } from "./session-layout";

/** The app's routes; exported so tests can mount them on a memory router. */
export const routes: RouteObject[] = [
	{
		element: <SessionLayout />,
		children: [
			{
				element: <DesktopLayout />,
				children: [
					{ path: "new", element: <NewRoomPage /> },
					{ path: "room/:roomId", element: <RoomPage /> },
				],
			},
		],
	},
	{ path: "login", element: <LoginPage /> },
	{ path: "server", element: <ServerPage /> },
	{ path: "*", element: <Navigate to="/new" replace /> },
];

/** One router for the app's lifetime, made outside render so it is not rebuilt. */
const router = createHashRouter(routes);

/** The app's routes, on a hash router since the page is one file. */
export const Router = () => <RouterProvider router={router} />;
