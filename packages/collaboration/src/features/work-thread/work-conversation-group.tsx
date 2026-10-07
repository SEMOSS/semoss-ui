import { ChevronDown, Mail, MessageSquare, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H2,
} from "@semoss/ui/next";
import type { Channel } from "@/features/collaboration/state/collaboration.types";
import type { WorkTimelineGroup } from "./work-timeline";

/** A chronological section retains its message state while independently collapsed. */
export function WorkConversationGroup({
	kind,
	channel,
	count,
	children,
	anchorId,
}: {
	kind: WorkTimelineGroup["kind"];
	channel: Channel;
	count: number;
	children: ReactNode;
	/** Retains a visible scroll anchor when the section's message rows are hidden. */
	anchorId?: string;
}) {
	const [isOpen, setIsOpen] = useState(true);
	const isSource = kind === "source";
	const label = isSource
		? channel === "teams"
			? "Teams conversation"
			: "Email conversation"
		: "Assistant conversation";
	const Icon = isSource
		? channel === "teams"
			? MessageSquare
			: Mail
		: Sparkles;
	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
			<section
				aria-label={label}
				data-scroll-anchor={anchorId ? `group:${anchorId}` : undefined}
				className={cn(
					"min-w-0 overflow-hidden rounded-xl border",
					isSource
						? "border-primary/15 bg-primary/5 dark:bg-primary/10"
						: "bg-card",
				)}
			>
				<H2 className="text-sm">
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							aria-label={`${isOpen ? "Collapse" : "Expand"} ${label.toLowerCase()}`}
							className="h-auto min-h-11 w-full justify-start gap-2 whitespace-normal rounded-none px-4 py-3 text-start"
						>
							<Icon
								className="size-4 text-primary"
								aria-hidden="true"
							/>
							<span className="min-w-0 flex-1">{label}</span>
							<Badge variant="outline" className="shrink-0">
								{count}
								<span className="sr-only">
									{count === 1 ? " message" : " messages"}
								</span>
							</Badge>
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-4 shrink-0 transition-transform motion-reduce:transition-none",
									!isOpen && "-rotate-90",
								)}
							/>
						</Button>
					</CollapsibleTrigger>
				</H2>
				<CollapsibleContent
					forceMount
					hidden={!isOpen}
					className={cn(
						"border-t",
						isSource
							? "divide-y divide-primary/10 border-primary/15"
							: "space-y-6 p-4",
						!isOpen && "hidden",
					)}
				>
					{children}
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}
