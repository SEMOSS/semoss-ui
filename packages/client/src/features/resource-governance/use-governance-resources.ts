import { useIteratorPixel } from "@semoss/sdk/react";
import type { Engine, Project } from "@semoss/shared";
import type { GovernanceType } from "./governance-types";

/** How many resources one read brings back. */
const PAGE_SIZE = 25;

/** How the list is ordered. */
export type GovernanceSort = "NAME" | "NEWEST" | "OLDEST";

/** A project or engine in the list. */
export interface GovernanceResource {
	/** Its id */
	id: string;
	/** The name it is shown with */
	name: string;
	/** The engine subtype, for an engine's logo */
	subtype?: string;
	/** Who created it */
	createdBy?: string;
	/** When it was created */
	dateCreated?: string;
}

/** The result of {@link useGovernanceResources}. */
export interface GovernanceResources {
	/** The resources read so far */
	resources: GovernanceResource[];
	/** Whether a read is running */
	isLoading: boolean;
	/** Whether there are more to read */
	hasMore: boolean;
	/** Reads the next page */
	loadMore: () => void;
	/** Reads the list again from the start, such as after a delete */
	reload: () => void;
}

const toProjectResource = (project: Project): GovernanceResource => ({
	id: project.project_id,
	name: project.project_display_name || project.project_name,
	createdBy: project.project_created_by,
	dateCreated: project.project_date_created,
});

const toEngineResource = (engine: Engine): GovernanceResource => ({
	id: engine.engine_id,
	name: engine.engine_display_name || engine.engine_name,
	subtype: engine.engine_subtype,
	createdBy: engine.engine_created_by,
	dateCreated: engine.engine_date_created,
});

/**
 * The admin read of one page of a type's projects or engines.
 *
 * @param entry - The type.
 * @param search - Text the names have to contain.
 * @param sort - How the list is ordered.
 * @param limit - How many to read.
 * @param offset - How many to skip.
 * @return The pixel.
 */
export const buildGovernancePixel = (
	entry: GovernanceType,
	search: string,
	sort: GovernanceSort,
	limit: number,
	offset: number,
): string => {
	const isProject = entry.kind === "PROJECT";
	const sortKey =
		sort === "NAME"
			? isProject
				? "PROJECTNAME"
				: "ENGINENAME"
			: "DATECREATED";
	const order = sort === "OLDEST" || sort === "NAME" ? "ASC" : "DESC";
	const args = [
		`filterWord=[${JSON.stringify(search)}]`,
		isProject
			? `projectType=[${JSON.stringify(entry.type)}]`
			: `engineTypes=[${JSON.stringify(entry.type)}]`,
		`sort=[{"${sortKey}" : "${order}"}]`,
		`limit=[${limit}]`,
		`offset=[${offset}]`,
	];
	return `${isProject ? "AdminMyProjects" : "AdminMyEngines"}(${args.join(", ")});`;
};

/**
 * Every project or engine of one type, through the admin reads, a page at a
 * time, filtered by name and ordered as asked. Nothing is read until a type
 * is chosen.
 *
 * @param entry - The type, or undefined before one is chosen.
 * @param search - Text the names have to contain.
 * @param sort - How the list is ordered.
 * @return The resources and how to read more.
 */
export const useGovernanceResources = (
	entry: GovernanceType | undefined,
	search: string,
	sort: GovernanceSort,
): GovernanceResources => {
	const list = useIteratorPixel<(Project | Engine)[], GovernanceResource>(
		(limit, offset) =>
			entry
				? buildGovernancePixel(entry, search, sort, limit, offset)
				: "",
		(response) => (response.length < PAGE_SIZE ? -1 : Infinity),
		(response) =>
			response.map((row) =>
				entry?.kind === "PROJECT"
					? toProjectResource(row as Project)
					: toEngineResource(row as Engine),
			),
		{ limit: PAGE_SIZE },
		[entry?.type, search, sort],
	);

	return {
		resources: list.data,
		isLoading: list.isLoading,
		hasMore: list.hasMore,
		loadMore: list.next,
		reload: list.reset,
	};
};
