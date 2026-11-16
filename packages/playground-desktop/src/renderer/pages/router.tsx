import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { DesktopLayout } from "./desktop-layout";
import { LoginPage } from "./login.page";
import { NewRoomPage } from "./new-room.page";
import { RoomPage } from "./room.page";
import { ServerPage } from "./server.page";
import { SessionLayout } from "./session-layout";

const router = createHashRouter([
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
]);

/** The app's routes, on a hash router since the page is one file. */
export const Router = () => <RouterProvider router={router} />;
