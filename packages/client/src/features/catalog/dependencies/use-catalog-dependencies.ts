import { usePixel } from "@semoss/sdk/react";
import type { CatalogDependency, CatalogType } from "@semoss/shared";

/** An engine's or a project's dependencies and the state of reading them. */
export interface UseCatalogDependenciesResult {
	/**
	 * The owner's direct dependencies, the ones it lists itself and an edit
	 * saves; empty until read
	 */
	dependencies: CatalogDependency[];
	/** Every dependency, theirs included, each once; empty until read */
	allDependencies: CatalogDependency[];
	/** Ids of the owner's direct dependencies */
	dependencyIds: string[];
	/** Whether a read is waiting on the backend */
	isLoading: boolean;
	/** Why the last read failed, if it did */
	error: Error | undefined;
	/** Reads the dependencies again */
	refresh: () => void;
}

const EMPTY = { dependencies: [], dependencyIds: [] };

/**
 * Reads an engine's or a project's dependencies. Nothing is read until both
 * the owner's id and its specific type are known.
 *
 * @param options - The owner's id and specific type.
 * @returns The dependencies, the read's state and a refresh.
 */
export const useCatalogDependencies = ({
	catalogId,
	catalogType,
}: {
	catalogId: string | undefined;
	catalogType: CatalogType | undefined;
}): UseCatalogDependenciesResult => {
	const pixel =
		catalogId && catalogType
			? `GetCatalogDependencies(catalogId="${catalogId}", catalogType="${catalogType}");`
			: "";
	const { status, data, error, refresh } = usePixel<{
		dependencies: CatalogDependency[];
		dependencyIds: string[];
	}>(pixel, { data: EMPTY });

	const allDependencies = data?.dependencies ?? [];
	const dependencyIds = data?.dependencyIds ?? [];
	// the backend returns the whole graph; only the direct ones are the owner's
	// own, so saving them never turns a dependency's dependency into a direct one
	const directIds = new Set(dependencyIds);

	return {
		dependencies: allDependencies.filter((d) =>
			directIds.has(d.catalog_id),
		),
		allDependencies,
		dependencyIds,
		isLoading:
			pixel !== "" && (status === "INITIAL" || status === "LOADING"),
		error,
		refresh,
	};
};
