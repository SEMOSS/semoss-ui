import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	H2,
	P,
} from "@semoss/ui/next";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { TopicTaskRow } from "./topic-task-row";

interface TopicTaskGroupProps {
	title: string;
	items: WorkItem[];
	emptyText?: string;
	isCollapsible?: boolean;
	isComplete: boolean;
}

/** Keep task rows in a semantic list and retain a focus target as rows move. */
export function TopicTaskGroup({
	title,
	items,
	emptyText,
	isCollapsible = false,
	isComplete,
}: TopicTaskGroupProps) {
	const headingRef = useRef<HTMLHeadingElement>(null);
	const focusHeading = (): void => {
		window.requestAnimationFrame(() => headingRef.current?.focus());
	};
	const heading = (
		<H2
			ref={headingRef}
			tabIndex={-1}
			className="flex flex-wrap items-center gap-3 rounded-sm font-medium text-xl focus-visible:outline-2 focus-visible:outline-ring"
		>
			{title}
			<span className="font-normal text-muted-foreground text-sm tabular-nums">
				{items.length}
				{!isComplete ? "+" : ""}
				{title === "Next up" ? " open" : ""}
			</span>
		</H2>
	);
	const content = items.length ? (
		<ul aria-label={title} className="mt-3 border-border border-t">
			{items.map((item) => (
				<TopicTaskRow
					key={item.id}
					item={item}
					onStatusChange={focusHeading}
				/>
			))}
		</ul>
	) : (
		<P className="py-6 text-base text-muted-foreground">
			{emptyText ?? `No ${title.toLowerCase()} tasks.`}
		</P>
	);
	return isCollapsible ? (
		<Collapsible className="border-border border-t pt-5">
			<div className="flex items-center justify-between gap-3">
				{heading}
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						aria-label={`Show ${title.toLowerCase()} tasks`}
						className="pointer-coarse:min-h-11"
					>
						<ChevronDown aria-hidden="true" />
					</Button>
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent>{content}</CollapsibleContent>
		</Collapsible>
	) : (
		<section aria-label={title}>
			{heading}
			{title === "Next up" && (
				<P className="mt-3 text-base text-muted-foreground">
					Ordered by priority, then importance and recency.
				</P>
			)}
			{content}
		</section>
	);
}
