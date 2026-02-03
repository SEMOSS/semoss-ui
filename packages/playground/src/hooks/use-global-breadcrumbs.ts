import { useEffect } from "react";
import type { RootStore } from "@/stores";
import { useRoot } from "./use-root";

interface useGlobalBreadcrumbsReturn {
	setBreadcrumbs: (breadcrumbs: RootStore["breadcrumbs"]) => void;
	clearBreadcrumbs: () => void;
}

/**
 * Set breadcrumbs for a page
 */
export const useGlobalBreadcrumbs = (
	breadcrumbs: RootStore["breadcrumbs"] = [],
): useGlobalBreadcrumbsReturn => {
	const { root } = useRoot();

	// update the breadcrumbs if provided
	// biome-ignore lint/correctness/useExhaustiveDependencies: since breadcrumbs is an array, we need to stringify it
	useEffect(() => {
		root.setBreadcrumbs(breadcrumbs);

		return () => {
			root.clearBreadcrumbs();
		};
	}, [JSON.stringify(breadcrumbs), root]);

	return {
		setBreadcrumbs: root.setBreadcrumbs,
		clearBreadcrumbs: root.clearBreadcrumbs,
	};
};
