import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router";
import {
	type CollaborationSidebar,
	CollaborationSidebarContext,
} from "./collaboration-sidebar.context";

/** Share the active surface's sidebar without carrying it across route changes. */
export function CollaborationSidebarProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { key: routeKey } = useLocation();
	const [registration, setRegistration] = useState<{
		routeKey: string;
		sidebar: CollaborationSidebar;
	} | null>(null);
	const registerSidebar = useCallback(
		(sidebar: CollaborationSidebar) => {
			const next = { routeKey, sidebar };
			setRegistration(next);
			return () =>
				setRegistration((current) =>
					current === next ? null : current,
				);
		},
		[routeKey],
	);
	const sidebar =
		registration?.routeKey === routeKey ? registration.sidebar : null;
	const value = useMemo(
		() => ({ sidebar, registerSidebar }),
		[sidebar, registerSidebar],
	);
	return (
		<CollaborationSidebarContext.Provider value={value}>
			{children}
		</CollaborationSidebarContext.Provider>
	);
}
