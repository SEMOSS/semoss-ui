import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
	CatalogType,
} from "@semoss/shared";
import {
	type CatalogDependenciesResponse,
	getCatalogDependenciesPixel,
} from "@/api/catalog-dependencies";

/** An engine's or a project's dependencies and the state of reading them. */
export interface UseCatalogDependenciesResult {
	/**
	 * The owner's direct dependencies, automatic and manual: its own links
	 * joined with their targets' nodes, one row per target and role; empty
	 * until read
	 */
	dependencies: CatalogDependencyRow[];
	/** Every dependency node, theirs included, each once; empty until read */
	allDependencies: CatalogDependency[];
	/**
	 * Every link between the nodes, the owner's and theirs, one per role;
	 * empty until read. Older backends send none.
	 */
	links: CatalogDependencyLink[];
	/**
	 * Whether the owner's first read is waiting on the backend. A refresh keeps
	 * the rows already read until the new ones arrive.
	 */
	isLoading: boolean;
	/** Why the last read failed, if it did */
	error: Error | undefined;
	/** Reads the dependencies again */
	refresh: () => void;
}

/** What {@link useCatalogDependencies} reads. */
export interface UseCatalogDependenciesInput {
	/** The owner's id; nothing is read until it is known */
	catalogId: string | undefined;
	/** The owner's specific type; nothing is read until it is known */
	catalogType: CatalogType | undefined;
}

const EMPTY: CatalogDependenciesResponse = {
	dependencies: [],
	dependencyIds: [],
	links: [],
};

/**
 * Joins the owner's own links with their targets' nodes. A backend that sends
 * no links has only manual dependencies, so each direct node becomes one
 * manual row. A link whose node is missing is dropped.
 *
 * @param ownerId - The owner's id.
 * @param response - What `GetCatalogDependencies` returned.
 * @returns The owner's rows, in link order.
 */
const toDependencyRows = (
	ownerId: string | undefined,
	{ dependencies, dependencyIds, links }: CatalogDependenciesResponse,
): CatalogDependencyRow[] => {
	const nodes = new Map(dependencies.map((node) => [node.catalog_id, node]));
	if (!links) {
		return dependencyIds.flatMap((id) => {
			const node = nodes.get(id);
			return node
				? [
						{
							...node,
							is_automatic: false,
							role: "MANUAL" as const,
							dependency_name: null,
							dependency_description: null,
						},
					]
				: [];
		});
	}
	return links.flatMap(({ parent_id, ...link }) => {
		const node = parent_id === ownerId ? nodes.get(link.catalog_id) : null;
		return node ? [{ ...node, ...link }] : [];
	});
};

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
}: UseCatalogDependenciesInput): UseCatalogDependenciesResult => {
	const pixel =
		catalogId && catalogType
			? getCatalogDependenciesPixel(catalogId, catalogType)
			: "";
	// the last successful read and the pixel it answered, so a refresh of the
	// same owner keeps its rows instead of blanking whoever shows them
	const [lastRead, setLastRead] = useState<{
		pixel: string;
		data: CatalogDependenciesResponse;
	}>();
	const { status, data, error, refresh } =
		usePixel<CatalogDependenciesResponse>(pixel, {
			data: EMPTY,
			onSuccess: (output) => setLastRead({ pixel, data: output }),
		});

	const hasPreviousRead = pixel !== "" && lastRead?.pixel === pixel;
	const isReading = status === "INITIAL" || status === "LOADING";
	const response =
		isReading && hasPreviousRead && lastRead ? lastRead.data : data;

	// the backend returns the whole graph; only the owner's own links are its
	// rows, so saving them never turns a dependency's dependency into a direct one
	const dependencies = toDependencyRows(catalogId, response ?? EMPTY);

	return {
		dependencies,
		allDependencies: response?.dependencies ?? [],
		links: response?.links ?? [],
		isLoading: pixel !== "" && isReading && !hasPreviousRead,
		error,
		refresh,
	};
};
