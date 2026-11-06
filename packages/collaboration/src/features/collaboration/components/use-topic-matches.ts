import { useState } from "react";
import type { Job } from "@/features/onboarding/onboarding-api";
import { useJob } from "@/features/onboarding/use-job";
import type { InsightActions } from "@/lib/pixel";
import {
	applyTopicMatches,
	readTopicMatches,
	startTopicMatches,
	type TopicMatch,
	type TopicMatchApplyResult,
	type TopicMatchChange,
	type TopicMatchMode,
	type TopicMatchOp,
} from "../api/topic-matches";

// conversations on screen at first, and per Show more; Apply decides only the ones on screen
const PAGE = 10;

const messageOf = (cause: unknown): string =>
	cause instanceof Error ? cause.message : String(cause);

interface TopicMatchesInput {
	actions: InsightActions;
	/** The topic's id on this page; one made here is resolved to its server id before each call. */
	topicId: string;
	serverId: (id: string) => Promise<string>;
	/** Find new conversations, or re-sort the topic's own; default find. */
	mode?: TopicMatchMode;
	/** Re-read Brain and Work once choices are applied. */
	onApplied: () => void;
}

/** Nothing checked yet, a check running, its rows ready, or why it stopped. */
export type TopicMatchesPhase = "intro" | "checking" | "ready" | "failed";

/** The review of one topic's matches, from starting the check to applying the owner's choices. */
export interface TopicMatchesReview {
	phase: TopicMatchesPhase;
	/** The running or finished check. */
	job: Job | null;
	error: string | null;
	/** Conversations the finished check scored, and how many of them fit. */
	scanned: number;
	found: number;
	/** Rows still to decide; applied ones leave the list. */
	remaining: TopicMatch[];
	/** The rows on screen, which Apply decides. */
	visible: TopicMatch[];
	/**
	 * What Apply sends for the rows on screen: their op, and for an unchecked row reject (find) or nothing,
	 * so it stays as it is (re-sort).
	 */
	changes: TopicMatchChange[];
	isStarting: boolean;
	isApplying: boolean;
	isChecked: (threadId: string) => boolean;
	opOf: (match: TopicMatch) => TopicMatchOp;
	setChecked: (threadId: string, checked: boolean) => void;
	setOp: (threadId: string, op: TopicMatchOp) => void;
	showMore: () => void;
	/** Start a check, or pick up the one running for this topic; earlier choices are cleared. */
	check: () => Promise<void>;
	/** Apply the choices on screen; null when nothing was sent (see error). */
	apply: () => Promise<TopicMatchApplyResult | null>;
}

/** Find a topic's matching conversations with a server check and apply the owner's choices for them. */
export function useTopicMatches({
	actions,
	topicId,
	serverId,
	mode = "find",
	onApplied,
}: TopicMatchesInput): TopicMatchesReview {
	const [jobId, setJobId] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [decided, setDecided] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [ops, setOps] = useState<Readonly<Record<string, TopicMatchOp>>>({});
	const [shown, setShown] = useState(PAGE);
	const { job, error: pollError } = useJob(
		actions,
		mode === "resort" ? "topic_resort" : "topic_match",
		jobId,
	);
	const preview = job?.status === "done" ? readTopicMatches(job) : null;
	const remaining =
		preview?.matches.filter((match) => !decided.has(match.threadId)) ?? [];
	const visible = remaining.slice(0, shown);
	const opOf = (match: TopicMatch): TopicMatchOp => {
		const chosen = ops[match.threadId];
		return chosen && match.ops.includes(chosen) ? chosen : match.op;
	};
	const changes: TopicMatchChange[] = [];
	for (const match of visible) {
		const op = unchecked.has(match.threadId) ? "reject" : opOf(match);
		if (mode === "resort" && unchecked.has(match.threadId)) continue;
		changes.push({
			threadId: match.threadId,
			op,
			...(mode === "resort" && op === "move" && match.toTopicId
				? { toTopicId: match.toTopicId }
				: {}),
		});
	}

	let phase: TopicMatchesPhase = "checking";
	let jobError: string | null = null;
	if (!jobId) phase = "intro";
	else if (job?.status === "done") {
		phase = preview ? "ready" : "failed";
		if (!preview)
			jobError =
				"The check finished, but its result could not be read. Check again.";
	} else if (job?.status === "failed") {
		phase = "failed";
		jobError = job.error || "The check stopped before it finished.";
	}

	const check = async (): Promise<void> => {
		setIsStarting(true);
		setRequestError(null);
		try {
			const started = await startTopicMatches(
				actions,
				await serverId(topicId),
				mode,
			);
			if (!started.id) throw new Error("The check did not start.");
			setDecided(new Set());
			setUnchecked(new Set());
			setOps({});
			setShown(PAGE);
			setJobId(started.id);
		} catch (cause: unknown) {
			setRequestError(messageOf(cause));
		} finally {
			setIsStarting(false);
		}
	};

	const apply = async (): Promise<TopicMatchApplyResult | null> => {
		if (!changes.length) return null;
		setIsApplying(true);
		setRequestError(null);
		try {
			const result = await applyTopicMatches(
				actions,
				await serverId(topicId),
				changes,
			);
			// every row on screen is decided, including re-sort rows left unchecked
			setDecided(
				(current) =>
					new Set([
						...current,
						...visible.map((match) => match.threadId),
					]),
			);
			setShown(PAGE);
			onApplied();
			return result;
		} catch (cause: unknown) {
			setRequestError(messageOf(cause));
			return null;
		} finally {
			setIsApplying(false);
		}
	};

	return {
		phase,
		job,
		error: requestError ?? jobError ?? pollError,
		scanned: preview?.scanned ?? 0,
		found: preview?.matches.length ?? 0,
		remaining,
		visible,
		changes,
		isStarting,
		isApplying,
		isChecked: (threadId) => !unchecked.has(threadId),
		opOf,
		setChecked: (threadId, checked) =>
			setUnchecked((current) => {
				const next = new Set(current);
				if (checked) next.delete(threadId);
				else next.add(threadId);
				return next;
			}),
		setOp: (threadId, op) =>
			setOps((current) => ({ ...current, [threadId]: op })),
		showMore: () => setShown((current) => current + PAGE),
		check,
		apply,
	};
}
