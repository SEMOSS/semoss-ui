import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { type PersonaSections, personaSectionsSchema } from "./persona";

// what every step of the interview carries, whatever it asks
const step = {
	id: z.string(),
	title: z.string(),
	detail: z.string(),
	/** What to say while the answer to this step is worked on, when a model then writes the next one. */
	wait: z.string().optional(),
};

const confirmStepSchema = z.object({
	...step,
	kind: z.literal("confirm"),
	items: z.array(z.string()),
});
const dialsStepSchema = z.object({
	...step,
	kind: z.literal("dials"),
	dials: z.array(
		z.object({
			key: z.string(),
			left: z.string(),
			right: z.string(),
			about: z.string(),
			samples: z.array(z.string()).length(5),
			value: z.number().int().min(1).max(5),
		}),
	),
});
const roundsStepSchema = z.object({
	...step,
	kind: z.literal("rounds"),
	rounds: z.array(
		z.object({
			id: z.string(),
			from: z.string(),
			message: z.string(),
			// a round without replies is one the owner answers in their own words
			a: z.string().optional(),
			aIs: z.string().optional(),
			b: z.string().optional(),
			bIs: z.string().optional(),
		}),
	),
});
const choiceStepSchema = z.object({
	...step,
	kind: z.literal("choice"),
	options: z.array(z.string()),
	ordered: z.boolean(),
});
const standsStepSchema = z.object({
	...step,
	kind: z.literal("stands"),
	suggestions: z.array(z.string()),
});
const probeStepSchema = z.object({
	...step,
	kind: z.literal("probe"),
	probes: z.array(
		z.object({
			id: z.string(),
			question: z.string(),
			a: z.string(),
			b: z.string(),
		}),
	),
});
const mirrorStepSchema = z.object({
	...step,
	kind: z.literal("mirror"),
	rounds: z.array(
		z.object({
			id: z.string(),
			ask: z.string(),
			reply: z.string(),
			/** How many times this answer was written again. */
			tries: z.number(),
		}),
	),
});

export type ConfirmStep = z.infer<typeof confirmStepSchema>;
export type DialsStep = z.infer<typeof dialsStepSchema>;
export type RoundsStep = z.infer<typeof roundsStepSchema>;
export type ChoiceStep = z.infer<typeof choiceStepSchema>;
export type StandsStep = z.infer<typeof standsStepSchema>;
export type ProbeStep = z.infer<typeof probeStepSchema>;
export type MirrorStep = z.infer<typeof mirrorStepSchema>;
/** One step of the interview, as the page draws it. */
export type InterviewStep =
	| ConfirmStep
	| DialsStep
	| RoundsStep
	| ChoiceStep
	| StandsStep
	| ProbeStep
	| MirrorStep;

const progress = z.object({ answered: z.number(), of: z.number() });
const said = {
	progress,
	/** Short words for what the answers so far say about the owner. */
	learned: z.array(z.string()),
	/** What could not be read or written, for the owner to know. */
	notes: z.array(z.string()),
};
const interviewSchema = z.discriminatedUnion("phase", [
	z.object({ phase: z.literal("none") }),
	// a background job to follow with BrainGetJob, as the server describes any of its jobs
	z.object({
		phase: z.literal("reading"),
		job: z.record(z.string(), z.unknown()),
	}),
	z.object({
		phase: z.literal("writing"),
		job: z.record(z.string(), z.unknown()),
	}),
	z.object({
		phase: z.literal("asking"),
		step: z.discriminatedUnion("kind", [
			confirmStepSchema,
			dialsStepSchema,
			roundsStepSchema,
			choiceStepSchema,
			standsStepSchema,
			probeStepSchema,
			mirrorStepSchema,
		]),
		...said,
		/** The essentials are answered: the owner is asked whether to wrap up before this step. */
		checkpoint: z.boolean().optional(),
		/** This step goes deeper than the essentials, so it can be left for the closing ones. */
		canWrap: z.boolean().optional(),
		/** There is a step before this one to go back to. */
		canBack: z.boolean().optional(),
		/** What the owner answered at this step before, as the step sent it; each step reads its own. */
		previous: z.record(z.string(), z.unknown()).optional(),
		/** What to say while an interview that is wrapped up moves to its closing steps. */
		wrapWait: z.string(),
	}),
	z.object({
		phase: z.literal("done"),
		brief: z.object({ sections: personaSectionsSchema }),
		...said,
	}),
]);

/** Where the interview is after a call. */
export type InterviewAnswer = z.infer<typeof interviewSchema>;
/** The interview while it waits on a step. */
export type InterviewAsking = Extract<InterviewAnswer, { phase: "asking" }>;
/** The persona an interview wrote, with what it noted on the way. */
export type InterviewDone = Extract<InterviewAnswer, { phase: "done" }> & {
	brief: { sections: PersonaSections };
};

/** The places an interview may read how the owner writes from. */
export type InterviewSource = "mail" | "teams" | "memory";

/** What one call of the interview sends; nothing reads where it is. */
export interface InterviewCall {
	/** The answer to the step that waits, with its `stepId`. */
	answer?: Record<string, unknown>;
	/** True to go to the closing steps, false to go on after an interview that was wrapped up. */
	wrap?: boolean;
	/** True to wait on the step before the one that waits, with what was answered there. */
	back?: boolean;
	/** Starts the interview over, reading these first; `none` reads nothing. */
	sources?: (InterviewSource | "none")[];
}

/**
 * One call of the interview that writes the signed-in person's persona. It
 * never changes the persona their twins use: what it writes comes back to
 * review, and is saved like any other change to the persona.
 */
// shortcut: a step a model writes is one ordinary request, so one slower than the load balancer allows fails and is sent again; the server names the upgrade
export function interviewStep(
	actions: InsightActions,
	call: InterviewCall = {},
): Promise<InterviewAnswer> {
	return callPixel(
		actions,
		pixel("WorkTwinPersonaInterview", { ...call }),
		interviewSchema,
	);
}
