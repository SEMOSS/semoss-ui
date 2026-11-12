import {
	ArrowRight,
	CircleDashed,
	CornerDownRight,
	Hourglass,
	Inbox,
} from "lucide-react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { Link } from "react-router";
import { cn, P, Skeleton } from "@semoss/ui/next";
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

/** Today's view of Work (D25): what waits for review, then the owner's top items with whose move each one is. */
export function BriefWork() {
	const { items, error, isMine } = useWorkItems();
	const { review, mine } = split(items ?? []);
	const shown = mine.slice(0, SHOWN);

	let content: ReactNode;
	if (items === null) {
		content = error ? (
			<P role="alert" className="text-destructive text-sm">
				{error}
			</P>
		) : (
			<output className="block space-y-3">
				<span className="sr-only">Loading your work</span>
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-4 w-2/5" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-4 w-5/6" />
			</output>
		);
	} else if (!shown.length) {
		content = (
			<P className="text-muted-foreground text-sm">
				{review.length
					? "Review the new items to start your list."
					: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
			</P>
		);
	} else {
		content = (
			<>
				{error ? (
					<P className="text-destructive text-sm">{error}</P>
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
						{shown.map((item) => {
							const next = mineNext(item, isMine);
							const wait = waitingOn(item, isMine);
							const due = dueLabel(item.due);
							// whose move it is; the line under the title says the same in words
							const MoveIcon = next
								? CornerDownRight
								: wait
									? Hourglass
									: CircleDashed;
							return (
								<li
									key={item.id}
									className="group relative flex gap-3"
									onPointerEnter={glideTo}
									onFocus={glideTo}
								>
									<MoveIcon
										aria-hidden="true"
										className="mt-4 size-4 shrink-0 text-muted-foreground"
									/>
									{/* the rule starts at the text, not under the icon */}
									<div className="flex min-w-0 flex-1 items-baseline gap-3 border-b py-3 group-last:border-b-0">
										<div className="min-w-0 flex-1">
											{/* stretched over the row, so the whole row opens it */}
											<Link
												to={itemPath(item)}
												title={item.title}
												className="after:-inset-x-2 line-clamp-2 font-medium after:absolute after:inset-y-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
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
										{due ? (
											<span
												className={cn(
													"shrink-0 text-muted-foreground text-sm tabular-nums",
													due.soon &&
														"text-destructive",
												)}
											>
												{due.text}
											</span>
										) : null}
									</div>
								</li>
							);
						})}
					</ol>
				</div>
				{mine.length > SHOWN ? (
					<Link
						to="/work"
						className="group flex items-center gap-1 self-start rounded-sm text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
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
				<Link
					to="/work"
					className="flex items-center gap-1 rounded-sm font-medium text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					All work items
					<ArrowRight aria-hidden="true" className="size-4" />
				</Link>
			}
		>
			{review.length ? (
				// items Brain found that nobody has looked at yet
				<Link
					to="/work/review"
					className="group flex items-center gap-3 rounded-lg bg-primary/10 py-2 pr-2 pl-4 text-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					<Inbox aria-hidden="true" className="size-4 shrink-0" />
					<span className="min-w-0 flex-1">
						<span className="font-bold">
							{review.length} new work item
							{review.length === 1 ? "" : "s"}
						</span>{" "}
						from your mail and chats
					</span>
					{/* the blue is too dim to read on the dark card */}
					<span className="flex shrink-0 items-center gap-1 rounded-md bg-card px-3 py-1.5 font-medium text-primary dark:text-foreground">
						Review
						<ArrowRight
							aria-hidden="true"
							className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
						/>
					</span>
				</Link>
			) : null}
			{content}
		</BriefPanel>
	);
}
