import { RefreshCw } from "lucide-react";
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

// The owner builds work items from their recent mail and chats, and sees the run's progress.

type Status = Record<string, unknown>;

const num = (value: unknown) => (typeof value === "number" ? value : 0);
const ACTIVE = new Set(["queued", "running", "grouping", "tidying"]);

function progress(status: Status): string {
	switch (status.state) {
		case "queued":
			return "Starting...";
		case "running":
			return `Reading threads ${num(status.extracted)} of ${num(status.threads)}`;
		case "grouping":
			return "Grouping into work items...";
		case "tidying":
			return `Tidying steps ${num(status.tidied)} of ${num(status.items)}`;
		default:
			return "";
	}
}

export function WorkBuildMenu({ onDone }: { onDone: () => void }) {
	const { actions } = useInsight();
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
			if (next.state === "done") onDone();
			if (next.state === "error")
				toast.error(String(next.error ?? "Building work items failed"));
		} catch {
			// a failed status check leaves the button usable
			setStatus(null);
		}
	}, [actions, onDone]);

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
			{busy && status ? (
				<Small className="text-muted-foreground tabular-nums">
					{progress(status)}
				</Small>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" disabled={busy}>
						<RefreshCw
							aria-hidden="true"
							className={busy ? "animate-spin" : undefined}
						/>
						Build from mail
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
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
		</div>
	);
}
