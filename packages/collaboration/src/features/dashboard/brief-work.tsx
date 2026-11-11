import { ArrowRight, Inbox } from "lucide-react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { Link } from "react-router";
import { cn, P, Progress, Skeleton } from "@semoss/ui/next";
import {
	dueLabel,
	itemPath,
	mineNext,
	split,
	useWorkItems,
	waitingOn,
} from "@/features/collaboration/components/work-items-list";
import { givenFirst } from "@/lib/person-name";
import { BriefPanel } from "./brief-panel";
import { BriefWorkStage } from "./brief-work-stage";

/** How many of the owner's items Today shows; the rest wait behind Work. */
const SHOWN = 6;

/** Moves the row highlight onto this row: in place the first time, a glide after that. */
function glideTo(event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>) {
	const row = event.currentTarget;
	const track = row.closest<HTMLElement>("[data-glide-track]");
	if (!track) return;
	track.style.setProperty("--glide-y", `${row.offsetTop}px`);
	track.style.setProperty("--glide-h", `${row.offsetHeight}px`);
	if (track.hasAttribute("data-glide")) return;
	// a layout read commits the position before the glide transition switches on
	track.getBoundingClientRect();
	track.setAttribute("data-glide", "");
}

function hideGlide(event: { currentTarget: HTMLElement }) {
	event.currentTarget
		.closest("[data-glide-track]")
		?.removeAttribute("data-glide");
}

/** Today's view of Work (D25): the owner's top item on a lit stage, the next few below, and what waits for review. */
export function BriefWork() {
	const { items, error, isMine } = useWorkItems();
	const { review, mine } = split(items ?? []);
	const [top, ...rest] = mine.slice(0, SHOWN);

	let content: ReactNode;
	if (items === null) {
		content = error ? (
			<P
				role="alert"
				className="px-4 py-6 text-destructive text-sm sm:px-6"
			>
				{error}
			</P>
		) : (
			<output className="block space-y-3 px-4 py-6 sm:px-6">
				<span className="sr-only">Loading your work</span>
				<Skeleton className="h-7 w-3/4" />
				<Skeleton className="h-4 w-2/5" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
			</output>
		);
	} else if (!top) {
		content = (
			<P className="px-4 py-8 text-muted-foreground text-sm sm:px-6">
				{review.length
					? "Review the new items to start your list."
					: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
			</P>
		);
	} else {
		content = (
			<>
				{error ? (
					<P className="px-4 pt-4 text-destructive text-sm sm:px-6">
						{error}
					</P>
				) : null}
				<div data-glide-track className="relative">
					<span
						aria-hidden="true"
						className="work-glide rounded-lg bg-accent"
					/>
					<ol
						aria-label="Your work items"
						onPointerLeave={hideGlide}
						onBlur={(event) => {
							if (
								!event.currentTarget.contains(
									event.relatedTarget,
								)
							)
								hideGlide(event);
						}}
					>
						<BriefWorkStage item={top} isMine={isMine} />
						{rest.map((item, index) => {
							const next = mineNext(item, isMine);
							const wait = waitingOn(item, isMine);
							const due = dueLabel(item.due);
							const total = item.stepCount ?? 0;
							return (
								<li
									key={item.id}
									className="relative flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6"
									onPointerEnter={glideTo}
									onFocus={glideTo}
								>
									<span
										aria-hidden="true"
										className="w-6 shrink-0 self-start text-muted-foreground text-sm tabular-nums leading-6"
									>
										{String(index + 2).padStart(2, "0")}
									</span>
									<div className="min-w-0 flex-1">
										{/* stretched over the row, so the whole row opens it */}
										<Link
											to={itemPath(item)}
											title={item.title}
											className="line-clamp-2 font-medium after:absolute after:inset-x-2 after:inset-y-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring sm:line-clamp-1"
										>
											{item.title}
										</Link>
										<P className="truncate text-muted-foreground text-sm">
											{next
												? `Next: ${next.text}`
												: wait
													? `Waiting on ${wait.assigneeName ? givenFirst(wait.assigneeName) : "someone"}: ${wait.text}`
													: "No open steps"}
										</P>
									</div>
									{total > 0 ? (
										<Progress
											aria-label="Steps done"
											getValueLabel={(value, max) =>
												`${value} of ${max}`
											}
											value={Math.max(
												total - item.openSteps.length,
												0,
											)}
											max={total}
											className="hidden h-1 w-10 shrink-0 bg-border sm:block"
										/>
									) : null}
									{/* always there, so the progress bars line up */}
									<span
										className={cn(
											"w-14 shrink-0 text-right text-muted-foreground text-sm tabular-nums",
											due?.soon && "text-destructive",
										)}
									>
										{due?.text}
									</span>
								</li>
							);
						})}
					</ol>
				</div>
				{mine.length > SHOWN ? (
					<Link
						to="/work"
						className="group flex items-center gap-1 border-t px-4 py-3 text-muted-foreground text-sm hover:text-foreground sm:px-6"
					>
						See all {mine.length}
						<ArrowRight
							aria-hidden="true"
							className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
						/>
					</Link>
				) : null}
			</>
		);
	}

	return (
		<BriefPanel
			title="Your work"
			detail={
				<Link to="/work" className="text-foreground hover:underline">
					All work items
				</Link>
			}
			className="overflow-hidden p-0"
		>
			{review.length ? (
				// above the top item's stage light, which reaches up behind it
				<div className="relative z-10 p-3">
					{/* the light circling the pill marks items Brain found that nobody has looked at yet */}
					<Link
						to="/work/review"
						className="group relative block rounded-full bg-border p-px focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
					>
						<span aria-hidden="true" className="work-beam" />
						<span className="relative flex items-center gap-3 rounded-full bg-card py-2 pr-3 pl-4 text-sm transition-colors group-hover:bg-accent">
							<Inbox
								aria-hidden="true"
								className="size-4 shrink-0 text-primary"
							/>
							<span className="min-w-0 flex-1 text-muted-foreground">
								<span className="font-medium text-foreground">
									{review.length} new work item
									{review.length === 1 ? "" : "s"}
								</span>
								<span className="hidden sm:inline">
									{" "}
									from your mail and chats
								</span>
							</span>
							<span className="flex shrink-0 items-center gap-1 font-medium text-primary">
								Review
								<ArrowRight
									aria-hidden="true"
									className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
								/>
							</span>
						</span>
					</Link>
				</div>
			) : null}
			{content}
		</BriefPanel>
	);
}
