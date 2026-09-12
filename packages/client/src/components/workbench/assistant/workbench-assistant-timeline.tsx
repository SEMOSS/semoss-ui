import { MoveDownIcon, SparklesIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type { WorkbenchAssistantNotice } from "@/stores/workbench";
import { parseTime } from "./workbench-assistant-format";
import { WorkbenchAssistantTurn } from "./workbench-assistant-turn";

/** A run or system notice positioned on the timeline by timestamp. */
type TimelineEntry =
	| { type: "run"; key: string; time: number; runId: string }
	| {
			type: "notice";
			key: string;
			time: number;
			notice: WorkbenchAssistantNotice;
	  };

interface NoticeCardProps {
	/** The system notice to display */
	notice: WorkbenchAssistantNotice;

	/** Called with the notice ID when the user dismisses an error notice */
	onDismiss: (id: string) => void;
}

/**
 * Inline system notice on the timeline: error-tone notices render as a
 * dismissible destructive alert, every other tone renders as a centered
 * muted info line.
 *
 * @name NoticeCard
 * @param notice - The system notice to display.
 * @param onDismiss - Called with the notice ID when the user dismisses it.
 * @return The notice alert or info line.
 */
const NoticeCard = ({ notice, onDismiss }: NoticeCardProps) => {
	if (notice.tone === "error") {
		return (
			<Alert variant="destructive" className="w-auto">
				<AlertDescription className="flex w-full items-start gap-2">
					<span className="min-w-0 flex-1 whitespace-pre-wrap">
						{notice.text}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Dismiss notice"
						className="-my-1 shrink-0"
						onClick={() => onDismiss(notice.id)}
					>
						<XIcon />
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<p className="text-center text-muted-foreground text-xs">
			{notice.text}
		</p>
	);
};

/**
 * The scrollable assistant region: runs and system notices merged in timestamp
 * order, an empty state before the first prompt, and scroll pinning — only
 * user wheel/touch scrolls unpin, content growth auto-scrolls while pinned,
 * and a floating scroll-to-latest button appears when activity arrives while
 * scrolled away. Shows a spinner during assistant initialization and an empty
 * state before the first prompt.
 *
 * @name WorkbenchAssistantTimeline
 * @return The scrollable assistant timeline region.
 */
export const WorkbenchAssistantTimeline = () => {
	const roomRunIds = useWorkbench((state) => state.assistant.roomRunIds);
	const runs = useWorkbench((state) => state.assistant.runs);
	const notices = useWorkbench((state) => state.assistant.notices);
	const isInitializing = useWorkbench(
		(state) => state.assistant.isInitializing,
	);
	const activeRunId = useWorkbench((state) => state.assistant.activeRunId);
	const dismissNotice = useWorkbench(
		(state) => state.assistant.dismissNotice,
	);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const pinnedRef = useRef(true);
	const previousActivityCountRef = useRef(0);
	const previousActiveRunIdRef = useRef<string | null>(null);
	const [showScrollDown, setShowScrollDown] = useState(false);

	const entries = useMemo<TimelineEntry[]>(() => {
		const merged: TimelineEntry[] = [];
		// roomRunIds is the authoritative conversation order — clamp each
		// run's time to be monotonically non-decreasing so a missing or
		// unparseable dateCreated can never hoist a run above an earlier
		// one. Notices still interleave by their own timestamps.
		let lastRunTime = 0;
		for (const runId of roomRunIds) {
			lastRunTime = Math.max(
				lastRunTime,
				parseTime(runs[runId]?.dateCreated),
			);
			merged.push({
				type: "run",
				key: `run-${runId}`,
				time: lastRunTime,
				runId,
			});
		}
		for (const notice of notices) {
			merged.push({
				type: "notice",
				key: `notice-${notice.id}`,
				time: parseTime(notice.timestamp),
				notice,
			});
		}
		return merged.sort((a, b) => a.time - b.time);
	}, [notices, roomRunIds, runs]);

	const hasContent = entries.length > 0;

	// Total activity across every run (children included) so content growth
	// anywhere in the tree either auto-scrolls or reveals the scroll-down
	// affordance.
	const activityCount = useMemo(() => {
		let total = roomRunIds.length + notices.length;
		for (const run of Object.values(runs)) {
			total +=
				run.messages.length +
				run.tools.length +
				run.pendingActions.length;
		}
		return total;
	}, [notices.length, roomRunIds.length, runs]);

	// Track whether the user is pinned near the bottom. Only user-initiated
	// scrolls (wheel/touch) flip this — programmatic scrollTo calls don't, so
	// smooth auto-scroll animations aren't mistaken for scroll-away.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the scroll container only mounts once content exists, so listeners must re-attach when hasContent flips.
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const updatePinState = () => {
			const distanceFromBottom =
				container.scrollHeight -
				container.scrollTop -
				container.clientHeight;
			pinnedRef.current = distanceFromBottom < 80;
			if (pinnedRef.current) {
				setShowScrollDown(false);
			}
		};
		container.addEventListener("wheel", updatePinState, { passive: true });
		container.addEventListener("touchmove", updatePinState, {
			passive: true,
		});
		return () => {
			container.removeEventListener("wheel", updatePinState);
			container.removeEventListener("touchmove", updatePinState);
		};
	}, [hasContent]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const previousCount = previousActivityCountRef.current;
		previousActivityCountRef.current = activityCount;

		// A freshly-submitted run always re-pins to the bottom.
		if (activeRunId && activeRunId !== previousActiveRunIdRef.current) {
			pinnedRef.current = true;
			setShowScrollDown(false);
		}
		previousActiveRunIdRef.current = activeRunId;

		if (!pinnedRef.current) {
			if (activityCount > previousCount) {
				setShowScrollDown(true);
			}
			return;
		}

		container.scrollTo({
			top: container.scrollHeight,
			behavior: previousCount === 0 ? "auto" : "smooth",
		});
		setShowScrollDown(false);
	}, [activityCount, activeRunId]);

	const scrollToLatestActivity = () => {
		const container = containerRef.current;
		if (!container) return;
		pinnedRef.current = true;
		setShowScrollDown(false);
		container.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});
	};

	if (isInitializing) {
		return (
			<div className="relative min-h-0 flex-1">
				<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
					<Spinner className="size-5" />
					<span>Preparing the assistant…</span>
				</div>
			</div>
		);
	}

	if (!hasContent) {
		return (
			<div className="relative min-h-0 flex-1">
				<div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
					<div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
						<SparklesIcon className="size-8 text-emerald-500" />
					</div>
					<div className="flex max-w-sm flex-col gap-2">
						<p className="font-semibold text-foreground text-lg">
							What can I help you with?
						</p>
						<p className="text-muted-foreground text-sm">
							Share a workflow, paste requirements, ask for
							changes, or get help in plain language.
						</p>
					</div>
					<p className="max-w-sm text-muted-foreground/80 text-xs">
						Examples: &quot;Create an intake app for internal
						requests&quot; or &quot;Turn this spreadsheet into a
						dashboard&quot; or &quot;How do I pass data between
						automation steps?&quot;
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="relative min-h-0 flex-1">
			<div ref={containerRef} className="h-full min-h-0 overflow-y-auto">
				<div className="flex min-h-full flex-col gap-2 px-4 py-6">
					{entries.map((entry) =>
						entry.type === "run" ? (
							<WorkbenchAssistantTurn
								key={entry.key}
								runId={entry.runId}
							/>
						) : (
							<NoticeCard
								key={entry.key}
								notice={entry.notice}
								onDismiss={dismissNotice}
							/>
						),
					)}
				</div>
			</div>

			{showScrollDown ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							aria-label="Latest message"
							onClick={scrollToLatestActivity}
							className="-translate-x-1/2 absolute bottom-3 left-1/2 z-10 rounded-full bg-background shadow-md"
						>
							<MoveDownIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Latest message</TooltipContent>
				</Tooltip>
			) : null}
		</div>
	);
};
