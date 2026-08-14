import { ChevronDownIcon, InfoIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

type CompactionStrategy = "TOOL_PRUNE" | "SUMMARY" | "AUTO";

interface RoomContextUsageIndicatorProps {
	/** CSS classes for styling customization */
	className?: string;

	/** Current token usage for context window indicator */
	tokensUsed?: number;

	/** Maximum token capacity for context window */
	tokensMax?: number;

	/** Total tokens consumed across the entire chat */
	totalTokens?: number;

	/** Callback to compact the conversation */
	onCompact?: () => void;

	/** Whether a response is currently streaming — compaction is disabled while thinking */
	isLoading?: boolean;

	/** Whether the latest response still has outstanding tool calls — compaction can't touch it yet */
	latestResponseHasTools?: boolean;

	/** Currently selected compaction strategy */
	compactionStrategy?: CompactionStrategy;

	/** Called when the user changes the compaction strategy in the picker */
	onStrategyChange?: (strategy: CompactionStrategy) => void;
}

/**
 * Format token counts for display
 * Converts large numbers to readable format (e.g., 1500 -> 1.5k, 2000000 -> 2.0M)
 */
const formatTokens = (tokens: number | undefined) => {
	if (tokens === undefined) return "0";
	if (tokens >= 1000000) {
		return `${(tokens / 1000000).toFixed(1)}M`;
	}
	if (tokens >= 1000) {
		return `${(tokens / 1000).toFixed(1)}k`;
	}
	return tokens.toString();
};

/**
 * CompactStrategyPicker
 * Single "Compact" button with a collapsible "Advanced Options" section.
 * Stays within the parent DOM (no portals) so it doesn't close the usage popover.
 */
const CompactStrategyPicker: React.FC<{
	disabled: boolean;
	strategy: CompactionStrategy;
	onPickStrategy: (s: CompactionStrategy) => void;
	onCompact: () => void;
}> = ({ disabled, strategy, onPickStrategy, onCompact }) => {
	const { t } = useTranslation("room");
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="mt-2 space-y-2 border-t pt-2">
			<Button
				type="button"
				size="sm"
				variant="default"
				className="w-full"
				disabled={disabled}
				onClick={(e) => {
					e.stopPropagation();
					onPickStrategy(strategy);
					onCompact();
				}}
			>
				{t("settings.compactButton")}
			</Button>
			<button
				type="button"
				className="flex w-full items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
				onClick={() => setExpanded((v) => !v)}
			>
				<ChevronDownIcon
					className={cn(
						"size-3 transition-transform",
						expanded && "rotate-180",
					)}
				/>
				{expanded
					? t("settings.compactionOptions")
					: t("settings.advancedOptions")}
			</button>
			{expanded && (
				<div className="space-y-1 pl-1">
					{(
						[
							"SUMMARY",
							"TOOL_PRUNE",
							"AUTO",
						] as CompactionStrategy[]
					).map((s) => (
						<label
							key={s}
							className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 text-sm hover:bg-accent"
						>
							<input
								type="radio"
								name="compaction-strategy"
								value={s}
								checked={strategy === s}
								onChange={() => onPickStrategy(s)}
								className="accent-primary"
							/>
							<span className="flex-1">
								{t(`settings.strategyLabel.${s}`)}
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<InfoIcon className="size-3.5 shrink-0 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent
									side="left"
									className="max-w-52 text-wrap text-xs"
								>
									{t(`settings.strategyTooltip.${s}`)}
								</TooltipContent>
							</Tooltip>
						</label>
					))}
				</div>
			)}
		</div>
	);
};

/**
 * RoomContextUsageIndicator - A small donut chart showing context window usage, with a
 * hover popover for usage stats and a compact-conversation action.
 *
 * Hovering (or the popover content itself) keeps the popover open via a short close
 * delay, so the mouse can travel from the donut into the popover.
 */
export const RoomContextUsageIndicator = ({
	className,
	tokensUsed,
	tokensMax,
	totalTokens,
	onCompact,
	isLoading = false,
	latestResponseHasTools = false,
	compactionStrategy = "AUTO",
	onStrategyChange,
}: RoomContextUsageIndicatorProps) => {
	const { t } = useTranslation("room");
	const [open, setOpen] = useState(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isHovering = useRef(false);

	const handleOpen = () => {
		isHovering.current = true;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setOpen(true);
	};

	const scheduleClose = () => {
		isHovering.current = false;
		closeTimer.current = setTimeout(() => setOpen(false), 150);
	};

	const usedPercent =
		tokensMax && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	if (usedPercent === undefined || usedPercent <= 0) {
		return null;
	}

	// Calculate donut chart geometry, rounded to the nearest 12.5% increment
	const roundedPercent = Math.max(
		12.5,
		Math.round(usedPercent / 12.5) * 12.5,
	);
	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (roundedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	const largeArc = angle > 180 ? 1 : 0;

	const descriptionKey =
		usedPercent >= 100
			? "contextWindow.descriptionExceeded"
			: usedPercent < 50
				? "contextWindow.descriptionLow"
				: usedPercent < 75
					? "contextWindow.descriptionMedium"
					: "contextWindow.descriptionHigh";

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				if (!o && isHovering.current) return;
				setOpen(o);
			}}
		>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex shrink-0 cursor-pointer items-center",
						className,
					)}
					onClick={(e) => e.stopPropagation()}
					onMouseEnter={handleOpen}
					onMouseLeave={scheduleClose}
				>
					{/** biome-ignore lint/a11y/noSvgWithoutTitle: click interaction is provided by the parent button */}
					<svg width={18} height={18} viewBox="0 0 18 18">
						{/* Outer ring - always visible */}
						<circle
							cx={cx}
							cy={cy}
							r={radius}
							fill="none"
							className={
								roundedPercent >= 75
									? "stroke-destructive"
									: "stroke-muted-foreground"
							}
							strokeWidth={1.5}
							opacity={0.3}
						/>
						{/* Inner fill showing percentage */}
						{roundedPercent >= 100 ? (
							<circle
								cx={cx}
								cy={cy}
								r={radius - 1}
								className={
									roundedPercent >= 75
										? "fill-destructive"
										: "fill-muted-foreground"
								}
								opacity={0.6}
							/>
						) : (
							<path
								d={`M ${cx} ${cy} L ${cx} ${cy - (radius - 1)} A ${radius - 1} ${radius - 1} 0 ${largeArc} 1 ${x * 0.875 + cx * 0.125} ${y * 0.875 + cy * 0.125} Z`}
								className={
									roundedPercent >= 75
										? "fill-destructive"
										: "fill-muted-foreground"
								}
								opacity={0.6}
							/>
						)}
					</svg>
				</button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				className="w-[24rem] text-wrap text-sm"
				onMouseEnter={handleOpen}
				onMouseLeave={scheduleClose}
				onClick={(e) => e.stopPropagation()}
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="w-full space-y-1">
					<p className="w-full">{t(descriptionKey)}</p>
					<p className="flex w-full items-baseline justify-between gap-3">
						<span>{t("contextWindow.memoryUsedTitle")}</span>
						<span className="whitespace-nowrap text-end tabular-nums">
							{t("contextWindow.memoryUsedValue", {
								used: formatTokens(tokensUsed),
								total: formatTokens(tokensMax),
								percent: usedPercent.toFixed(1),
							})}
						</span>
					</p>
					{totalTokens !== undefined && (
						<p className="flex w-full items-baseline justify-between gap-3">
							<span>{t("contextWindow.totalUsedTitle")}</span>
							<span className="whitespace-nowrap text-end tabular-nums">
								{t("contextWindow.totalUsedValue", {
									total: formatTokens(totalTokens),
								})}
							</span>
						</p>
					)}
					{onCompact && (
						<CompactStrategyPicker
							disabled={isLoading || latestResponseHasTools}
							strategy={compactionStrategy}
							onPickStrategy={(s) => onStrategyChange?.(s)}
							onCompact={onCompact}
						/>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};
