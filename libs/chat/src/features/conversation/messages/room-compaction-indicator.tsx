import { ArchiveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useLoadingMessage } from "@semoss/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type { ResponseMessageStore } from "../store/response-message.store";
import { useMessage } from "../store/use-message";

/** How long compaction must last before the bar shows, so a quick one does not flash. */
const APPEAR_DELAY_MS = 150;

/** Props for {@link RoomCompactionIndicator}. */
interface RoomCompactionIndicatorProps {
	/** The response that is compacting the conversation, or that history above it was compacted into. */
	message: ResponseMessageStore;
}

/** Diagonal hatching behind the bar's label; a gradient has no utility class. */
const STRIPE_STYLE = {
	backgroundImage:
		"repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
};

/**
 * A hatched bar in the transcript while the conversation is being compacted,
 * and above a response once the history before it was compacted, with a
 * tooltip that explains it. Renders nothing otherwise.
 */
export const RoomCompactionIndicator = ({
	message,
}: RoomCompactionIndicatorProps) => {
	const { t } = useTranslation("room");
	const { isCompacting, isCompactedAbove } = useMessage(
		message,
		(current) => ({
			isCompacting: current.isCompacting,
			isCompactedAbove: current.conversationCompactedAbove,
		}),
	);
	const { loadingMessage } = useLoadingMessage(isCompacting, [
		t("settings.compacting"),
	]);

	const isActive = isCompacting || isCompactedAbove;
	const [isOpen, setIsOpen] = useState(isActive);

	useEffect(() => {
		if (!isActive) {
			setIsOpen(false);
			return;
		}
		const timer = setTimeout(() => setIsOpen(true), APPEAR_DELAY_MS);
		return () => clearTimeout(timer);
	}, [isActive]);

	if (!isOpen) {
		return null;
	}

	return (
		<div className="max-h-10 overflow-hidden transition-all duration-300 ease-in-out">
			<div className="pb-4">
				{isCompactedAbove ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="relative flex h-6 w-full cursor-default items-center justify-center overflow-hidden rounded-sm">
								<div
									className="absolute inset-0 opacity-18"
									style={STRIPE_STYLE}
								/>
								<div className="relative z-10 flex items-center gap-1.5 rounded bg-background px-2 text-muted-foreground text-xs leading-normal">
									<ArchiveIcon className="h-3 w-3" />
									<span>{t("settings.compactedAbove")}</span>
								</div>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							{t("settings.compactedAboveTooltip")}
						</TooltipContent>
					</Tooltip>
				) : (
					<div className="relative flex h-6 w-full items-center justify-center overflow-hidden rounded-sm">
						<div
							className="absolute inset-0 opacity-18"
							style={STRIPE_STYLE}
						/>
						<div className="relative z-10 flex items-center gap-1.5 rounded bg-background px-2 text-muted-foreground text-xs leading-normal">
							<ArchiveIcon className="h-3 w-3 animate-pulse" />
							<span>{loadingMessage}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
