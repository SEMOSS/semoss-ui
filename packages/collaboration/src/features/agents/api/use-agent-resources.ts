import { useIteratorPixel } from "@semoss/sdk/react";
import { engineProjectToMCP, type MCP } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";

const engineListSchema = z.array(
	z.object({
		engine_id: z.string().min(1),
		engine_name: z.string(),
		engine_display_name: z
			.string()
			.nullish()
			.transform((value) => value ?? undefined),
		engine_type: z.enum([
			"VECTOR",
			"STORAGE",
			"DATABASE",
			"FUNCTION",
			"MODEL",
			"GUARDRAIL",
		]),
		description: z
			.string()
			.nullish()
			.transform((value) => value ?? ""),
	}),
);

const projectListSchema = z.array(
	z.object({
		project_id: z.string().min(1),
		project_name: z.string(),
		project_display_name: z
			.string()
			.nullish()
			.transform((value) => value ?? undefined),
		description: z
			.string()
			.nullish()
			.transform((value) => value ?? ""),
	}),
);

interface AgentResourcesQuery {
	/** Catalog entries available to add, across all loaded pages. */
	resources: MCP[];
	isLoading: boolean;
	error: Error | null;
	hasMore: boolean;
	next: () => void;
	refresh: () => void;
}

/** Load the catalog's MCP resources independently of its card-based presentation. */
export function useAgentResources(
	type: "KNOWLEDGE" | "TOOLBOX" | null,
	search: string,
): AgentResourcesQuery {
	const engines = useIteratorPixel<unknown, MCP>(
		(limit, offset) =>
			type
				? `META | ${pixel("MyEngines", {
						metaKeys: ["description"],
						metaFilters: [{ tag: ["MCP"] }],
						engineTypes:
							type === "KNOWLEDGE"
								? ["VECTOR"]
								: ["STORAGE", "DATABASE", "FUNCTION", "MODEL"],
						filterWord: search || undefined,
						limit,
						offset,
					})}`
				: "",
		(response) =>
			Array.isArray(response) && response.length === 25 ? Infinity : -1,
		(response) => engineListSchema.parse(response).map(engineProjectToMCP),
		{ limit: 25 },
		[type, search],
	);
	const projects = useIteratorPixel<unknown, MCP>(
		(limit, offset) =>
			type === "TOOLBOX"
				? `META | ${pixel("MyProjects", {
						metaKeys: ["description"],
						metaFilters: [{ tag: ["MCP"] }],
						filterWord: search || undefined,
						limit,
						offset,
					})}`
				: "",
		(response) =>
			Array.isArray(response) && response.length === 25 ? Infinity : -1,
		(response) => projectListSchema.parse(response).map(engineProjectToMCP),
		{ limit: 25 },
		[type, search],
	);
	return {
		resources: Array.from(
			new Map(
				[...engines.data, ...projects.data].map((resource) => [
					resource.id,
					resource,
				]),
			).values(),
		),
		isLoading:
			(type !== null &&
				(engines.isLoading ||
					(!engines.error && engines.totalCount === 0))) ||
			(type === "TOOLBOX" &&
				(projects.isLoading ||
					(!projects.error && projects.totalCount === 0))),
		error: engines.error ?? projects.error ?? null,
		hasMore: engines.hasMore || projects.hasMore,
		next: () => {
			if (engines.hasMore) engines.next();
			if (projects.hasMore) projects.next();
		},
		refresh: () => {
			if (type) engines.reset();
			if (type === "TOOLBOX") projects.reset();
		},
	};
}
