import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useChatConfig } from "../../chat/config/chat-config.context";
import { useChatSession } from "../../chat/provider/chat-session.context";
import { useChatSelector } from "../../chat/store/use-chat-selector";
import type { RoomStore } from "../../room/store/room.store";
import type { CompactionStrategy } from "../../room/store/room-compaction";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { CompactionStrategyPicker } from "./compaction-strategy-picker";

/** Props for {@link RoomContextUsageIndicator}. */
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
 * Format a token count for display, as 1.5k or 2.0M.
 *
 * @param tokens - The count; none reads as 0.
 * @returns The formatted count.
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
 * A small donut chart showing context window usage, with a
 * hover popover for usage stats and a compact-conversation action.
 *
 * Hovering (or the popover content itself) keeps the popover open via a short close
 * delay, so the mouse can travel from the donut into the popover.
 */
export const RoomContextUsageIndicator = ({
	className,
	room,
	onCompact,
	isLoading = false,
}: RoomContextUsageIndicatorProps) => {
	const { t } = useTranslation("room");
	const { chat } = useChatSession();
	const { options } = useChatConfig();
	const [isOpen, setIsOpen] = useState(false);
	const [compactionStrategy, setCompactionStrategy] =
		useState<CompactionStrategy>(options.compactionStrategy);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isHovering = useRef(false);
	// stop a pending close from setting state after unmount
	useEffect(
		() => () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		},
		[],
	);

	const { tokensUsed, totalTokens, latestResponseHasTools } = useRoomSelector(
		room,
		(current) => ({
			tokensUsed: current.tokensUsed,
			totalTokens: current.totalTokensConsumed,
			latestResponseHasTools:
				current.latestResponseMessage?.hasUnfinishedTools ?? false,
		}),
	);
	const tokensMax = useChatSelector(
		chat,
		(current) => current.models.contextWindow,
	);

	/** Open the popover, cancelling a pending close. */
	const handleOpen = () => {
		isHovering.current = true;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setIsOpen(true);
	};

	/** Close the popover after a short delay, so the pointer can move between the donut and the popover. */
	const scheduleClose = () => {
		isHovering.current = false;
		closeTimer.current = setTimeout(() => setIsOpen(false), 150);
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
			open={isOpen}
			onOpenChange={(open) => {
				// a pointer still over the donut or the popover keeps it open
				if (!open && isHovering.current) return;
				setIsOpen(open);
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
							className={cn("shrink-0 rounded-full", className)}
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
						<CompactionStrategyPicker
							disabled={isLoading || latestResponseHasTools}
							strategy={compactionStrategy}
							onStrategyChange={setCompactionStrategy}
							onCompact={() => onCompact(compactionStrategy)}
						/>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
};
