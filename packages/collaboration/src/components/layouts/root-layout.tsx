import { Outlet } from "react-router";
import { TooltipProvider } from "@semoss/ui/next";

/**
 * Renders the base layout and provides the app-wide tooltip context. The
 * routes below wait on the SDK's session themselves: `AuthorizedLayout` and
 * the login page read `useSession`.
 */
export const RootLayout = () => {
	return (
		<TooltipProvider delayDuration={250}>
			<div className="flex h-dvh flex-col">
				<div className="h-full overflow-auto p-4">
					<Outlet />
				</div>
			</div>
		</TooltipProvider>
	);
};
