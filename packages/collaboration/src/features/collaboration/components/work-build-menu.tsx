import { Mail, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Small,
	toast,
} from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { runBatch } from "../live/live-state";
import { useWorkChanged } from "../state/collaboration-session.context";

// The owner builds work items from their recent mail and chats, and sees the run's progress.

type Status = Record<string, unknown>;

const num = (value: unknown) => (typeof value === "number" ? value : 0);
const ACTIVE = new Set(["queued", "running", "grouping", "tidying"]);

// m:ss since the run started; the 3 s status poll keeps it moving
function elapsed(status: Status): string {
	const started = Date.parse(String(status.startedAt ?? ""));
	if (Number.isNaN(started)) return "";
	const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function label(status: Status): string {
	switch (status.state) {
		case "queued":
			return num(status.threads) > 0
				? `Waiting to start (${num(status.threads)} threads)`
				: "Starting...";
		case "running": {
			// a long thread is read in parts, so the thread count can sit still while parts move
			const parts = num(status.windows);
			const threads = `Reading threads ${num(status.extracted)} of ${num(status.threads)}`;
			return parts > 0
				? `${threads} (${num(status.windowsRead)} of ${parts} parts)`
				: threads;
		}
		case "grouping": {
			const topics = num(status.groupTopics);
			return topics > 0
				? `Grouping topic ${Math.min(num(status.groupedTopics) + 1, topics)} of ${topics}`
				: "Grouping into work items...";
		}
		case "tidying":
			return `Tidying steps ${num(status.tidied)} of ${num(status.items)}`;
		default:
			return "";
	}
}

function progress(status: Status): string {
	const text = label(status);
	const time = ACTIVE.has(String(status.state)) ? elapsed(status) : "";
	// a build waiting behind this one, or the rest of a first build read in parts
	const after = status.state !== "queued" ? num(status.queuedThreads) : 0;
	return [text, time, after > 0 ? `then ${after} more threads` : ""]
		.filter(Boolean)
		.join(" - ");
}

/** "Build from mail": starts a build, shows its progress, and tells every view of work when it is done. */
export function WorkBuildMenu({ onDone }: { onDone?: () => void }) {
	const { actions } = useInsight();
	const { markWorkChanged } = useWorkChanged();
	const [status, setStatus] = useState<Status | null>(null);
	const timer = useRef<number | undefined>(undefined);
	const busy = Boolean(status && ACTIVE.has(String(status.state)));

	const poll = useCallback(async () => {
		try {
			const [out] = (await runBatch(actions, [
				pixel("WorkBuildItems", { status: true }),
			])) as Status[];
			const next = out ?? {};
			setStatus(next);
			if (ACTIVE.has(String(next.state))) {
				timer.current = window.setTimeout(() => void poll(), 3000);
				return;
			}
			if (next.state === "done") {
				markWorkChanged();
				onDone?.();
			}
			if (next.state === "error")
				toast.error(String(next.error ?? "Building work items failed"));
		} catch {
			// a failed status check leaves the button usable
			setStatus(null);
		}
	}, [actions, markWorkChanged, onDone]);

	// a build already running (from another tab or a sync) shows its progress
	useEffect(() => {
		void runBatch(actions, [pixel("WorkBuildItems", { status: true })])
			.then(([out]) => {
				const s = (out ?? {}) as Status;
				if (ACTIVE.has(String(s.state))) {
					setStatus(s);
					timer.current = window.setTimeout(() => void poll(), 3000);
				}
			})
			.catch(() => {});
		return () => window.clearTimeout(timer.current);
	}, [actions, poll]);

	const start = async (args: Record<string, unknown>) => {
		try {
			await runBatch(actions, [pixel("WorkBuildItems", args)]);
			setStatus({ state: "queued" });
			timer.current = window.setTimeout(() => void poll(), 1500);
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : String(cause));
		}
	};

	return (
		<div className="flex items-center gap-3">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						disabled={busy}
						className="pointer-coarse:min-h-11 text-foreground"
					>
						{busy ? (
							<RefreshCw
								aria-hidden="true"
								className="animate-spin"
							/>
						) : (
							<Mail aria-hidden="true" />
						)}
						Build from mail
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
						Read your threads and add work items
					</DropdownMenuLabel>
					<DropdownMenuItem onSelect={() => void start({ days: 3 })}>
						Last 3 days
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => void start({ days: 14 })}>
						Last 2 weeks
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => void start({ days: 30 })}>
						Last 30 days
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={() => void start({ tidy: true })}
					>
						Tidy duplicate steps
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{/* after the button, which sits at the start of the page's action line */}
			{busy && status ? (
				<Small className="text-muted-foreground tabular-nums">
					{progress(status)}
				</Small>
			) : null}
		</div>
	);
}
