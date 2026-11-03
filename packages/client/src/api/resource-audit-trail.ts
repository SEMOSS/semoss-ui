import { z } from "@semoss/ui/next";
import { auditPixelLiteral } from "./audit-pixel";
import type { AuditTrailFilters } from "./audit-trail";

export type AuditScope = "ENGINE" | "PROJECT";
export type AuditSort =
	| "EVENT_TIME"
	| "EVENT_TYPE"
	| "STATUS"
	| "SEVERITY"
	| "ACTOR_USER_NAME";
export type AuditDirection = "ASC" | "DESC";
const fields = [
	"EVENT_ID",
	"EVENT_TIME",
	"EVENT_TYPE",
	"ACTION",
	"STATUS",
	"CATEGORY",
	"SEVERITY",
	"ACTOR_USER_ID",
	"ACTOR_USER_TYPE",
	"ACTOR_USER_NAME",
	"SUBJECT_USER_ID",
	"SUBJECT_USER_TYPE",
	"SUBJECT_USER_NAME",
	"TARGET_TYPE",
	"TARGET_ID",
	"TARGET_NAME",
	"OLD_VALUE",
	"NEW_VALUE",
	"DETAILS",
] as const;
// Pixel serialization omits null map values; normalize those optional fields at the boundary.
const eventSchema = z
	.object(
		Object.fromEntries(
			fields.map((field) => [field, z.string().nullable().default(null)]),
		) as Record<
			(typeof fields)[number],
			z.ZodDefault<z.ZodNullable<z.ZodString>>
		>,
	)
	.extend({
		EVENT_ID: z.string().min(1),
		EVENT_TYPE: z.string().min(1),
		// the resource as the catalog has it now, with what picks an engine's logo
		TARGET_DISPLAY_NAME: z.string().nullable().default(null),
		TARGET_ENGINE_TYPE: z.string().nullable().default(null),
		TARGET_ENGINE_SUBTYPE: z.string().nullable().default(null),
	});
const pageSchema = z.object({
	events: z.array(eventSchema),
	hasNextPage: z.boolean(),
	page: z.number().int().nonnegative(),
	pageSize: z.number().int().min(1).max(100),
});
export type ResourceAuditEvent = z.infer<typeof eventSchema>;

/** Scoped reads return materialized data, not an extensible database query. */
export function buildResourceAuditPixel(
	scope: AuditScope,
	id: string,
	filters: AuditTrailFilters,
	page: number,
	pageSize: number,
	sort: AuditSort,
	direction: AuditDirection,
): string {
	const options: Record<string, string | number> = {
		id,
		page,
		pageSize,
		sort,
		direction,
	};
	for (const key of [
		"eventType",
		"category",
		"status",
		"severity",
		"actorId",
		"subjectId",
		"from",
		"to",
	] as const) {
		if (filters[key]) options[key] = filters[key];
	}
	const argumentsText = Object.entries(options)
		.map(([key, value]) => `${key}=[${auditPixelLiteral(value)}]`)
		.join(",");
	return `${scope === "ENGINE" ? "Engine" : "Project"}AuditEvents(${argumentsText});`;
}

/** Validate and strip unexpected fields at the SDK boundary. */
export function parseResourceAuditPage(
	data: unknown,
): z.infer<typeof pageSchema> {
	return pageSchema.parse(data);
}
