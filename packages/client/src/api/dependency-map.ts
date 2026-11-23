import { runPixel } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { auditPixelLiteral } from "./audit-pixel";

/** Which way a traced network follows links from its root. */
export type DependencyDirection = "DEPENDENCIES" | "DEPENDENTS" | "BOTH";

// Pixel serialization omits null map values; optional text defaults to null.
const nullableText = z.string().nullable().default(null);

const nodeSchema = z.object({
	id: z.string().min(1),
	kind: z.enum(["ENGINE", "PROJECT"]),
	type: z.string().min(1),
	subtype: nullableText,
	name: z.string(),
	description: nullableText,
	discoverable: z.boolean().default(false),
	global: z.boolean().default(false),
	createdBy: nullableText,
	dateCreated: nullableText,
	missing: z.boolean().default(false),
	x: z.number(),
	y: z.number(),
});

const edgeSchema = z.object({
	id: z.string().min(1),
	source: z.string().min(1),
	target: z.string().min(1),
	role: z.string().min(1).default("MANUAL"),
	isAutomatic: z.boolean().default(false),
	name: nullableText,
	description: nullableText,
	dateAdded: nullableText,
	addedBy: nullableText,
	inCycle: z.boolean().default(false),
});

const count = z.number().int().nonnegative().default(0);

const graphSchema = z.object({
	nodes: z.array(nodeSchema),
	edges: z.array(edgeSchema),
	nodeSize: z
		.object({ width: z.number().positive(), height: z.number().positive() })
		.default({ width: 240, height: 64 }),
});

/** An engine or project on the map, placed by the backend's layout. */
export type DependencyGraphNode = z.infer<typeof nodeSchema>;
/** One link: `source` depends on `target`, in one role. */
export type DependencyGraphEdge = z.infer<typeof edgeSchema>;
/** The platform's dependency network, or the network around one item. */
export type DependencyGraph = z.infer<typeof graphSchema>;

const accessSchema = z.object({
	userId: z.string(),
	access: z.array(
		z.object({
			id: z.string().min(1),
			kind: z.enum(["ENGINE", "PROJECT"]),
			permission: z.union([z.literal(1), z.literal(2), z.literal(3)]),
			source: z.enum(["DIRECT", "TEAM", "PUBLIC"]),
		}),
	),
});

/** One item a user can use, with their best access and where it comes from. */
export type UserCatalogAccess = z.infer<typeof accessSchema>["access"][number];

const syncSchema = z.object({
	engines: count,
	agents: count,
	automations: count,
	blocks: count,
	code: count,
	failed: z.array(z.string()).default([]),
});

/** What a sync of the automatic dependencies read, and the ids it could not. */
export type DependencySyncResult = z.infer<typeof syncSchema>;

/**
 * Runs an admin reactor and returns its output, failing with the backend's
 * reason when it gives one.
 *
 * @param pixel - The reactor's call.
 * @param failure - The error when the backend gives no reason.
 * @returns The output.
 */
const runAdminPixel = async (
	pixel: string,
	failure: string,
): Promise<unknown> => {
	const response = await runPixel(pixel);
	const result = response?.pixelReturn?.[0];
	if (!result || result.operationType?.includes("ERROR")) {
		throw new Error(
			typeof result?.output === "string" ? result.output : failure,
		);
	}
	return result.output;
};

/**
 * Parses a reply, failing with `what` when its shape is not the one expected.
 *
 * @param schema - The reply's schema.
 * @param output - The reply.
 * @param what - What was read, for the error.
 * @returns The parsed reply.
 */
const parseReply = <T>(
	schema: z.ZodType<T>,
	output: unknown,
	what: string,
): T => {
	const parsed = schema.safeParse(output);
	if (!parsed.success) {
		throw new Error(`The ${what} response could not be read.`);
	}
	return parsed.data;
};

/** A reply as read, or why it could not be read. */
export interface ReadReply<T> {
	/** The reply, or null when there is none or it could not be read */
	readonly value: T | null;
	/** Why it could not be read, or null */
	readonly error: string | null;
}

/**
 * Reads a reply `usePixel` returned, keeping a reply that is not the shape
 * expected as its error rather than throwing during render.
 *
 * @param output - The reply, or null before there is one.
 * @param read - Parses the reply, throwing when it cannot.
 * @param failure - The error when the throw gives no message.
 * @returns The value, or the error.
 */
export const readReply = <T>(
	output: unknown,
	read: (output: unknown) => T,
	failure: string,
): ReadReply<T> => {
	if (output === null) {
		return { value: null, error: null };
	}
	try {
		return { value: read(output), error: null };
	} catch (cause: unknown) {
		return {
			value: null,
			error: cause instanceof Error ? cause.message : failure,
		};
	}
};

/** Options for a traced network: only the items around one root. */
export interface DependencyGraphScope {
	/** The root */
	catalogId: string;
	/** Which way to follow links */
	direction: DependencyDirection;
	/** How many links to follow, or null for all of them */
	depth: number | null;
}

/**
 * Builds the `AdminGetCatalogDependencyGraph` call.
 *
 * @param scope - The traced network, or null for the whole platform.
 * @returns The pixel.
 */
export const buildDependencyGraphPixel = (
	scope: DependencyGraphScope | null,
): string => {
	if (!scope) {
		return "AdminGetCatalogDependencyGraph();";
	}
	const keys = [
		`catalogId=[${auditPixelLiteral(scope.catalogId)}]`,
		`direction=[${auditPixelLiteral(scope.direction)}]`,
	];
	if (scope.depth !== null) {
		keys.push(`depth=[${scope.depth}]`);
	}
	return `AdminGetCatalogDependencyGraph(${keys.join(", ")});`;
};

/**
 * Reads an `AdminGetCatalogDependencyGraph` reply.
 *
 * @param output - The reply.
 * @returns The network.
 */
export const parseDependencyGraph = (output: unknown): DependencyGraph =>
	parseReply(graphSchema, output, "ontology");

/**
 * Builds the `AdminGetUserCatalogAccess` call: every engine and project a user
 * can use, with their best access as Effective Permissions counts it (direct,
 * through a team, or public). Admin only.
 *
 * @param userId - The user, or empty for no call.
 * @returns The pixel, or empty when there is no user.
 */
export const buildUserCatalogAccessPixel = (userId: string): string =>
	userId
		? `AdminGetUserCatalogAccess(userId=[${auditPixelLiteral(userId)}]);`
		: "";

/**
 * Reads an `AdminGetUserCatalogAccess` reply.
 *
 * @param output - The reply.
 * @returns The items the user can use.
 */
export const parseUserCatalogAccess = (output: unknown): UserCatalogAccess[] =>
	parseReply(accessSchema, output, "user access").access;

/**
 * Works out the automatic dependencies of every engine, agent, automation,
 * blocks app and code app again from their saved configuration. Manual
 * dependencies are kept. Admin only, and safe to run again.
 *
 * @returns How many of each were read, and the ids that failed.
 */
export const syncAutomaticDependencies =
	async (): Promise<DependencySyncResult> =>
		parseReply(
			syncSchema,
			await runAdminPixel(
				"AdminBackfillCatalogDependencies();",
				"The automatic dependencies could not be synced.",
			),
			"sync",
		);
