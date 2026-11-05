import { z } from "@semoss/ui/next";
import { type Job, mapJob } from "@/features/onboarding/onboarding-api";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const opSchema = z.enum(["move", "also_link"]);

const matchSchema = z.object({
	threadId: z.string().min(1),
	subject: z.string().nullish(),
	channel: z.string().nullish(),
	lastMessageAt: z.string().nullish(),
	confidence: z.number(),
	fit: z.enum(["best", "shared"]),
	links: z.array(
		z.object({
			topicId: z.string(),
			source: z.string().nullish(),
			primary: z.boolean(),
			kept: z.boolean(),
		}),
	),
	ops: z.array(opSchema).min(1),
	op: opSchema,
});

const previewSchema = z.object({
	scanned: z.number(),
	matches: z.array(matchSchema),
	errors: z.number().optional(),
});

const applySchema = z.object({
	applied: z.number(),
	skipped: z.number(),
	results: z.array(
		z.object({
			threadId: z.string(),
			op: z.string(),
			status: z.enum(["applied", "skipped"]),
			reason: z.string().nullish(),
		}),
	),
});

/**
 * A conversation the preview found for a topic. `kept` links were made by the owner, onboarding or an
 * Outlook folder and are never removed; `ops` are the accept choices the server allows, `op` its pick.
 */
export type TopicMatch = z.infer<typeof matchSchema>;
/** Accepting joins the topic in place of the topics Brain guessed (move) or next to them (also_link). */
export type TopicMatchOp = z.infer<typeof opSchema>;
/** The owner's choice for one conversation; reject remembers it is not about the topic. */
export interface TopicMatchChange {
	threadId: string;
	op: TopicMatchOp | "reject";
}
/** A finished preview: how many conversations were scored and the ones that fit, best first. */
export type TopicMatchPreview = z.infer<typeof previewSchema>;
/** What each choice did; a skipped one changed since the check and was left as it is. */
export type TopicMatchApplyResult = z.infer<typeof applySchema>;

/**
 * Start scoring the owner's newest conversations against a topic. Nothing is written; the server hands
 * back the check already running for this topic instead of starting another.
 */
export async function startTopicMatches(
	actions: InsightActions,
	topicId: string,
): Promise<Job> {
	return mapJob(
		await callPixel(
			actions,
			pixel("BrainPreviewTopicMatches", { topicId }),
			z.record(z.string(), z.unknown()),
		),
	);
}

/** The result a finished preview job holds, or null when it cannot be read. */
export function readTopicMatches(job: Job): TopicMatchPreview | null {
	const parsed = previewSchema.safeParse(job.counts);
	return parsed.success ? parsed.data : null;
}

/** Apply the owner's choices; the server checks each against the conversation as it is now. */
export function applyTopicMatches(
	actions: InsightActions,
	topicId: string,
	changes: TopicMatchChange[],
): Promise<TopicMatchApplyResult> {
	return callPixel(
		actions,
		pixel("BrainApplyTopicMatches", { topicId, changes }),
		applySchema,
	);
}
