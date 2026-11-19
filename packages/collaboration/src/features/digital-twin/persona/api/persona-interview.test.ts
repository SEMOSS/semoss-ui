import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { interviewStep } from "./persona-interview";

/** A transport that answers every statement with one thing and remembers what ran. */
function transport(answer: unknown) {
	const run = vi.fn(async (_statement: string) => ({
		pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
	}));
	const ran = (): string[] => run.mock.calls.map(([statement]) => statement);
	return { actions: { run } as unknown as InsightActions, ran };
}

const SAID = {
	progress: { answered: 1, of: 11 },
	learned: ["formal"],
	notes: [],
	wrapWait: "Looking for answers that do not add up",
};
const SECTIONS = {
	short: "Direct.",
	voice: "",
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "",
	examples: "",
};

it("reads where the interview is with no argument, and starts, answers, wraps up and goes back with one each", async () => {
	const { actions, ran } = transport({ phase: "none" });
	expect(await interviewStep(actions)).toEqual({ phase: "none" });
	await interviewStep(actions, { sources: ["mail", "memory"] });
	await interviewStep(actions, { sources: ["none"] });
	await interviewStep(actions, {
		answer: { stepId: "limits", own: ['Say "no"'] },
	});
	await interviewStep(actions, { wrap: true });
	await interviewStep(actions, { wrap: false });
	await interviewStep(actions, { back: true });
	expect(ran()).toEqual([
		"WorkTwinPersonaInterview();",
		'WorkTwinPersonaInterview(sources=["mail","memory"]);',
		'WorkTwinPersonaInterview(sources=["none"]);',
		// what the owner wrote goes as one argument, so nothing in it runs as pixel
		'WorkTwinPersonaInterview(answer=[{"stepId":"limits","own":["Say \\"no\\""]}]);',
		"WorkTwinPersonaInterview(wrap=[true]);",
		"WorkTwinPersonaInterview(wrap=[false]);",
		"WorkTwinPersonaInterview(back=[true]);",
	]);
});

it("takes a step the owner came back to with what they answered there, whatever its kind keeps", async () => {
	const step = {
		id: "limits",
		kind: "choice",
		title: "A step",
		detail: "What it asks",
		options: ["Hiring"],
		ordered: false,
	};
	const answer = await interviewStep(
		transport({
			phase: "asking",
			step,
			...SAID,
			canBack: true,
			previous: { picked: ["Hiring"], own: [] },
		}).actions,
		{ back: true },
	);
	expect(answer).toMatchObject({
		canBack: true,
		previous: { picked: ["Hiring"], own: [] },
	});
});

it("takes each kind of step as the server sends it", async () => {
	const steps = [
		{ kind: "confirm", items: ["You answer in one line."] },
		{
			kind: "dials",
			dials: [
				{
					key: "formal",
					left: "Formal",
					right: "Casual",
					about: "Asking for a late report",
					samples: ["1", "2", "3", "4", "5"],
					value: 2,
				},
			],
		},
		{
			kind: "rounds",
			rounds: [
				{
					id: "r1",
					from: "Sam, a teammate",
					message: "Can we move the date?",
					a: "No.",
					aIs: "blunt",
					b: "Let us look.",
					bIs: "soft",
				},
				// one with no replies is answered in the owner's own words
				{ id: "t1", from: "Jordan", message: "Just say yes." },
			],
		},
		{ kind: "choice", options: ["Hiring"], ordered: false },
		{ kind: "stands", suggestions: ["When will it be done?"] },
		{
			kind: "probe",
			probes: [{ id: "p1", question: "Which is it?", a: "A", b: "B" }],
		},
		{
			kind: "mirror",
			rounds: [{ id: "m1", ask: "Thoughts?", reply: "No.", tries: 0 }],
		},
	];
	for (const [index, content] of steps.entries()) {
		const step = {
			id: `step-${index}`,
			title: "A step",
			detail: "What it asks",
			...content,
		};
		const answer = await interviewStep(
			transport({ phase: "asking", step, ...SAID, checkpoint: true })
				.actions,
		);
		expect(answer).toMatchObject({ phase: "asking", step });
	}
});

it("takes a job to follow, and the persona an interview wrote", async () => {
	const job = {
		id: "job-1",
		status: "running",
		step: "Reading mail you sent",
	};
	expect(
		await interviewStep(transport({ phase: "reading", job }).actions),
	).toEqual({ phase: "reading", job });
	expect(
		await interviewStep(
			transport({ phase: "done", brief: { sections: SECTIONS }, ...SAID })
				.actions,
		),
	).toMatchObject({ phase: "done", brief: { sections: SECTIONS } });
});

it("refuses an answer it cannot draw, so a step is never shown half there", async () => {
	for (const answer of [
		{ phase: "asking", step: { id: "x", kind: "quiz" }, ...SAID },
		// a dial without its five samples would show a blank line under a stop
		{
			phase: "asking",
			step: {
				id: "dials",
				kind: "dials",
				title: "Tune your voice",
				detail: "",
				dials: [
					{
						key: "formal",
						left: "Formal",
						right: "Casual",
						about: "",
						samples: ["1"],
						value: 2,
					},
				],
			},
			...SAID,
		},
		{ phase: "done", brief: { sections: { voice: "Direct." } }, ...SAID },
		{ phase: "elsewhere" },
	]) {
		await expect(interviewStep(transport(answer).actions)).rejects.toThrow(
			"unexpected shape",
		);
	}
});
