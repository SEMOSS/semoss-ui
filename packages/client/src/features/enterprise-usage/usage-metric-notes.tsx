import { ChevronDown, Info } from "lucide-react";
import { type ReactElement, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
} from "@semoss/ui/next";

/** How the dashboard's numbers are gathered and counted, in short groups. */
const NOTES: { title: string; items: string[] }[] = [
	{
		title: "Where The Data Comes From",
		items: [
			"Usage Reflects Retained Logs And Enabled Logging.",
			"Model Usage Comes From The Inference Logs; Platform Activity Comes From The Separate Activity Database.",
			"Access And Usage Limit Changes Come From The Audit Trail, Which Records Times In UTC.",
			"App Attribution Comes From The Room's Recorded App.",
		],
	},
	{
		title: "How It Is Counted",
		items: [
			"Model Requests Count INPUT Rows; Tokens Count INPUT And RESPONSE Rows At Their Logged Times.",
			"Inference Records Include Chat, Embeddings, And Other Model Methods; Vector Nearest-Neighbor Logs Are Excluded.",
			"Cache And Thinking Token Detail Depends On The Provider.",
			"Latency Measures The Whole Model Response, Not Time To First Token.",
			"Feedback Describes Rated Responses Only.",
		],
	},
	{
		title: "What It Does Not Cover",
		items: [
			"Billed Spend, Reliable Per-Request Pricing, Or A Complete LLM Failure Rate.",
			"Engine Filters Apply To All Engine Types In Activity Logs And To The Matching Model In Inference Logs.",
			"A Dash Means Unavailable.",
		],
	},
];

/** How the dashboard's numbers are counted, folded away until asked for. */
export function UsageMetricNotes(): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="border-t pt-2"
		>
			<CollapsibleTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="-ml-2 text-muted-foreground"
				>
					<Info aria-hidden="true" />
					About These Metrics
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"transition-transform",
							isOpen && "rotate-180",
						)}
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="grid gap-4 pt-2 md:grid-cols-3">
					{NOTES.map((group) => (
						<section
							key={group.title}
							className="min-w-0 space-y-1"
						>
							<h4 className="font-medium text-xs">
								{group.title}
							</h4>
							<ul className="list-disc space-y-1 pl-4 text-muted-foreground text-xs">
								{group.items.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</section>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
