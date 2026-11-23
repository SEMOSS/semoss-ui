import { usePixel } from "@semoss/sdk/react";
import type { CatalogType } from "@semoss/shared";
import {
	type CatalogDependent,
	type CatalogDependentsResponse,
	getCatalogDependentsPixel,
} from "@/api/catalog-dependencies";

/** What depends on an engine or project, and the state of reading it. */
export interface UseCatalogDependentsResult {
	/**
	 * Every link up from the owner, all the way, to the items the user can
	 * view; empty until read
	 */
	dependents: CatalogDependent[];
	/** How many items depend on it, all the way up, that the user cannot view */
	hiddenCount: number;
	/** Why the read failed, if it did */
	error: Error | undefined;
	/** Reads them again */
	refresh: () => void;
}

/** What {@link useCatalogDependents} reads. */
export interface UseCatalogDependentsInput {
	/** The owner's id; nothing is read until it is known */
	catalogId: string | undefined;
	/** The owner's specific type; nothing is read until it is known */
	catalogType: CatalogType | undefined;
}

const EMPTY: CatalogDependentsResponse = { dependents: [], hiddenCount: 0 };

/**
 * Reads what depends on an engine or a project, all the way up. The backend
 * lists only the items the user can view and counts the rest.
 *
 * @param input - The owner's id and specific type.
 * @returns The dependents, the read's error and a refresh.
 */
export const useCatalogDependents = ({
	catalogId,
	catalogType,
}: UseCatalogDependentsInput): UseCatalogDependentsResult => {
	const { data, error, refresh } = usePixel<CatalogDependentsResponse>(
		catalogId && catalogType
			? getCatalogDependentsPixel(catalogId, catalogType, true)
			: "",
		{ data: EMPTY },
	);

	return {
		dependents: data?.dependents ?? [],
		hiddenCount: data?.hiddenCount ?? 0,
		error,
		refresh,
	};
};
