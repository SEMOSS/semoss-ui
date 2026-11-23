import { runPixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import type { CatalogDependencyPayload } from "@/features/catalog/dependencies/catalog-dependency";

/**
 * Saves an engine's or a project's manual dependencies: the whole set at
 * once, replacing the manual ones it had. The backend keeps the automatic
 * ones, so they are never sent.
 *
 * @param catalogId - The owner's id.
 * @param catalogType - The owner's specific type.
 * @param dependencies - Every manual dependency it should have.
 * @throws Error with the backend's reason, such as a name used twice.
 */
export const setCatalogDependencies = async (
	catalogId: string,
	catalogType: CatalogType,
	dependencies: readonly CatalogDependencyPayload[],
): Promise<void> => {
	const response = await runPixel<[unknown]>(
		`SetCatalogDependencies(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)}, dependencies=${JSON.stringify(dependencies)});`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
};
