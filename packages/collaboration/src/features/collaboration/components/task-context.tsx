import { ChevronRight } from "lucide-react";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, Input, P, Progress, Small } from "@semoss/ui/next";
import { OutlookIcon, TeamsIcon } from "@/components/common/app-icons";
import { pixel } from "@/lib/pixel";
import { threadPath } from "@/lib/workspace-paths";
import { updateWorkItem, type WorkItemChange } from "../api/work-items";
import {
	addWorkStep,
	updateWorkStep,
	type WorkStepChange,
} from "../api/work-steps";
import { runBatch } from "../live/live-state";
import { useWorkChanged } from "../state/collaboration-session.context";
import { TaskItemControls } from "./task-item-controls";
import { type StepInbox, type TaskStep, TaskStepRow } from "./task-step-row";

type Row = Record<string, unknown>;

interface TaskThread {
	id: string;
	subject: string;
	source: string;
}

interface TaskView {
	id: string;
	title: string;
	status: string;
	due: string;
	priority: string;
	steps: TaskStep[];
	threads: TaskThread[];
	timeline: { id: string; text: string }[];
	selfId: string;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const inboxOf = (v: unknown): StepInbox | undefined =>
	v === "needs_me" || v === "waiting" || v === "fyi" || v === "outside"
		? v
		: undefined;
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

async function loadTask(
	actions: ReturnType<typeof useInsight>["actions"],
	key: { taskId?: string; roomId?: string },
): Promise<TaskView | null> {
	// the room only knows its own id; the list says which item it belongs to
	const [list] = (await runBatch(actions, [
		pixel("WorkListMyWork"),
	])) as Row[];
	const selfId = str(list?.selfId);
	const taskId =
		key.taskId ??
		str(
			rows(list?.workItems).find((i) => str(i.roomId) === key.roomId)?.id,
		);
	if (!taskId) return null;
	const [work] = (await runBatch(actions, [
		pixel("WorkGetWork", { taskId }),
	])) as Row[];
	return {
		id: taskId,
		title: str(work?.title),
		status: str(work?.status),
		due: str(work?.due),
		priority: str(work?.priority),
		selfId,
		steps: rows(work?.steps).map((s) => ({
			id: str(s.id),
			text: str(s.text),
			kind: str(s.kind),
			status: str(s.status),
			assigneeId: str(s.assigneeId),
			assigneeName: str(s.assigneeName),
			due: str(s.due),
			closedBy: str(s.closedBy),
			closedText: str(s.closedText),
			closedSubject: str(s.closedSubject),
			inbox: inboxOf(s.inbox),
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

/** The owner's changes to a task's steps; each saves, then the task is read again. */
export interface TaskStepActions {
	change: (stepId: string, change: WorkStepChange) => void;
	add: (text: string) => void;
	/** A change is being saved. */
	isBusy: boolean;
	/** Why the last change did not save, or "". */
	error: string;
}

/** The owner's changes to the work item itself; each saves, then the task is read again. */
export interface TaskItemActions {
	change: (change: WorkItemChange) => void;
	/** A change is being saved. */
	isBusy: boolean;
	/** Why the last change did not save, or "". */
	error: string;
}

/** What {@link useTaskContext} gives a view. */
export interface TaskContext {
	task: TaskView | null;
	loading: boolean;
	error: string;
	steps: TaskStepActions;
	item: TaskItemActions;
}

/** The task a room belongs to (or the task itself): steps, threads and updates, and the owner's step changes. */
export function useTaskContext(key: {
	taskId?: string;
	roomId?: string;
}): TaskContext {
	const { actions } = useInsight();
	const { workVersion, markWorkChanged } = useWorkChanged();
	// the version this view's own change made, whose reload it has already done
	const ownVersion = useRef(-1);
	const seenVersion = useRef(workVersion);
	const { taskId, roomId } = key;
	const current = `${taskId ?? ""}|${roomId ?? ""}`;
	// results are tagged with their key so a new room never shows the last room's task
	const [result, setResult] = useState<{
		key: string;
		task: TaskView | null;
		error: string;
	} | null>(null);
	const [saving, setSaving] = useState({
		isBusy: false,
		error: "",
		from: "" as "" | "steps" | "item",
	});
	useEffect(() => {
		// another view changed work (this view's own change was read again when it saved)
		const isNewVersion = seenVersion.current !== workVersion;
		seenVersion.current = workVersion;
		if (isNewVersion && ownVersion.current === workVersion) return;
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
	}, [actions, taskId, roomId, workVersion]);
	const fresh = result?.key === current ? result : null;
	// saves a change, then reads the task again; the result is tagged, so one for another room is ignored
	const save = (from: "steps" | "item", work: Promise<void>) => {
		setSaving({ isBusy: true, error: "", from });
		work.then(() => loadTask(actions, { taskId, roomId })).then(
			(task) => {
				setSaving({ isBusy: false, error: "", from });
				setResult({ key: current, task, error: "" });
				// the list and the cards read their own copy of work
				ownVersion.current = markWorkChanged();
			},
			(e) =>
				setSaving({
					isBusy: false,
					error: e instanceof Error ? e.message : String(e),
					from,
				}),
		);
	};
	// a failure shows where the change was made
	const errorFor = (from: "steps" | "item") =>
		saving.from === from ? saving.error : "";
	const openTaskId = fresh?.task?.id;
	return {
		task: fresh?.task ?? null,
		loading: !fresh,
		error: fresh?.error ?? "",
		steps: {
			change: (stepId, change) =>
				save("steps", updateWorkStep(actions, stepId, change)),
			add: (text) => {
				if (openTaskId)
					save("steps", addWorkStep(actions, openTaskId, text));
			},
			isBusy: saving.isBusy,
			error: errorFor("steps"),
		},
		item: {
			change: (change) => {
				if (openTaskId)
					save("item", updateWorkItem(actions, openTaskId, change));
			},
			isBusy: saving.isBusy,
			error: errorFor("item"),
		},
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

function StepList({
	steps,
	state,
	selfId,
	actions,
}: {
	steps: TaskStep[];
	state: "mine" | "waiting" | "done";
	selfId: string;
	actions?: TaskStepActions;
}) {
	return (
		<ul className="divide-y divide-border overflow-hidden rounded-lg border bg-background">
			{steps.map((s) => (
				<TaskStepRow
					key={s.id}
					step={s}
					state={state}
					selfId={selfId}
					onChange={actions?.change}
					isBusy={actions?.isBusy}
				/>
			))}
		</ul>
	);
}

interface TaskContextViewProps {
	task: TaskView;
	/** Show the task name (the room and page headers already do). */
	showTitle?: boolean;
	/** The owner's step changes (from {@link useTaskContext}); without them the steps are read-only. */
	steps?: TaskStepActions;
	/** The owner's changes to the work item itself; without them the item is read-only. */
	item?: TaskItemActions;
	/** Open a thread beside the chat; without it a thread is a link. */
	onOpenThread?: (thread: TaskThread) => void;
	className?: string;
}

/** Steps grouped by who owes them, then the threads the task came from. */
export function TaskContextView({
	task,
	showTitle,
	steps,
	item,
	onOpenThread,
	className,
}: TaskContextViewProps) {
	const [newStep, setNewStep] = useState("");
	const handleAdd = (event: FormEvent) => {
		event.preventDefault();
		const text = newStep.trim();
		if (!text) return;
		steps?.add(text);
		setNewStep("");
	};
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
			{item ? (
				<div className="space-y-2">
					<TaskItemControls
						item={task}
						onChange={item.change}
						isBusy={item.isBusy}
					/>
					{item.error ? (
						<P role="alert" className="text-destructive text-sm">
							That change was not saved: {item.error}
						</P>
					) : null}
				</div>
			) : null}
			<Section title="Your steps" count={mine.length}>
				{mine.length ? (
					<StepList
						steps={mine}
						state="mine"
						selfId={task.selfId}
						actions={steps}
					/>
				) : (
					<P className="text-muted-foreground text-sm">
						Nothing left for you.
					</P>
				)}
				{steps ? (
					<form className="flex gap-2" onSubmit={handleAdd}>
						<Input
							aria-label="Add a step"
							placeholder="Add a step"
							value={newStep}
							onChange={(event) => setNewStep(event.target.value)}
						/>
						<Button
							type="submit"
							size="sm"
							variant="outline"
							disabled={steps.isBusy || !newStep.trim()}
						>
							Add
						</Button>
					</form>
				) : null}
				{steps?.error ? (
					<P role="alert" className="text-destructive text-sm">
						That change was not saved: {steps.error}
					</P>
				) : null}
			</Section>
			{waiting.length ? (
				<Section title="Waiting on others" count={waiting.length}>
					<StepList
						steps={waiting}
						state="waiting"
						selfId={task.selfId}
						actions={steps}
					/>
				</Section>
			) : null}
			{task.threads.length ? (
				<Section title="Related threads" count={task.threads.length}>
					<ul className="space-y-1.5">
						{task.threads.map((t) => {
							const isTeams = t.source === "teams";
							const Icon = isTeams ? TeamsIcon : OutlookIcon;
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
					<StepList
						steps={done}
						state="done"
						selfId={task.selfId}
						actions={steps}
					/>
				</Section>
			) : null}
		</div>
	);
}
