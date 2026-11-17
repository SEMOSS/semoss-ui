import { ChevronDownIcon, InfoIcon } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	RadioGroup,
	RadioGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** How a room's conversation is compacted. */
export type CompactionStrategy = "TOOL_PRUNE" | "SUMMARY" | "AUTO";

/** Props for {@link CompactStrategyPicker}. */
interface CompactStrategyPickerProps {
	/** Locks compacting, as while a response streams or has unfinished tools. */
	disabled: boolean;
	/** The strategy picked. */
	strategy: CompactionStrategy;
	/** Called with the strategy the user picks. */
	onStrategyChange: (strategy: CompactionStrategy) => void;
	/** Compacts with the picked strategy. */
	onCompact: () => void;
}

/**
 * A single "Compact" button with a collapsible "Advanced Options" section
 * for the strategy. Stays within the parent DOM (no portals) so it doesn't
 * close the usage popover.
 */
export const CompactStrategyPicker: React.FC<CompactStrategyPickerProps> = ({
	disabled,
	strategy,
	onStrategyChange,
	onCompact,
}) => {
	const { t } = useTranslation("room");
	const [isExpanded, setIsExpanded] = useState(false);
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
				onClick={() => setIsExpanded((v) => !v)}
			>
				<ChevronDownIcon
					className={cn(
						"size-3 transition-transform",
						isExpanded && "rotate-180",
					)}
				/>
				{isExpanded
					? t("settings.compactionOptions")
					: t("settings.advancedOptions")}
			</Button>
			{isExpanded && (
				<RadioGroup
					value={strategy}
					onValueChange={(v) => {
						if (
							v === "SUMMARY" ||
							v === "TOOL_PRUNE" ||
							v === "AUTO"
						)
							onStrategyChange(v);
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
