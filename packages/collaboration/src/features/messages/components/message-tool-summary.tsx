import { Check, ChevronDown, CircleX } from "lucide-react";
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
	const Icon = failureCount > 0 ? CircleX : Check;
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
				<Icon
					aria-hidden="true"
					className={cn(
						"size-4 shrink-0",
						failureCount > 0 && "text-destructive",
					)}
				/>
				<Muted className="wrap-anywhere min-w-0 text-sm">
					{failureCount > 0 ? (
						<>
							{tools.length} tools ·{" "}
							<span className="text-destructive">
								{failureCount} failed
							</span>
						</>
					) : (
						`${tools.length} tools completed`
					)}
				</Muted>
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
