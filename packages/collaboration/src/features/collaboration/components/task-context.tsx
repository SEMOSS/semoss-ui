import {
	CheckCircle2,
	ChevronRight,
	Circle,
	Clock,
	Mail,
	MessagesSquare,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { cn, P, Progress, Small } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { threadPath } from "@/lib/workspace-paths";
import { runBatch } from "../live/live-state";
import { PersonAvatar } from "./person-avatar";

type Row = Record<string, unknown>;

interface TaskStep {
	id: string;
	text: string;
	kind: string;
	status: string;
	assigneeId: string;
	assigneeName: string;
}

export interface TaskThread {
	id: string;
	subject: string;
	source: string;
}

export interface TaskView {
	id: string;
	title: string;
	steps: TaskStep[];
	threads: TaskThread[];
	timeline: { id: string; text: string }[];
	selfId: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

async function loadTask(
	actions: ReturnType<typeof useInsight>["actions"],
	key: { taskId?: string; roomId?: string },
): Promise<TaskView | null> {
	const [work] = (await runBatch(actions, [
		pixel("WorkGetWork", key),
	])) as Row[];
	if (!work?.id) return null;
	const taskId = str(work.id);
	const selfId = str(work.selfId);
	return {
		id: taskId,
		title: str(work?.title),
		selfId,
		steps: rows(work?.steps).map((s) => ({
			id: str(s.id),
			text: str(s.text),
			kind: str(s.kind),
			status: str(s.status),
			assigneeId: str(s.assigneeId),
			assigneeName: str(s.assigneeName),
		})),
		threads: rows(work?.threads).map((t) => ({
			id: str(t.threadId),
			subject: str(t.subject) || "(no subject)",
			source: str(t.source),
		})),
		timeline: rows(work?.timeline)
			.slice(0, 5)
			.map((u) => ({ id: str(u.id), text: str(u.text) })),
	};
}

/** The task a room belongs to (or the task itself): steps, threads and updates. */
export function useTaskContext(key: { taskId?: string; roomId?: string }): {
	task: TaskView | null;
	loading: boolean;
	error: string;
} {
	const { actions } = useInsight();
	const { taskId, roomId } = key;
	const current = `${taskId ?? ""}|${roomId ?? ""}`;
	// results are tagged with their key so a new room never shows the last room's task
	const [result, setResult] = useState<{
		key: string;
		task: TaskView | null;
		error: string;
	} | null>(null);
	useEffect(() => {
		let live = true;
		const key = `${taskId ?? ""}|${roomId ?? ""}`;
		loadTask(actions, { taskId, roomId })
			.then((task) => live && setResult({ key, task, error: "" }))
			.catch(
				(e) =>
					live &&
					setResult({
						key,
						task: null,
						error: e instanceof Error ? e.message : String(e),
					}),
			);
		return () => {
			live = false;
		};
	}, [actions, taskId, roomId]);
	const fresh = result?.key === current ? result : null;
	return {
		task: fresh?.task ?? null,
		loading: !fresh,
		error: fresh?.error ?? "",
	};
}

const headingClassName =
	"font-semibold text-muted-foreground text-xs uppercase tracking-wider";

function Section({
	title,
	count,
	children,
}: {
	title: string;
	count?: number;
	children: ReactNode;
}) {
	return (
		<section className="space-y-2" aria-label={title}>
			<div className="flex items-center gap-2">
				<Small className={headingClassName}>{title}</Small>
				{count ? (
					<span className="rounded-full bg-muted px-1.5 font-medium text-muted-foreground text-xs tabular-nums">
						{count}
					</span>
				) : null}
			</div>
			{children}
		</section>
	);
}

function StepRow({
	step,
	state,
}: {
	step: TaskStep;
	state: "mine" | "waiting" | "done";
}) {
	const Icon =
		state === "done" ? CheckCircle2 : state === "waiting" ? Clock : Circle;
	return (
		<li className="flex items-start gap-2.5 px-3 py-2">
			<Icon
				aria-hidden="true"
				className={cn(
					"mt-0.5 size-4 shrink-0",
					state === "done" && "text-success",
					state === "mine" && "text-primary",
					state === "waiting" && "text-muted-foreground",
				)}
			/>
			<div className="min-w-0 flex-1 text-sm">
				<span
					className={cn(
						"break-words",
						state === "done" &&
							"text-muted-foreground line-through decoration-muted-foreground/40",
					)}
				>
					{step.text}
				</span>
				{state === "waiting" ? (
					<span className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
						{step.assigneeName ? (
							<PersonAvatar
								name={step.assigneeName}
								className="size-4 text-[0.5rem]"
							/>
						) : null}
						Waiting on {step.assigneeName || "someone"}
					</span>
				) : null}
			</div>
		</li>
	);
}

function StepList({
	steps,
	state,
}: {
	steps: TaskStep[];
	state: "mine" | "waiting" | "done";
}) {
	return (
		<ul className="divide-y divide-border overflow-hidden rounded-lg border bg-background">
			{steps.map((s) => (
				<StepRow key={s.id} step={s} state={state} />
			))}
		</ul>
	);
}

interface TaskContextViewProps {
	task: TaskView;
	/** Show the task name (the room and page headers already do). */
	showTitle?: boolean;
	/** Open a thread beside the chat; without it a thread is a link. */
	onOpenThread?: (thread: TaskThread) => void;
	className?: string;
}

/** Steps grouped by who owes them, then the threads the task came from. */
export function TaskContextView({
	task,
	showTitle,
	onOpenThread,
	className,
}: TaskContextViewProps) {
	const open = task.steps.filter(
		(s) => s.status === "open" || s.status === "waiting",
	);
	const waiting = open.filter(
		(s) =>
			s.kind === "waiting_on" ||
			s.status === "waiting" ||
			(s.assigneeId && s.assigneeId !== task.selfId),
	);
	const mine = open.filter((s) => !waiting.includes(s));
	const done = task.steps.filter((s) => s.status === "done");
	const total = open.length + done.length;
	return (
		<div className={cn("space-y-5 p-4", className)}>
			{showTitle || total ? (
				<div className="space-y-2">
					{showTitle ? (
						<Small className="block break-words font-display font-semibold text-base">
							{task.title}
						</Small>
					) : null}
					{total ? (
						<div className="flex items-center gap-3">
							<Progress
								value={(done.length / total) * 100}
								aria-label={`${done.length} of ${total} steps done`}
								className="h-1.5 flex-1"
							/>
							<Small className="shrink-0 text-muted-foreground text-xs tabular-nums">
								{done.length} of {total} done
							</Small>
						</div>
					) : null}
				</div>
			) : null}
			<Section title="Your steps" count={mine.length}>
				{mine.length ? (
					<StepList steps={mine} state="mine" />
				) : (
					<P className="text-muted-foreground text-sm">
						Nothing left for you.
					</P>
				)}
			</Section>
			{waiting.length ? (
				<Section title="Waiting on others" count={waiting.length}>
					<StepList steps={waiting} state="waiting" />
				</Section>
			) : null}
			{task.threads.length ? (
				<Section title="Related threads" count={task.threads.length}>
					<ul className="space-y-1.5">
						{task.threads.map((t) => {
							const isTeams = t.source === "teams";
							const Icon = isTeams ? MessagesSquare : Mail;
							const row =
								"group flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring";
							const body = (
								<>
									<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
										<Icon
											aria-hidden="true"
											className="size-3.5 text-muted-foreground"
										/>
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate">
											{t.subject}
										</span>
										<span className="block text-muted-foreground text-xs">
											{isTeams ? "Teams chat" : "Email"}
										</span>
									</span>
									<ChevronRight
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground"
									/>
								</>
							);
							return (
								<li key={t.id}>
									{onOpenThread ? (
										<button
											type="button"
											className={row}
											title={t.subject}
											onClick={() => onOpenThread(t)}
										>
											{body}
										</button>
									) : (
										<Link
											to={threadPath(t.id)}
											className={row}
											title={t.subject}
										>
											{body}
										</Link>
									)}
								</li>
							);
						})}
					</ul>
				</Section>
			) : null}
			{task.timeline.length ? (
				<Section title="Recent updates">
					<ol className="relative space-y-3 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[3px] before:w-px before:bg-border">
						{task.timeline.map((u) => (
							<li
								key={u.id}
								className="before:-left-4 relative break-words text-muted-foreground text-sm before:absolute before:top-1.5 before:size-[7px] before:rounded-full before:border before:border-border before:bg-background"
							>
								{u.text}
							</li>
						))}
					</ol>
				</Section>
			) : null}
			{done.length ? (
				<Section title="Done" count={done.length}>
					<StepList steps={done} state="done" />
				</Section>
			) : null}
		</div>
	);
}
