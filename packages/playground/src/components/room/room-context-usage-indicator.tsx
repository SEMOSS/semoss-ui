import { ChevronDownIcon, InfoIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	RadioGroup,
	RadioGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import type { RoomStore } from "@/stores/room/room.store";

type CompactionStrategy = "TOOL_PRUNE" | "SUMMARY" | "AUTO";

interface RoomContextUsageIndicatorProps {
	/** CSS classes for styling customization */
	className?: string;

	/** Room whose usage this indicator reflects */
	room: RoomStore;

	/** Callback to compact the conversation */
	onCompact?: (strategy?: CompactionStrategy) => void;

	/** Whether a response is currently streaming — compaction is disabled while thinking */
	isLoading?: boolean;
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
	const radioId = useId();

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
					onCompact();
				}}
			>
				{t("settings.compactButton")}
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
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
			</Button>
			{expanded && (
				<RadioGroup
					value={strategy}
					onValueChange={(v) => {
						if (
							v === "SUMMARY" ||
							v === "TOOL_PRUNE" ||
							v === "AUTO"
						)
							onPickStrategy(v);
					}}
					className="gap-1 pl-1"
				>
					{(
						[
							"SUMMARY",
							"TOOL_PRUNE",
							"AUTO",
						] as CompactionStrategy[]
					).map((s) => (
						<div
							key={s}
							className="flex items-center gap-2 rounded-sm px-1 py-0.5 text-sm hover:bg-accent"
						>
							<RadioGroupItem value={s} id={`${radioId}-${s}`} />
							<label
								htmlFor={`${radioId}-${s}`}
								className="flex-1 cursor-pointer"
							>
								{t(`settings.strategyLabel.${s}`)}
							</label>
							<Tooltip disableHoverableContent={false}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label={t(
											`settings.strategyLabel.${s}`,
										)}
									>
										<InfoIcon
											aria-hidden="true"
											className="size-4 text-muted-foreground"
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="left"
									className="max-w-52 text-wrap text-xs"
								>
									{t(`settings.strategyTooltip.${s}`)}
								</TooltipContent>
							</Tooltip>
						</div>
					))}
				</RadioGroup>
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
export const RoomContextUsageIndicator = observer(
	({
		className,
		room,
		onCompact,
		isLoading = false,
	}: RoomContextUsageIndicatorProps) => {
		const { t } = useTranslation("room");
		const { chat } = useChat();
		const { root } = useRoot();
		const [open, setOpen] = useState(false);
		const [compactionStrategy, setCompactionStrategy] =
			useState<CompactionStrategy>(
				root.theme.defaultCompactionStrategy ?? "AUTO",
			);
		const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
		const isHovering = useRef(false);
		useEffect(
			() => () => {
				if (closeTimer.current) clearTimeout(closeTimer.current);
			},
			[],
		);

		const tokensUsed = room.tokensUsed;
		const tokensMax = chat.models.contextWindow;
		const totalTokens = room.totalTokensConsumed;
		const latestResponseHasTools =
			room.latestResponseMessage?.hasUnfinishedTools ?? false;

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
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`${t("contextWindow.memoryUsedTitle")} ${usedPercent.toFixed(1)}%`}
								type="button"
								className={cn(
									"shrink-0 rounded-full",
									className,
								)}
								onClick={(e) => e.stopPropagation()}
								onMouseEnter={handleOpen}
								onMouseLeave={scheduleClose}
							>
								<svg
									aria-hidden="true"
									className="size-4"
									viewBox="0 0 18 18"
								>
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
										opacity={0.8}
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
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent>
						{t("contextWindow.memoryUsedTitle")}{" "}
						{usedPercent.toFixed(1)}%
					</TooltipContent>
				</Tooltip>
				<PopoverContent
					side="top"
					className="w-96 max-w-full text-wrap text-sm"
					onEscapeKeyDown={() => {
						isHovering.current = false;
					}}
					onMouseEnter={handleOpen}
					onMouseLeave={scheduleClose}
					onClick={(e) => e.stopPropagation()}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<div className="w-full space-y-1">
						<P className="w-full">{t(descriptionKey)}</P>
						<P className="flex w-full items-baseline justify-between gap-3">
							<span>{t("contextWindow.memoryUsedTitle")}</span>
							<span className="whitespace-nowrap text-end tabular-nums">
								{t("contextWindow.memoryUsedValue", {
									used: formatTokens(tokensUsed),
									total: formatTokens(tokensMax),
									percent: usedPercent.toFixed(1),
								})}
							</span>
						</P>
						{totalTokens !== undefined && (
							<P className="flex w-full items-baseline justify-between gap-3">
								<span>{t("contextWindow.totalUsedTitle")}</span>
								<span className="whitespace-nowrap text-end tabular-nums">
									{t("contextWindow.totalUsedValue", {
										total: formatTokens(totalTokens),
									})}
								</span>
							</P>
						)}
						{onCompact && (
							<CompactStrategyPicker
								disabled={isLoading || latestResponseHasTools}
								strategy={compactionStrategy}
								onPickStrategy={setCompactionStrategy}
								onCompact={() => onCompact(compactionStrategy)}
							/>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	},
);
