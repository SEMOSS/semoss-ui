import { ChevronRight } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	H3,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { TopicWorkItem } from "./topic-work-item";
import { TopicWorkSingleSteps } from "./topic-work-single-steps";
import { useTopicWork } from "./use-topic-work";

const headingClassName =
	"text-muted-foreground text-xs uppercase tracking-wider";
const countClassName =
	"rounded-full bg-muted px-1.5 font-medium text-muted-foreground text-xs tabular-nums";

/** A group's title as a heading, and how many it holds. */
const groupHeading = (title: string, count: string) => (
	<div className="flex items-center gap-2">
		<H3 className={headingClassName}>{title}</H3>
		<span className={countClassName}>{count}</span>
	</div>
);

/** A topic's work in four groups: yours to do, single steps, waiting on others, and recently done. Read-only; completing a step is done on the work item. */
export function TopicWorkList({ topicId }: { topicId: string }) {
	const { work, error } = useTopicWork(topicId);
	if (error)
		return (
			<P role="alert" className="text-destructive text-sm">
				{error}
			</P>
		);
	if (!work)
		return (
			<output className="block">
				<span className="sr-only">Loading topic work</span>
				<Skeleton className="h-40 w-full rounded-xl" />
			</output>
		);
	const groups = [
		{
			title: "Yours to Do",
			view: "yours" as const,
			items: work.yours,
			total: work.yours.length,
		},
		{
			title: "Waiting on Others",
			view: "waiting" as const,
			items: work.waiting,
			total: work.waiting.length,
		},
		// the group is cut to the latest few, so its count says how many there are in all
		{
			title: "Recently Done",
			view: "done" as const,
			items: work.done,
			total: work.doneTotal,
		},
	].filter((group) => group.items.length > 0);
	if (!groups.length && !work.single.length)
		return (
			<P className="text-muted-foreground text-sm">
				No work on this topic yet.
			</P>
		);
	// folded away until opened: the assistant's own steps can be many, and some are noise
	const singleSteps = work.single.length ? (
		<Collapsible asChild>
			<section aria-label="Single Steps" className="space-y-2">
				<H3 className={headingClassName}>
					<CollapsibleTrigger className="group flex items-center gap-2 rounded-sm text-left uppercase focus-visible:outline-2 focus-visible:outline-ring">
						<ChevronRight
							aria-hidden="true"
							className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none"
						/>
						Single Steps
						<span className={countClassName}>
							{work.single.length}
						</span>
					</CollapsibleTrigger>
				</H3>
				<CollapsibleContent>
					<TopicWorkSingleSteps steps={work.single} />
				</CollapsibleContent>
			</section>
		</Collapsible>
	) : null;
	const renderGroup = (group: (typeof groups)[number]) => (
		<section
			key={group.title}
			aria-label={group.title}
			className="space-y-2"
		>
			{groupHeading(
				group.title,
				group.total > group.items.length
					? `${group.items.length} of ${group.total}`
					: String(group.items.length),
			)}
			<ul className="space-y-2">
				{group.items.map((item) => (
					<TopicWorkItem
						key={item.id}
						item={item}
						isMine={work.isMine}
						view={group.view}
					/>
				))}
			</ul>
		</section>
	);
	return (
		<div className="space-y-5">
			{groups.filter((group) => group.view === "yours").map(renderGroup)}
			{singleSteps}
			{groups.filter((group) => group.view !== "yours").map(renderGroup)}
		</div>
	);
}
