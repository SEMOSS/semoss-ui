import { runPixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import type { CatalogDependencyPayload } from "@/features/catalog/dependencies/catalog-dependency";

/**
 * Records an engine's or a project's automatic dependencies again from its
 * configuration as it is now (`SyncCatalogDependencies`), for when a change
 * made outside its settings left them out of date. Only its editors can.
 * Its manual dependencies are kept.
 *
 * @param catalogId - The owner's id.
 * @param catalogType - The owner's specific type.
 * @returns How many automatic dependencies it has now.
 * @throws Error with the backend's reason, such as no edit access.
 */
export const syncCatalogDependencies = async (
	catalogId: string,
	catalogType: CatalogType,
): Promise<number> => {
	const response = await runPixel<[unknown]>(
		`SyncCatalogDependencies(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)});`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
	const output = response.pixelReturn[0]?.output;
	const automatic =
		typeof output === "object" && output !== null && "automatic" in output
			? output.automatic
			: undefined;
	if (typeof automatic !== "number") {
		throw new Error(
			"The backend did not say how many dependencies it recorded",
		);
	}
	return automatic;
};

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
