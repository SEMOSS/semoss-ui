import { z } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const person = z.object({
	id: z.string().nullish(),
	name: z.string().min(1),
	title: z.string().nullish(),
	department: z.string().nullish(),
	email: z.string().nullish(),
	navigable: z.boolean().optional(),
});
const relation = z.enum(["complete", "not_listed", "partial", "unavailable"]);
const result = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("ok"),
		person,
		manager: person.nullish(),
		managerStatus: relation,
		directReports: z.array(person),
		directReportsStatus: relation,
		peers: z.array(person),
		peersStatus: relation,
	}),
	z.object({
		status: z.literal("ambiguous"),
		candidates: z.array(person),
		candidatesTruncated: z.boolean().optional(),
	}),
	z.object({
		status: z.literal("not_found"),
		message: z.string().optional(),
	}),
	z.object({
		status: z.literal("unavailable"),
		message: z.string().optional(),
	}),
]);

export type OrgChartResult = z.infer<typeof result>;
export type OrgChartPerson = z.infer<typeof person>;
export type OrgChartLookup = { personId: string } | { query: string };

/** A directory user has a Graph id; a contact-only search match may have only an address. */
export function personLookup(
	person: OrgChartPerson,
): OrgChartLookup | undefined {
	if (person.navigable === false) return undefined;
	if (
		person.id &&
		/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(person.id)
	)
		return { personId: person.id };
	if (person.email) return { query: person.email };
	return undefined;
}

/** Stored chat history and live Pixel reads use the same validated chart shape. */
export function parseOrgChart(output?: string): OrgChartResult {
	const parsed = result.safeParse(tryParseJson(output ?? ""));
	return parsed.success
		? parsed.data
		: {
				status: "unavailable",
				message: "This org chart could not be read.",
			};
}

/** Move the card to a person using the signed-in user's directory access. */
export function readOrgChart(
	actions: InsightActions,
	target: OrgChartLookup,
): Promise<OrgChartResult> {
	return callPixel(
		actions,
		`META | ${pixel("WorkShowOrgChart", target)}`,
		result,
	);
}
