import { useDebouncedValue, useIteratorPixel } from "@semoss/sdk/react";
import type { CatalogType, Engine, Project } from "@semoss/shared";
import { ALL_ENGINE_TYPES } from "@/utility/catalog";
import type { DependencyOption } from "./catalog-dependency-draft";

/** Whether the picker lists engines or projects. */
export type DependencySource = "ENGINE" | "PROJECT";

/** Every project type a dependency can be. */
const DEPENDENCY_PROJECT_TYPES: readonly CatalogType[] = [
	"CODE",
	"BLOCKS",
	"INSIGHTS",
	"SKILL",
	"NOTEBOOK",
	"AUTOMATION",
	"WORKSPACE",
];

const PAGE_LIMIT = 25;

/** What {@link useDependencyOptions} reads. */
export interface UseDependencyOptionsInput {
	/** The owner, which is never offered */
	catalogId: string;
	/** What the user typed */
	search: string;
	/** Engines or projects */
	source: DependencySource;
	/** One type of the source; every type of it when left out */
	typeFilter?: CatalogType;
}

/** The engines or projects the user can pick as a dependency. */
export interface UseDependencyOptionsResult {
	/** The options read so far, the owner left out */
	readonly options: readonly DependencyOption[];
	/** Whether a page is being read */
	readonly isLoading: boolean;
	/** Whether more pages wait */
	readonly hasMore: boolean;
	/** Why the last read failed, or null */
	readonly error: Error | null;
	/** Reads the next page */
	readonly next: () => void;
}

/**
 * The engines (`MyEngines`) or projects (`MyProjects`) the user can see, as
 * dependency targets, filtered by search and type, a page at a time. The
 * search is debounced. The Ontology tab's Add Dependency panel and the
 * Engines panel's Manage dialog offer them.
 *
 * @param input - The owner, the search, the source and the type.
 * @returns The options and paging.
 */
export const useDependencyOptions = ({
	catalogId,
	search,
	source,
	typeFilter,
}: UseDependencyOptionsInput): UseDependencyOptionsResult => {
	// Coalesce to "" so the initial undefined -> "" debounce transition doesn't
	// reset the iterator (which clears its data but can't refetch an unchanged
	// query), which would blank the list until the source is toggled.
	const debouncedSearch = useDebouncedValue(search) ?? "";
	const filterClause = debouncedSearch
		? `filterWord=${JSON.stringify(debouncedSearch)}, `
		: "";
	const sourceTypes: readonly CatalogType[] =
		source === "ENGINE" ? ALL_ENGINE_TYPES : DEPENDENCY_PROJECT_TYPES;
	const queriedTypes = typeFilter
		? sourceTypes.filter((type) => type === typeFilter)
		: sourceTypes;

	const getEngines = useIteratorPixel<Engine[], DependencyOption>(
		(limit, offset) =>
			source === "ENGINE"
				? `MyEngines(${filterClause}engineTypes=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((eng) => ({
				catalog_id: eng.engine_id,
				catalog_name: eng.engine_display_name || eng.engine_name,
				catalog_type: eng.engine_type,
				catalog_subtype: eng.engine_subtype,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter],
	);

	const getProjects = useIteratorPixel<Project[], DependencyOption>(
		(limit, offset) =>
			source === "PROJECT"
				? `MyProjects(${filterClause}projectType=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((proj) => ({
				catalog_id: proj.project_id,
				catalog_name: proj.project_display_name || proj.project_name,
				catalog_type: proj.project_type,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter],
	);

	const active = source === "ENGINE" ? getEngines : getProjects;
	return {
		// an engine or a project can't depend on itself
		options: active.data.filter(
			(option) => option.catalog_id !== catalogId,
		),
		isLoading: active.isLoading,
		hasMore: active.hasMore,
		error: active.error,
		next: active.next,
	};
};
