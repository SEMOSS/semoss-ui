import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, P } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { updateWorkStep } from "../api/work-steps";
import { runBatch } from "../live/live-state";
import { useWorkChanged } from "../state/collaboration-session.context";
import { type TaskStep, toTaskStep } from "./task-step-row";

type Row = Record<string, unknown>;

/** How far back a work item's last change may be for its closed steps to count as recent. */
const RECENT_DAYS = 7;
/** At most this many work items are read in full, newest change first. */
const MAX_ITEMS = 30;

const rows = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];
const str = (value: unknown): string =>
	typeof value === "string" ? value : "";
const errorText = (cause: unknown) =>
	cause instanceof Error ? cause.message : String(cause);

interface ClosedStep {
	step: TaskStep;
	itemPath: string;
	itemTitle: string;
}

/** Whether the server's timestamp (`YYYY-MM-DD HH:MM:SS`) is inside the recent window; an unreadable one counts. */
function isRecent(at: string): boolean {
	const time = new Date(at.replace(" ", "T")).getTime();
	return Number.isNaN(time) || Date.now() - time <= RECENT_DAYS * 86_400_000;
}

/**
 * Steps a message closed. The list call gives only open steps and no per-step
 * close time, so this reads the full work item for each item that changed
 * recently and has a step beyond its open ones. Loose steps (no work item) are
 * not covered: the server lists only open ones.
 */
async function loadClosed(
	actions: ReturnType<typeof useInsight>["actions"],
): Promise<ClosedStep[]> {
	const [out] = (await runBatch(actions, [
		pixel("WorkListMyWork", { status: "all" }),
	])) as Row[];
	const candidates = rows(out?.workItems)
		.filter((item) => {
			const count =
				typeof item.stepCount === "number" ? item.stepCount : 0;
			return (
				count > rows(item.openSteps).length &&
				isRecent(str(item.updatedAt))
			);
		})
		.slice(0, MAX_ITEMS);
	if (!candidates.length) return [];
	const works = (await runBatch(
		actions,
		candidates.map((item) =>
			pixel("WorkGetWork", { taskId: str(item.id) }),
		),
	)) as Row[];
	const closed: ClosedStep[] = [];
	candidates.forEach((item, at) => {
		for (const row of rows(works[at]?.steps)) {
			const step = toTaskStep(row);
			if (
				step.status === "done" &&
				step.closedBy &&
				step.closedBy !== "owner"
			) {
				closed.push({
					step,
					itemPath: str(item.roomId)
						? roomPath(str(item.roomId))
						: `/work/item/${str(item.id)}`,
					itemTitle: str(item.title),
				});
			}
		}
	});
	return closed;
}

/** Steps a message closed for the owner, read when the section is opened; each can be reopened. */
export function ClosedForYou() {
	const { actions } = useInsight();
	const { workVersion, markWorkChanged } = useWorkChanged();
	const [isOpen, setIsOpen] = useState(false);
	const [closed, setClosed] = useState<ClosedStep[] | null>(null);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState("");
	useEffect(() => {
		// reads again when work changes elsewhere while the section is open
		if (!isOpen || workVersion < 0) return;
		let live = true;
		loadClosed(actions)
			.then((found) => {
				if (!live) return;
				setClosed(found);
				setError("");
			})
			.catch((cause) => live && setError(errorText(cause)));
		return () => {
			live = false;
		};
	}, [actions, isOpen, workVersion]);
	const reopen = async (stepId: string) => {
		setBusyId(stepId);
		try {
			await updateWorkStep(actions, stepId, { status: "open" });
			setClosed(
				(current) =>
					current?.filter((c) => c.step.id !== stepId) ?? null,
			);
			markWorkChanged();
		} catch (cause) {
			setError(errorText(cause));
		} finally {
			setBusyId("");
		}
	};
	return (
		<section aria-label="Closed for you" className="mt-2 border-t">
			<button
				type="button"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((v) => !v)}
				className="flex w-full items-center gap-2 rounded-sm py-3 text-left text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
			>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 transition-transform motion-reduce:transition-none",
						isOpen && "rotate-180",
					)}
				/>
				Closed for you
			</button>
			{isOpen ? (
				error ? (
					<P role="alert" className="text-destructive text-sm">
						{error}
					</P>
				) : closed === null ? (
					<P className="text-muted-foreground text-sm">Loading...</P>
				) : closed.length ? (
					<ul
						aria-label="Steps closed for you"
						className="divide-y divide-border border-t"
					>
						{closed.map(({ step, itemPath, itemTitle }) => (
							<li
								key={step.id}
								className="flex items-start gap-3 py-3"
							>
								<div className="min-w-0 flex-1 space-y-0.5">
									<P className="wrap-anywhere text-sm">
										{step.text}
									</P>
									<P className="wrap-anywhere text-muted-foreground text-xs">
										{step.closedSubject
											? `From "${step.closedSubject}"`
											: "From a message"}
										{" on "}
										<Link
											to={itemPath}
											className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
										>
											{itemTitle}
										</Link>
									</P>
									{step.closedText ? (
										<P className="wrap-anywhere text-muted-foreground text-xs">
											{step.closedText}
										</P>
									) : null}
								</div>
								<Button
									size="sm"
									variant="outline"
									disabled={busyId === step.id}
									aria-label={`Reopen step ${step.text}`}
									onClick={() => void reopen(step.id)}
								>
									Reopen
								</Button>
							</li>
						))}
					</ul>
				) : (
					<P className="text-muted-foreground text-sm">
						No messages closed a step for you in the last{" "}
						{RECENT_DAYS} days.
					</P>
				)
			) : null}
		</section>
	);
}
