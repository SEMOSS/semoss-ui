import { Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, P, Small } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { threadPath } from "@/lib/workspace-paths";
import { runBatch } from "../live/live-state";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";

// The Work page: one list of the outcomes the owner is driving (D25).
// Mail, chats and meetings keep it up to date; a row opens to its steps and where they came from.

type Row = Record<string, unknown>;

interface Step {
	id: string;
	text: string;
	status: string;
	assigneeId?: string;
	assigneeName?: string;
}

interface Item {
	id: string;
	title: string;
	suggested: boolean;
	mine: boolean;
	topic?: string;
	due?: string;
	openSteps: Step[];
}

interface Detail {
	steps: Step[];
	threads: { threadId: string; subject: string; source?: string }[];
}

const str = (value: unknown): string =>
	typeof value === "string" ? value : "";
const list = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];

function toStep(row: Row): Step {
	return {
		id: str(row.id),
		text: str(row.text),
		status: str(row.status),
		assigneeId: str(row.assigneeId) || undefined,
		assigneeName: str(row.assigneeName) || undefined,
	};
}

function toItem(row: Row): Item {
	const topics = list(row.topics);
	const primary = topics.find((t) => t.primary) ?? topics[0];
	return {
		id: str(row.id),
		title: str(row.title),
		suggested: str(row.state) === "proposed",
		mine: row.mine === true,
		topic: primary ? str(primary.name) : undefined,
		due: str(row.due) || undefined,
		openSteps: list(row.openSteps).map(toStep),
	};
}

function dueLabel(due?: string): { text: string; soon: boolean } | null {
	if (!due) return null;
	const at = new Date(due.replace(" ", "T"));
	if (Number.isNaN(at.getTime())) return null;
	const days = (at.getTime() - Date.now()) / 86_400_000;
	return {
		text: at.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		}),
		soon: days < 2,
	};
}

const sourceLabel = (source?: string) =>
	source === "teams" ? "chat" : source === "meeting" ? "meeting" : "email";

/** The owner's work items; with a limit, a short list for Today that links to Work. */
export function WorkItems({ limit }: { limit?: number }) {
	const { actions } = useInsight();
	const [items, setItems] = useState<Item[] | null>(null);
	const [selfId, setSelfId] = useState<string>("");
	const [error, setError] = useState("");
	const [openId, setOpenId] = useState<string | null>(null);
	const [details, setDetails] = useState<Record<string, Detail>>({});
	const [showOthers, setShowOthers] = useState(false);

	const load = useCallback(async () => {
		try {
			const [out] = (await runBatch(actions, [
				pixel("WorkListMyWork"),
			])) as Row[];
			setItems(list(out?.workItems).map(toItem));
			setSelfId(str(out?.selfId));
			setError("");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		}
	}, [actions]);

	useEffect(() => {
		void load();
	}, [load]);

	const loadDetail = useCallback(
		async (taskId: string) => {
			const [out] = (await runBatch(actions, [
				pixel("WorkGetWork", { taskId }),
			])) as Row[];
			setDetails((current) => ({
				...current,
				[taskId]: {
					steps: list(out?.steps)
						.map(toStep)
						.filter((s) => s.status !== "dropped"),
					threads: list(out?.threads).map((t) => ({
						threadId: str(t.threadId),
						subject: str(t.subject) || "(no subject)",
						source: str(t.source) || undefined,
					})),
				},
			}));
		},
		[actions],
	);

	const toggle = (taskId: string) => {
		const next = openId === taskId ? null : taskId;
		setOpenId(next);
		if (next && !details[next]) void loadDetail(next).catch(() => {});
	};

	const run = async (statement: string, taskId?: string) => {
		try {
			await runBatch(actions, [statement]);
			if (taskId) await loadDetail(taskId);
			await load();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		}
	};

	const isMine = (step: Step) =>
		!step.assigneeId || step.assigneeId === selfId;
	const who = (step: Step) =>
		isMine(step) ? "You" : (step.assigneeName ?? "Someone");

	const allMine = (items ?? []).filter((i) => i.mine);
	const mine = limit ? allMine.slice(0, limit) : allMine;
	const others = limit ? [] : (items ?? []).filter((i) => !i.mine);

	const renderItem = (item: Item) => {
		const next =
			item.openSteps.find((s) => s.status === "open" && isMine(s)) ??
			item.openSteps[0];
		const due = dueLabel(item.due);
		const detail = details[item.id];
		const isOpen = openId === item.id;
		return (
			<li key={item.id}>
				<button
					type="button"
					aria-expanded={isOpen}
					onClick={() => toggle(item.id)}
					className="flex w-full items-baseline gap-4 px-4 py-3 text-left hover:bg-muted/40"
				>
					<div className="min-w-0 flex-1">
						<div className="font-semibold">
							{item.title}
							{item.suggested ? (
								<span className="ml-2 font-medium text-violet-600 text-xs">
									Suggested
								</span>
							) : null}
						</div>
						<div className="truncate text-muted-foreground text-sm">
							{next ? next.text : "No open steps"}
						</div>
					</div>
					{item.topic ? (
						<Small className="whitespace-nowrap text-muted-foreground">
							{item.topic}
						</Small>
					) : null}
					<Small
						className={cn(
							"w-16 whitespace-nowrap text-right text-muted-foreground",
							due?.soon && "text-destructive",
						)}
					>
						{due?.text ?? ""}
					</Small>
				</button>
				{isOpen ? (
					<div className="px-4 pb-4">
						{detail ? (
							<>
								<ul className="space-y-1">
									{detail.steps.map((step) => {
										const done = step.status === "done";
										return (
											<li
												key={step.id}
												className={cn(
													"flex items-start gap-2 text-sm",
													done
														? "text-muted-foreground line-through"
														: "text-foreground/80",
												)}
											>
												<button
													type="button"
													aria-label={
														done
															? "Reopen step"
															: "Mark step done"
													}
													onClick={() =>
														void run(
															pixel(
																"WorkUpdateStep",
																{
																	stepId: step.id,
																	status: done
																		? "open"
																		: "done",
																},
															),
															item.id,
														)
													}
													className={cn(
														"mt-0.5 flex size-4 flex-none items-center justify-center rounded border border-muted-foreground/60",
														done &&
															"bg-muted-foreground/60 text-background",
													)}
												>
													{done ? (
														<Check className="size-3" />
													) : null}
												</button>
												<span className="flex-1">
													{step.text}
												</span>
												<span className="text-muted-foreground text-xs">
													{who(step)}
												</span>
											</li>
										);
									})}
								</ul>
								{detail.threads.length ? (
									<Small className="mt-2 block text-muted-foreground">
										From{" "}
										{detail.threads.map((t, n) => (
											<span key={t.threadId}>
												{n ? ", " : ""}
												<Link
													to={threadPath(t.threadId)}
													className="underline-offset-2 hover:underline"
												>
													{t.subject}
												</Link>{" "}
												({sourceLabel(t.source)})
											</span>
										))}
									</Small>
								) : null}
							</>
						) : (
							<Small className="text-muted-foreground">
								Loading...
							</Small>
						)}
						{item.suggested ? (
							<div className="mt-3 flex gap-2">
								<Button
									size="sm"
									onClick={() =>
										void run(
											pixel("WorkSaveWork", {
												taskId: item.id,
												accept: true,
											}),
										)
									}
								>
									Keep
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										void run(
											pixel("WorkSaveWork", {
												taskId: item.id,
												status: "dropped",
											}),
										)
									}
								>
									Dismiss
								</Button>
							</div>
						) : null}
					</div>
				) : null}
			</li>
		);
	};

	return (
		<>
			{error ? <P className="text-destructive text-sm">{error}</P> : null}
			{items === null ? (
				<Small className="text-muted-foreground">Loading...</Small>
			) : (
				<div className="max-w-3xl">
					<ul
						aria-label="Your work items"
						className="divide-y divide-border rounded-lg border bg-background"
					>
						{mine.length ? (
							mine.map(renderItem)
						) : (
							<li className="px-4 py-3 text-muted-foreground text-sm">
								No work items yet. They appear as mail comes in,
								or ask in chat to add one.
							</li>
						)}
					</ul>
					{others.length ? (
						<>
							<button
								type="button"
								onClick={() => setShowOthers((v) => !v)}
								className="mt-4 text-muted-foreground text-sm hover:text-foreground"
							>
								{showOthers ? "Hide" : "Show"} {others.length}{" "}
								item
								{others.length === 1 ? "" : "s"} other people
								are driving
							</button>
							{showOthers ? (
								<ul
									aria-label="Work other people are driving"
									className="mt-2 divide-y divide-border rounded-lg border bg-background"
								>
									{others.map(renderItem)}
								</ul>
							) : null}
						</>
					) : null}
				</div>
			)}
			{limit && allMine.length > mine.length ? (
				<Link
					to="/work"
					className="mt-3 inline-block text-muted-foreground text-sm hover:text-foreground"
				>
					See all {allMine.length}
				</Link>
			) : null}
		</>
	);
}

export function WorkItemsList() {
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Work"
					description="What you are working toward. Mail, chats and meetings keep it up to date."
					actions={
						<Button asChild variant="outline" size="sm">
							<Link to="/work/topics">Topics</Link>
						</Button>
					}
				/>
			}
		>
			<WorkItems />
		</CollaborationSurface>
	);
}
