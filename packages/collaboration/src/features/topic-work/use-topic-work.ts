import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type Item,
	isMyStep,
	mineNext,
	type Step,
	toItem,
	toStep,
	waitingOn,
} from "@/features/collaboration/components/work-items-list";
import { runBatch } from "@/features/collaboration/live/live-state";
import { useWorkChanged } from "@/features/collaboration/state/collaboration-session.context";
import { pixel } from "@/lib/pixel";

/** How many finished items the Recently Done group shows. */
export const RECENTLY_DONE_LIMIT = 5;

type Row = Record<string, unknown>;

/** A topic's work items in the groups the topic panel and page show. */
export interface TopicWork {
	/** Items with a next step of the owner's. */
	yours: Item[];
	/** Items with a step someone else owes the owner; an item can be in both groups, as on the Work page. */
	waiting: Item[];
	/** The latest finished items, newest first; at most {@link RECENTLY_DONE_LIMIT}. */
	done: Item[];
	/** The owner's steps under the topic that belong to no work item. */
	single: Step[];
	/** How many finished items there are in all, so a cut list can say so. */
	doneTotal: number;
	isMine: (step: Step) => boolean;
}

const rows = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];

const asRow = (value: unknown): Row =>
	typeof value === "object" && value !== null ? (value as Row) : {};

/** Sort a topic's items with the Work page's rules; items still waiting for the owner's review are left out. */
export function groupTopicWork(
	open: Item[],
	done: Item[],
	selfId: string,
	single: Step[] = [],
): TopicWork {
	const isMine = (step: Step) => isMyStep(step, selfId);
	const mine = open.filter((item) => item.mine && !item.proposed);
	return {
		yours: mine.filter((item) => mineNext(item, isMine)),
		waiting: mine.filter((item) => waitingOn(item, isMine)),
		done: [...done]
			.sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""))
			.slice(0, RECENTLY_DONE_LIMIT),
		single,
		doneTotal: done.length,
		isMine,
	};
}

/** The owner's work items under one topic, read again whenever work changes elsewhere, such as a step ticked in the Task tab. */
export function useTopicWork(topicId: string): {
	work: TopicWork | null;
	error: string;
} {
	const { actions } = useInsight();
	const { workVersion } = useWorkChanged();
	// results are tagged with their topic so a new topic never shows the last topic's work
	const [result, setResult] = useState<{
		topicId: string;
		work: TopicWork | null;
		error: string;
	} | null>(null);

	useEffect(() => {
		// workVersion only moves up; reading it re-runs this effect when work changes elsewhere
		if (workVersion < 0) return;
		let live = true;
		runBatch(actions, [
			// includeSuggested: the assistant's own single steps are the owner's to see, as on the Work page
			pixel("WorkListMyWork", { topicId, includeSuggested: true }),
			pixel("WorkListMyWork", { topicId, status: "done" }),
		])
			.then(([openOut, doneOut]) => {
				if (!live) return;
				const open = asRow(openOut);
				// the done read also returns dropped items, which are not work that got done
				const done = rows(asRow(doneOut).workItems)
					.filter((row) => row.status === "done")
					.map(toItem);
				setResult({
					topicId,
					error: "",
					work: groupTopicWork(
						rows(open.workItems).map(toItem),
						done,
						typeof open.selfId === "string" ? open.selfId : "",
						rows(open.looseSteps).map(toStep),
					),
				});
			})
			.catch((cause: unknown) => {
				if (!live) return;
				// a failed re-read keeps the list already shown; only a first read has nothing to fall back on
				setResult((previous) =>
					previous?.topicId === topicId && previous.work
						? previous
						: {
								topicId,
								work: null,
								error:
									cause instanceof Error
										? cause.message
										: String(cause),
							},
				);
			});
		return () => {
			live = false;
		};
	}, [actions, topicId, workVersion]);

	const fresh = result?.topicId === topicId ? result : null;
	return { work: fresh?.work ?? null, error: fresh?.error ?? "" };
}
