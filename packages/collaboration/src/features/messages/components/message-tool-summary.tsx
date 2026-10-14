import { ChevronDown, ListChecks } from "lucide-react";
import { Button, cn, Muted } from "@semoss/ui/next";
import { ToolFailureTooltip } from "@/features/tools/components/tool-failure-tooltip";
import type { OwnedMessagePart } from "../utils/message-presentation";

/** One compact summary keeps failures visible without breaking up the group. */
export function MessageToolSummary({
	items,
	isExpanded,
	controls,
	onToggle,
}: {
	items: OwnedMessagePart[];
	isExpanded: boolean;
	controls: string;
	onToggle: () => void;
}) {
	const tools = items.flatMap(({ part }) =>
		part.type === "tool" ? [part.tool] : [],
	);
	const failureCount = tools.filter(
		(tool) => tool.status === "FAILED",
	).length;
	const completedCount = tools.filter(
		(tool) => tool.status === "COMPLETED",
	).length;
	return (
		<ToolFailureTooltip tools={tools}>
			<Button
				type="button"
				variant="ghost"
				className="my-1 h-auto min-h-10 w-full justify-start gap-2 whitespace-normal rounded-xl px-3 py-2 text-start text-muted-foreground hover:text-foreground"
				aria-expanded={isExpanded}
				aria-controls={controls}
				onClick={onToggle}
			>
				<ListChecks aria-hidden="true" className="size-4 shrink-0" />
				<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
					<Muted className="wrap-anywhere text-sm">
						{tools.length} tool{" "}
						{tools.length === 1 ? "call" : "calls"}
					</Muted>
					<Muted className="wrap-anywhere text-xs">
						{completedCount} completed
						{failureCount > 0 && ` · ${failureCount} unsuccessful`}
					</Muted>
				</span>
				<Muted className="ms-auto shrink-0 text-xs">
					{isExpanded ? "Hide steps" : "View steps"}
				</Muted>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
						isExpanded && "rotate-180",
					)}
				/>
			</Button>
		</ToolFailureTooltip>
	);
}
