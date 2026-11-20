import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

// a section's text, held to the size the server keeps
const text = (max: number) =>
	z
		.string()
		.max(
			max,
			`Keep this to ${max.toLocaleString("en-US")} characters or fewer.`,
		);

/** A persona's sections by key, each within the size the server cuts it to. */
export const personaSectionsSchema = z.object({
	short: text(400),
	voice: text(900),
	decide: text(700),
	review: text(500),
	stands: text(1200),
	people: text(500),
	limits: text(900),
	examples: text(1500),
});

/** The text of every section of a persona; empty where nothing is written. */
export type PersonaSections = z.infer<typeof personaSectionsSchema>;

/** A persona's sections in the order a person reads them, as its owner is asked for each. */
export const PERSONA_SECTIONS: {
	key: keyof PersonaSections;
	label: string;
	hint: string;
}[] = [
	{
		key: "short",
		label: "In short",
		hint: "Two or three sentences on who you are at work.",
	},
	{
		key: "voice",
		label: "Voice",
		hint: "How you sound: tone, length, habits, phrases you use and ones you never do.",
	},
	{
		key: "decide",
		label: "How you decide",
		hint: "What you weigh, and what wins when things conflict.",
	},
	{
		key: "review",
		label: "What you check when reviewing work",
		hint: "What you look for first when someone brings you their work.",
	},
	{
		key: "stands",
		label: "Where you stand",
		hint: "Your usual answer to the questions you get most.",
	},
	{
		key: "people",
		label: "With different people",
		hint: "How you change with leaders, with peers and with people outside your team.",
	},
	{
		key: "limits",
		label: "Leave to you",
		hint: "What your twins stay out of, to the letter. When your assistant writes for you, it takes no position on these.",
	},
	{
		key: "examples",
		label: "Sounds like you",
		hint: "A few questions people ask, each with the reply you would really send.",
	},
];

const personaSchema = z.object({
	exists: z.boolean(),
	sections: personaSectionsSchema,
	offTwins: z.array(z.string()),
	assistant: z.boolean().optional(),
	interview: z
		.object({
			answered: z.number(),
			of: z.number(),
			wrapped: z.boolean(),
			done: z.boolean(),
		})
		.nullish(),
});

/** The signed-in person's persona: how their Digital Twins answer, and how their assistant writes for them. */
export interface TwinPersona {
	/** Whether any section holds text; their twins and their assistant use it from then on. */
	exists: boolean;
	sections: PersonaSections;
	/** The ids of the twins they switched it off for. */
	offTwins: string[];
	/**
	 * Whether their own assistant writes for them with it. Only `false` is
	 * off: a server from before the switch leaves it out, and uses it.
	 */
	assistant?: boolean;
	/**
	 * Where the interview that writes it is; left out or null when there is
	 * none. `wrapped` says it was wrapped up before the steps that go deeper,
	 * and `done` that what it wrote is ready to review.
	 */
	interview?: {
		answered: number;
		of: number;
		wrapped: boolean;
		done: boolean;
	} | null;
}

/** Read the signed-in person's persona; one with no text yet is an answer, not a failure. */
export function getTwinPersona(actions: InsightActions): Promise<TwinPersona> {
	return callPixel(actions, pixel("WorkGetTwinPersona"), personaSchema);
}

/**
 * Write sections of the signed-in person's persona. A section that is passed
 * replaces what was there, and their twins use the result from their next chat.
 *
 * @throws when no section would hold text: a persona is deleted, not emptied.
 */
export function saveTwinPersona(
	actions: InsightActions,
	sections: Partial<PersonaSections>,
): Promise<TwinPersona> {
	return callPixel(
		actions,
		pixel("WorkSaveTwinPersona", { sections }),
		personaSchema,
	);
}

/** Delete the signed-in person's persona. The twins it was switched off for stay on record, and so does the assistant's switch. */
export function deleteTwinPersona(
	actions: InsightActions,
): Promise<TwinPersona> {
	return callPixel(actions, pixel("WorkDeleteTwinPersona"), personaSchema);
}

/** Switch the signed-in person's persona on or off for one twin they created. */
export async function setTwinPersona(
	actions: InsightActions,
	twinId: string,
	isEnabled: boolean,
): Promise<void> {
	await callPixel(
		actions,
		pixel("WorkSetTwinPersona", { project: twinId, enabled: isEnabled }),
		z.unknown(),
	);
}

/**
 * Switch the signed-in person's persona on or off for their own assistant,
 * which writes email and Teams messages for them with it. Their twins are not
 * touched.
 *
 * @returns what the server kept.
 */
export async function setAssistantPersona(
	actions: InsightActions,
	isEnabled: boolean,
): Promise<boolean> {
	const { enabled } = await callPixel(
		actions,
		pixel("WorkSetAssistantPersona", { enabled: isEnabled }),
		z.object({ enabled: z.boolean() }),
	);
	return enabled;
}
