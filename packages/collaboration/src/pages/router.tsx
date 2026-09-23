import { useState } from "react";
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "./route-config";

/** Mounts the collaboration hash router once for the application lifetime. */
export const Router = () => {
	const [router] = useState(() => createHashRouter(routes));
	return <RouterProvider router={router} />;
};
