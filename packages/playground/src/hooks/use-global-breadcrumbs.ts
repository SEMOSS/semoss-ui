// import type { ReactNode } from "react";
// import { useCallback, useEffect, useMemo } from "react";
// import type { RootStore } from "@/stores";
// import { useNavbar } from "./use-navbar";
// import { useRoot } from "./use-root";

// interface useGlobalBreadcrumbsReturn {
// 	setBreadcrumbs: (breadcrumbs: RootStore["breadcrumbs"]) => void;
// 	clearBreadcrumbs: () => void;
// 	setNavbarActions: (actions: ReactNode | null) => void;
// 	clearNavbarActions: () => void;
// }

// export interface UseGlobalBreadcrumbsOptions {
// 	breadcrumbs?: RootStore["breadcrumbs"];
// 	navbarActions?: ReactNode | null;
// }

// /**
//  * Set global navbar state for a page (breadcrumbs + optional right-side actions)
//  */
// export const useGlobalBreadcrumbs = (
// 	options: UseGlobalBreadcrumbsOptions = {},
// ): useGlobalBreadcrumbsReturn => {
// 	const { root } = useRoot();
// 	const { setActions } = useNavbar();

// 	const breadcrumbs = options.breadcrumbs;
// 	const navbarActions = options.navbarActions ?? null;

// 	// Breadcrumbs are preserved unless `breadcrumbs` is explicitly provided.
// 	const shouldManageBreadcrumbs = typeof breadcrumbs !== "undefined";

// 	const breadcrumbsJson = useMemo(() => {
// 		return JSON.stringify(breadcrumbs ?? []);
// 	}, [breadcrumbs]);

// 	// Make a stable breadcrumbs array that only changes when its content changes.
// 	const stableBreadcrumbs = useMemo<RootStore["breadcrumbs"]>(() => {
// 		return JSON.parse(breadcrumbsJson) as RootStore["breadcrumbs"];
// 	}, [breadcrumbsJson]);

// 	useEffect(() => {
// 		if (!shouldManageBreadcrumbs) {
// 			return;
// 		}

// 		root.setBreadcrumbs(stableBreadcrumbs);

// 		return () => {
// 			root.clearBreadcrumbs();
// 		};
// 	}, [shouldManageBreadcrumbs, stableBreadcrumbs, root]);

// 	useEffect(() => {
// 		setActions(navbarActions);

// 		return () => {
// 			setActions(null);
// 		};
// 	}, [navbarActions, setActions]);

// 	const setNavbarActions = useCallback(
// 		(actions: ReactNode | null) => {
// 			setActions(actions);
// 		},
// 		[setActions],
// 	);

// 	const clearNavbarActions = useCallback(() => {
// 		setActions(null);
// 	}, [setActions]);

// 	return {
// 		setBreadcrumbs: root.setBreadcrumbs,
// 		clearBreadcrumbs: root.clearBreadcrumbs,
// 		setNavbarActions,
// 		clearNavbarActions,
// 	};
// };
