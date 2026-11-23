import { useContext } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { getValidateCatalogDependenciesPixel } from "@/api/catalog-dependencies";
import { ProjectContext } from "@/contexts/project-context";
import { getDependencyDisplayName } from "./catalog-dependency";

/** Which engine or project to check the dependencies of. */
export interface UseCatalogDependencyWarningOptions {
	/** The owner's id; nothing is checked while it is empty */
	catalogId: string | undefined;
	/** The owner's specific type */
	catalogType: CatalogType | undefined;
}

/**
 * Checks, once the insight is ready, whether the user can access each of an
 * engine's or a project's dependencies, and warns with a toast naming the
 * ones they cannot, as every place names a dependency ("Private Database"
 * for one they cannot see). Inside a project the names come from the
 * project's dependencies already read; elsewhere the id is shown. Call it
 * inside the owner-bound `InsightProvider`.
 *
 * @param options - The owner.
 */
export const useCatalogDependencyWarning = ({
	catalogId,
	catalogType,
}: UseCatalogDependencyWarningOptions): void => {
	const insight = useInsight();
	// optional: an engine's page has no project around it
	const project = useContext(ProjectContext);
	const nodes = project?.dependencyGraph.nodes ?? [];

	usePixel<Record<string, boolean>>(
		insight.isReady && catalogId && catalogType
			? getValidateCatalogDependenciesPixel(catalogId, catalogType)
			: "",
		{
			onSuccess: (access) => {
				const missing = Object.entries(access ?? {})
					.filter(([, hasAccess]) => !hasAccess)
					.map(([id]) => {
						const node = nodes.find((n) => n.catalog_id === id);
						return node ? getDependencyDisplayName(node) : id;
					});
				if (missing.length > 0) {
					toast.warning(
						`You don't have access to these dependencies: ${missing.join(", ")}.`,
					);
				}
			},
		},
		insight.insightId,
	);
};
