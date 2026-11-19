import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	deleteTwinPersona,
	getTwinPersona,
	PERSONA_SECTIONS,
	type PersonaSections,
	personaSectionsSchema,
	saveTwinPersona,
	setTwinPersona,
} from "./persona";

const SECTIONS: PersonaSections = {
	short: "",
	voice: 'Direct. Says "ship it".',
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "Budgets: ask Dana Smith.",
	examples: "",
};
const PERSONA = { exists: true, sections: SECTIONS, offTwins: ["twin-2"] };

/** A transport that answers every statement with one thing and remembers what ran. An Error is thrown, as a refused reactor is. */
function transport(answer: unknown) {
	const run = vi.fn(async (_statement: string) => {
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
	const ran = (): string[] => run.mock.calls.map(([statement]) => statement);
	return { actions: { run } as unknown as InsightActions, ran };
}

it("reads the signed-in person's persona, whatever else the server says of it", async () => {
	const { actions, ran } = transport({
		...PERSONA,
		updatedAt: "2026-11-19T15:00:00Z",
	});
	expect(await getTwinPersona(actions)).toEqual(PERSONA);
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);
});

it("refuses an answer that is not a persona, so a section is never shown as missing by mistake", async () => {
	await expect(
		getTwinPersona(
			transport({ exists: true, sections: { voice: "Direct." } }).actions,
		),
	).rejects.toThrow("unexpected shape");
	await expect(getTwinPersona(transport([]).actions)).rejects.toThrow(
		"unexpected shape",
	);
});

it("saves the sections as one argument, so nothing written in them runs as pixel", async () => {
	const { actions, ran } = transport(PERSONA);
	expect(await saveTwinPersona(actions, SECTIONS)).toEqual(PERSONA);
	expect(ran()).toEqual([
		`WorkSaveTwinPersona(sections=[${JSON.stringify(SECTIONS)}]);`,
	]);
});

it("deletes the persona and switches it for one twin by the twin's id", async () => {
	const gone = transport({ ...PERSONA, exists: false });
	expect((await deleteTwinPersona(gone.actions)).exists).toBe(false);
	expect(gone.ran()).toEqual(["WorkDeleteTwinPersona();"]);

	const switched = transport({ project: "twin-1", enabled: false });
	await setTwinPersona(switched.actions, "twin-1", false);
	await setTwinPersona(switched.actions, "twin-1", true);
	expect(switched.ran()).toEqual([
		'WorkSetTwinPersona(project=["twin-1"], enabled=[false]);',
		'WorkSetTwinPersona(project=["twin-1"], enabled=[true]);',
	]);
	await expect(
		setTwinPersona(
			transport(new Error("It is not yours.")).actions,
			"twin-9",
			false,
		),
	).rejects.toThrow("It is not yours.");
});

it("asks for every section the server keeps, each held to the server's size", () => {
	expect(PERSONA_SECTIONS.map((section) => section.key).sort()).toEqual(
		Object.keys(personaSectionsSchema.shape).sort(),
	);
	expect(
		personaSectionsSchema.safeParse({ ...SECTIONS, short: "x".repeat(400) })
			.success,
	).toBe(true);
	expect(
		personaSectionsSchema.safeParse({ ...SECTIONS, short: "x".repeat(401) })
			.success,
	).toBe(false);
});
