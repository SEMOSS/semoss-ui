import { usePixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import type { CatalogDependent } from "./catalog-dependency-graph";

/** What depends on an engine or project, and the state of reading it. */
export interface UseCatalogDependentsResult {
	/**
	 * Every link up from the owner, all the way, to the items the user can
	 * view; empty until read
	 */
	dependents: CatalogDependent[];
	/** How many items depend on it, all the way up, that the user cannot view */
	hiddenCount: number;
	/** Whether the first read waits on the backend */
	isLoading: boolean;
	/** Why the read failed, if it did */
	error: Error | undefined;
	/** Reads them again */
	refresh: () => void;
}

interface CatalogDependentsResponse {
	dependents: CatalogDependent[];
	hiddenCount: number;
}

const EMPTY: CatalogDependentsResponse = { dependents: [], hiddenCount: 0 };

/**
 * Reads what depends on an engine or a project, all the way up. The backend
 * lists only the items the user can view and counts the rest. Nothing is read
 * until both the owner's id and its specific type are known.
 *
 * @param options - The owner's id and specific type.
 * @returns The dependents, the read's state and a refresh.
 */
export const useCatalogDependents = ({
	catalogId,
	catalogType,
}: {
	catalogId: string | undefined;
	catalogType: CatalogType | undefined;
}): UseCatalogDependentsResult => {
	const pixel =
		catalogId && catalogType
			? `GetCatalogDependents(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)}, recursive=[true]);`
			: "";
	const { status, data, error, refresh } =
		usePixel<CatalogDependentsResponse>(pixel, { data: EMPTY });

	return {
		dependents: data?.dependents ?? [],
		hiddenCount: data?.hiddenCount ?? 0,
		isLoading:
			pixel !== "" && (status === "INITIAL" || status === "LOADING"),
		error,
		refresh,
	};
};
