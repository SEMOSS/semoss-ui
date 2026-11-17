import { useInsight, usePixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import { toast } from "@semoss/ui/next";

/** Which engine or project to check the dependencies of. */
export interface UseCatalogDependencyWarningOptions {
	/** The owner's id; nothing is checked while it is empty */
	catalogId: string | undefined;
	/** The owner's specific type */
	catalogType: CatalogType | undefined;
}

/**
 * The ids of the dependencies the user has no access to.
 *
 * @param access - Whether the user can access each dependency, by id.
 * @returns The ids without access.
 */
const getMissingIds = (access: Record<string, boolean>): string[] =>
	Object.entries(access)
		.filter(([, hasAccess]) => !hasAccess)
		.map(([id]) => id);

/**
 * Checks, once the insight is ready, whether the user can access each of an
 * engine's or a project's dependencies, and warns with a toast naming the
 * ones they cannot. Call it inside the owner-bound `InsightProvider`.
 *
 * @param options - The owner.
 */
export const useCatalogDependencyWarning = ({
	catalogId,
	catalogType,
}: UseCatalogDependencyWarningOptions): void => {
	const insight = useInsight();

	usePixel<Record<string, boolean>>(
		insight.isReady && catalogId && catalogType
			? `ValidateCatalogDependencies(catalogId="${catalogId}", catalogType="${catalogType}");`
			: "",
		{
			onSuccess: (access) => {
				const missingIds = getMissingIds(access ?? {});
				if (missingIds.length > 0) {
					toast.warning(
						`You do not have access to the following dependencies: ${missingIds.join(", ")}.`,
					);
				}
			},
		},
		insight.insightId,
	);
};
