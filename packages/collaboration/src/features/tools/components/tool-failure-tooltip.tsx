import type { ReactElement } from "react";
import {
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";

/** A bounded error preview; the inspector retains the complete error/output. */
function failurePreview(tool: ConversationTool): string {
	const text = (
		tool.error?.trim() ||
		tool.output?.trim() ||
		"No error details were provided."
	).replace(/\s+/g, " ");
	const characters = Array.from(text);
	return characters.length > 240
		? `${characters.slice(0, 240).join("")}…`
		: text;
}

/** Failure details on hover or focus, with complete errors in the inspector. */
export function ToolFailureTooltip({
	tools,
	children,
}: {
	tools: ConversationTool[];
	children: ReactElement;
}) {
	const failures = tools.filter((tool) => tool.status === "FAILED");
	const hasFailures = failures.length > 0;
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			{hasFailures && (
				<TooltipContent
					side="bottom"
					align="start"
					sideOffset={8}
					collisionPadding={16}
					className="w-80 max-w-(--radix-tooltip-content-available-width) space-y-2 text-start motion-reduce:animate-none"
				>
					{failures.slice(0, 3).map((tool) => (
						<div key={tool.id} className="space-y-1">
							<Small className="wrap-anywhere block font-medium text-xs leading-5">
								{tool.title || tool.name} failed
							</Small>
							<Small className="wrap-anywhere block font-normal text-xs leading-5">
								{failurePreview(tool)}
							</Small>
						</div>
					))}
					{failures.length > 3 && (
						<Small className="block font-normal text-xs">
							And {failures.length - 3} more failed{" "}
							{failures.length === 4 ? "tool" : "tools"}.
						</Small>
					)}
					<Small className="block font-normal text-xs">
						Open tool details for the full error.
					</Small>
				</TooltipContent>
			)}
		</Tooltip>
	);
}
