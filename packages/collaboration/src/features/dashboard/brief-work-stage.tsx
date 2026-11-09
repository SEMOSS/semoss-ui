import { ArrowRight, CornerDownRight, Hourglass } from "lucide-react";
import type { PointerEvent } from "react";
import { Link } from "react-router";
import { Button, cn, H3, P, Progress } from "@semoss/ui/next";
import { PersonAvatar } from "@/features/collaboration/components/person-avatar";
import {
	dueLabel,
	type Item,
	ItemTopicChip,
	itemPath,
	mineNext,
	type Step,
	waitingOn,
} from "@/features/collaboration/components/work-items-list";
import { givenFirst } from "@/lib/person-name";

/** How long an ask has waited, counted from when its step was made; "" under a day. */
function waited(createdAt?: string): string {
	const days = Math.floor(
		(Date.now() - Date.parse(createdAt ?? "")) / 86_400_000,
	);
	if (!(days >= 1)) return "";
	return days === 1 ? "1 day" : `${days} days`;
}

/** Points the stage light at the pointer; CSS variables, so moving it never re-renders. */
function aimLight(event: PointerEvent<HTMLElement>) {
	const box = event.currentTarget.getBoundingClientRect();
	event.currentTarget.style.setProperty(
		"--spot-x",
		`${event.clientX - box.left}px`,
	);
	event.currentTarget.style.setProperty(
		"--spot-y",
		`${event.clientY - box.top}px`,
	);
}

/** Lets the stage light drift back to where it rests. */
function restLight(event: PointerEvent<HTMLElement>) {
	event.currentTarget.style.removeProperty("--spot-x");
	event.currentTarget.style.removeProperty("--spot-y");
}

interface BriefWorkStageProps {
	/** The owner's top item. */
	item: Item;
	/** Whether a step is the owner's to do. */
	isMine: (step: Step) => boolean;
}

/** The owner's top item on a lit stage: their next step, who it waits on, and a lower edge that fills with its progress. */
export function BriefWorkStage({ item, isMine }: BriefWorkStageProps) {
	const next = mineNext(item, isMine);
	const wait = waitingOn(item, isMine);
	const due = dueLabel(item.due);
	const total = item.stepCount ?? 0;
	const done = Math.max(total - item.openSteps.length, 0);
	const who = wait?.assigneeName ? givenFirst(wait.assigneeName) : "";
	const since = waited(wait?.createdAt);
	return (
		<li
			className="work-stage relative px-4 pt-6 pb-7 sm:px-6"
			onPointerMove={aimLight}
			onPointerLeave={restLight}
		>
			<H3 className="text-balance font-display font-medium text-2xl leading-tight">
				<Link
					to={itemPath(item)}
					className="rounded-sm decoration-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					{item.title}
				</Link>
			</H3>
			<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm">
				<ItemTopicChip item={item} />
				{due ? (
					<span
						className={cn(
							"tabular-nums",
							due.soon && "text-destructive",
						)}
					>
						Due {due.text}
					</span>
				) : null}
				{total > 0 ? (
					<span className="tabular-nums">
						{done} of {total} steps done
					</span>
				) : null}
				<Button asChild size="sm" variant="outline" className="ml-auto">
					<Link to={itemPath(item)}>
						Open room
						<ArrowRight aria-hidden="true" />
					</Link>
				</Button>
			</div>
			<div className="mt-5 space-y-3">
				{next ? (
					<div className="flex items-start gap-3">
						<span
							aria-hidden="true"
							className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
						>
							<CornerDownRight className="size-3.5" />
						</span>
						<P className="line-clamp-2 min-w-0">
							<span className="text-muted-foreground">Next </span>
							{next.text}
						</P>
					</div>
				) : null}
				{wait ? (
					<div className="flex items-start gap-3">
						{who ? (
							<PersonAvatar name={who} className="size-6" />
						) : (
							<span
								aria-hidden="true"
								className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
							>
								<Hourglass className="size-3.5" />
							</span>
						)}
						<P className="line-clamp-2 min-w-0 text-muted-foreground">
							Waiting on{" "}
							<span className="text-foreground">
								{who || "someone"}
							</span>
							{since ? ` for ${since}` : ""}: {wait.text}
						</P>
					</div>
				) : null}
				{!next && !wait ? (
					<P className="text-muted-foreground">No open steps</P>
				) : null}
			</div>
			{/* the "steps done" text says the same for screen readers */}
			<Progress
				aria-hidden="true"
				value={done}
				max={total || 1}
				className="absolute inset-x-0 bottom-0 h-px rounded-none bg-border"
			/>
		</li>
	);
}
