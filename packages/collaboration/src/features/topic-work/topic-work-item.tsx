import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Link } from "react-router";
import { cn, P, Small } from "@semoss/ui/next";
import {
	dueLabel,
	type Item,
	itemPath,
	mineNext,
	type Step,
	waitingOn,
} from "@/features/collaboration/components/work-items-list";
import { givenFirst } from "@/lib/person-name";
import { threadPath } from "@/lib/workspace-paths";
import { shortDate } from "./short-date";

export const linkClassName =
	"rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

/** The group a card sits in, which decides what it says about the item. */
export type TopicWorkView = "yours" | "waiting" | "done";

/** What the list of steps under a card is called in each group. */
const STEPS_LABEL: Record<TopicWorkView, string> = {
	yours: "Your Steps",
	waiting: "Owed by Others",
	done: "Open Steps",
};

/**
 * One work item as a card: its title, a summary line, and its steps below a rule, each opening the thread it came from.
 * An item with steps of the owner's and steps owed by others is in two groups, so each card says only what belongs to
 * its group; a finished item keeps everything.
 */
export function TopicWorkItem({
	item,
	isMine,
	view,
}: {
	item: Item;
	isMine: (step: Step) => boolean;
	/** The group the card is shown in. */
	view: TopicWorkView;
}) {
	const next = view === "waiting" ? undefined : mineNext(item, isMine);
	const waiting = view === "yours" ? undefined : waitingOn(item, isMine);
	const since = shortDate(waiting?.createdAt);
	const closed = shortDate(item.closedAt);
	const due = view === "done" ? null : dueLabel(item.due);
	const steps =
		view === "yours"
			? item.openSteps.filter(isMine)
			: view === "waiting"
				? item.openSteps.filter((step) => !isMine(step))
				: item.openSteps;
	const stepsLabel = STEPS_LABEL[view];
	return (
		<li className="min-w-0 overflow-hidden rounded-lg border bg-background">
			<div className="space-y-1.5 px-3 py-2.5">
				<Link
					to={itemPath(item)}
					className={cn(
						linkClassName,
						"wrap-anywhere block font-medium text-sm leading-snug",
					)}
				>
					{item.title}
				</Link>
				{next ? (
					<P className="text-muted-foreground text-sm">
						<span className="font-medium text-foreground">
							Next:
						</span>{" "}
						{next.text}
					</P>
				) : null}
				{waiting ? (
					<P className="text-muted-foreground text-sm">
						<span className="font-medium text-foreground">
							Waiting on{" "}
							{waiting.assigneeName
								? givenFirst(waiting.assigneeName)
								: "someone"}
						</span>
						{since ? ` since ${since}` : null}
					</P>
				) : null}
				{due ? (
					<P
						className={cn(
							"text-sm",
							due.soon
								? "text-destructive"
								: "text-muted-foreground",
						)}
					>
						Due {due.text}
					</P>
				) : null}
				{closed ? (
					<P className="flex items-center gap-1.5 text-muted-foreground text-sm">
						<CheckCircle2
							aria-hidden="true"
							className="size-4 shrink-0 text-success"
						/>
						Done {closed}
					</P>
				) : null}
			</div>
			{steps.length ? (
				<div className="border-t">
					<Small className="block px-3 pt-2 text-muted-foreground text-xs">
						{stepsLabel}
					</Small>
					<ul
						aria-label={`${stepsLabel} for ${item.title}`}
						className="divide-y divide-border"
					>
						{steps.map((step) => {
							const mine = isMine(step);
							const Icon = mine ? Circle : Clock;
							return (
								<li
									key={step.id}
									className="flex items-start gap-2.5 px-3 py-2 text-sm"
								>
									<Icon
										aria-hidden="true"
										className={cn(
											"mt-0.5 size-4 shrink-0",
											mine
												? "text-primary"
												: "text-muted-foreground",
										)}
									/>
									<span className="wrap-anywhere min-w-0">
										{step.threadId ? (
											<Link
												to={threadPath(step.threadId)}
												className={linkClassName}
											>
												{step.text}
											</Link>
										) : (
											step.text
										)}
										{!mine && step.assigneeName ? (
											<span className="block text-muted-foreground text-xs">
												Waiting on{" "}
												{givenFirst(step.assigneeName)}
											</span>
										) : null}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}
		</li>
	);
}
