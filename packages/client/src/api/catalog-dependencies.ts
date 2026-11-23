import { runPixel } from "@semoss/sdk/react";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRole,
	CatalogType,
} from "@semoss/shared";

/**
 * One link from an item that depends on an engine or project, or on one of
 * its dependents, as `GetCatalogDependents` returns it: `catalog_id` depends
 * on `dependency_id`, in one role.
 */
export interface CatalogDependent {
	/** What it depends on: the item asked about, or an item between them */
	dependency_id: string;
	/** The item that depends on it */
	catalog_id: string;
	/** The item's specific type */
	catalog_type: CatalogType;
	/** The item's name */
	catalog_name?: string;
	/** The engine's subtype; a project's type */
	catalog_subtype?: string;
	/** Whether the backend recorded the link from the item's configuration */
	is_automatic: boolean;
	/** Why the item depends on it */
	role: CatalogDependencyRole;
	/** The link's name; manual links only */
	dependency_name: string | null;
	/** What the link is for */
	dependency_description: string | null;
}

/** What `GetCatalogDependencies` returns. */
export interface CatalogDependenciesResponse {
	/** One node per engine or project in the graph */
	dependencies: CatalogDependency[];
	/** Ids of the item's direct dependencies */
	dependencyIds: string[];
	/** One entry per link and role in the graph; absent from older backends */
	links?: CatalogDependencyLink[];
}

/** What `GetCatalogDependents` returns. */
export interface CatalogDependentsResponse {
	/** The links up from the item, to the items the user can view */
	dependents: CatalogDependent[];
	/** How many items depend on it that the user cannot view */
	hiddenCount: number;
}

/** What an item uses, all the way down, read when traversing upstream from it. */
export interface ItemDependencies {
	/** Every node below the item */
	readonly nodes: readonly CatalogDependency[];
	/** Every link below the item */
	readonly links: readonly CatalogDependencyLink[];
}

/** One `SetCatalogDependencies` entry: a manual dependency to keep or add. */
export interface CatalogDependencyPayload {
	/** The target's id */
	readonly id: string;
	/** The target's specific type */
	readonly type: CatalogType;
	/** The link's name, unique per owner */
	readonly name?: string;
	/** What the dependency is for */
	readonly description?: string;
}

/**
 * The `GetCatalogDependencies` pixel: everything an engine or a project
 * uses, all the way down, with every link between them.
 *
 * @param catalogId - The item's id.
 * @param catalogType - The item's specific type; a graph node's type, as text.
 * @returns The pixel, its inputs escaped.
 */
export const getCatalogDependenciesPixel = (
	catalogId: string,
	catalogType: string,
): string =>
	`GetCatalogDependencies(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)});`;

/**
 * The `GetCatalogDependents` pixel: what uses an engine or a project.
 *
 * @param catalogId - The item's id.
 * @param catalogType - The item's specific type.
 * @param isRecursive - Whether to read what uses those too, all the way up.
 * @returns The pixel, its inputs escaped.
 */
export const getCatalogDependentsPixel = (
	catalogId: string,
	catalogType: string,
	isRecursive: boolean,
): string =>
	`GetCatalogDependents(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)}, recursive=[${isRecursive}]);`;

/**
 * The `ValidateCatalogDependencies` pixel: whether the user can access each
 * of an engine's or a project's dependencies.
 *
 * @param catalogId - The item's id.
 * @param catalogType - The item's specific type.
 * @returns The pixel, its inputs escaped.
 */
export const getValidateCatalogDependenciesPixel = (
	catalogId: string,
	catalogType: CatalogType,
): string =>
	`ValidateCatalogDependencies(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)});`;

/**
 * The output of a pixel that returns a map.
 *
 * @param response - What `runPixel` resolved with.
 * @param what - What was read, for the error.
 * @returns The map.
 * @throws Error with the backend's reason, or when the output is not a map.
 */
const readMapOutput = (
	response: { errors: string[]; pixelReturn: { output?: unknown }[] },
	what: string,
): Record<string, unknown> => {
	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}
	const output = response.pixelReturn[0]?.output;
	if (
		typeof output !== "object" ||
		output === null ||
		Array.isArray(output)
	) {
		throw new Error(`The backend did not return ${what}`);
	}
	return output as Record<string, unknown>;
};

/**
 * Reads what uses an engine or a project directly (`GetCatalogDependents`
 * without `recursive`), for traversing downstream from it on the Ontology
 * tab. The backend lists only the items the user can view.
 *
 * @param catalogId - The item's id.
 * @param catalogType - The item's specific type.
 * @returns The links up from the item.
 * @throws Error with the backend's reason.
 */
export const getCatalogDependents = async (
	catalogId: string,
	catalogType: string,
): Promise<CatalogDependent[]> => {
	const output = readMapOutput(
		await runPixel<[unknown]>(
			getCatalogDependentsPixel(catalogId, catalogType, false),
		),
		"what uses it",
	);
	if (!Array.isArray(output.dependents)) {
		throw new Error("The backend did not return what uses it");
	}
	return output.dependents as CatalogDependent[];
};

/**
 * Reads what an engine or a project uses, all the way down
 * (`GetCatalogDependencies`), for traversing upstream from it on the
 * Ontology tab. Older backends send no links; then nothing is drawn.
 *
 * @param catalogId - The item's id.
 * @param catalogType - The item's specific type.
 * @returns Every node and link below the item.
 * @throws Error with the backend's reason.
 */
export const getCatalogDependencies = async (
	catalogId: string,
	catalogType: string,
): Promise<ItemDependencies> => {
	const output = readMapOutput(
		await runPixel<[unknown]>(
			getCatalogDependenciesPixel(catalogId, catalogType),
		),
		"what it uses",
	);
	if (!Array.isArray(output.dependencies)) {
		throw new Error("The backend did not return what it uses");
	}
	return {
		nodes: output.dependencies as CatalogDependency[],
		links: Array.isArray(output.links)
			? (output.links as CatalogDependencyLink[])
			: [],
	};
};

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
	const output = readMapOutput(
		await runPixel<[unknown]>(
			`SyncCatalogDependencies(catalogId=${JSON.stringify(catalogId)}, catalogType=${JSON.stringify(catalogType)});`,
		),
		"how many dependencies it recorded",
	);
	if (typeof output.automatic !== "number") {
		throw new Error(
			"The backend did not return how many dependencies it recorded",
		);
	}
	return output.automatic;
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
