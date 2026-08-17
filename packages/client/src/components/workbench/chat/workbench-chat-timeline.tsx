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
import type { WorkbenchChatNotice } from "@/stores/workbench";
import { parseTime } from "./workbench-chat-format";
import { WorkbenchChatTurn } from "./workbench-chat-turn";

/** A run or system notice positioned on the timeline by timestamp. */
type TimelineEntry =
	| { type: "run"; key: string; time: number; runId: string }
	| {
			type: "notice";
			key: string;
			time: number;
			notice: WorkbenchChatNotice;
	  };

interface NoticeCardProps {
	/** The system notice to display */
	notice: WorkbenchChatNotice;

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
 * The scrollable chat region: runs and system notices merged in timestamp
 * order, an empty state before the first prompt, and scroll pinning — only
 * user wheel/touch scrolls unpin, content growth auto-scrolls while pinned,
 * and a floating scroll-to-latest button appears when activity arrives while
 * scrolled away. Shows a spinner during chat initialization and an empty
 * state before the first prompt.
 *
 * @name WorkbenchChatTimeline
 * @return The scrollable chat timeline region.
 */
export const WorkbenchChatTimeline = () => {
	const roomRunIds = useWorkbench((state) => state.chat.roomRunIds);
	const runs = useWorkbench((state) => state.chat.runs);
	const notices = useWorkbench((state) => state.chat.notices);
	const isInitializing = useWorkbench((state) => state.chat.isInitializing);
	const activeRunId = useWorkbench((state) => state.chat.activeRunId);
	const dismissNotice = useWorkbench((state) => state.chat.dismissNotice);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const pinnedRef = useRef(true);
	const previousActivityCountRef = useRef(0);
	const previousActiveRunIdRef = useRef<string | null>(null);
	const [showScrollDown, setShowScrollDown] = useState(false);

	const entries = useMemo<TimelineEntry[]>(() => {
		const merged: TimelineEntry[] = [];
		for (const runId of roomRunIds) {
			merged.push({
				type: "run",
				key: `run-${runId}`,
				time: parseTime(runs[runId]?.dateCreated),
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
				<div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
					<div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
						<SparklesIcon className="size-5" />
					</div>
					<p className="font-medium text-foreground text-sm">
						How can I help?
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
							<WorkbenchChatTurn
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
