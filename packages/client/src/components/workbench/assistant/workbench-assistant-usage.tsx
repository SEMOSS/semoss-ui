import {
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";

/**
 * Format a token count in compact notation ("12.4K").
 *
 * @name formatTokenCount
 * @param tokens - The raw token count.
 * @return The compact, locale-formatted token count.
 */
const formatTokenCount = (tokens: number): string =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(tokens);

/**
 * The room's token/context display: a compact context-token chip with a
 * breakdown tooltip (current context, total processed, messages, cache
 * reads/writes, thinking), reading usage state from the assistant slice. Renders
 * nothing until usage data exists or is being loaded.
 *
 * @name WorkbenchAssistantUsage
 * @return The usage chip with its breakdown tooltip, or null.
 */
export const WorkbenchAssistantUsage = () => {
	const usage = useWorkbench((state) => state.assistant.usage);
	const isLoadingUsage = useWorkbench(
		(state) => state.assistant.isLoadingUsage,
	);

	if (!usage && !isLoadingUsage) {
		return null;
	}

	const rows: Array<[string, string]> = usage
		? [
				["Current context", formatTokenCount(usage.contextTokens)],
				["Total processed", formatTokenCount(usage.totalTokens)],
				["Messages", String(usage.messageCount)],
				["Cache reads", formatTokenCount(usage.cacheReadTokens)],
				["Cache writes", formatTokenCount(usage.cacheCreationTokens)],
				["Thinking", formatTokenCount(usage.thinkingTokens)],
			]
		: [];

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="flex items-center gap-1 text-muted-foreground text-xs tabular-nums">
					{isLoadingUsage ? <Spinner className="size-3" /> : null}
					{usage
						? `${formatTokenCount(usage.contextTokens)} context`
						: "Updating context…"}
				</span>
			</TooltipTrigger>
			{usage ? (
				<TooltipContent side="top" align="end" className="w-60">
					<div className="flex flex-col gap-2">
						<p className="font-medium">Room usage</p>
						<div className="flex flex-col gap-1">
							{rows.map(([label, value]) => (
								<div
									key={label}
									className="flex justify-between gap-4"
								>
									<span className="text-muted-foreground">
										{label}
									</span>
									<span className="tabular-nums">
										{value}
									</span>
								</div>
							))}
						</div>
					</div>
				</TooltipContent>
			) : null}
		</Tooltip>
	);
};
