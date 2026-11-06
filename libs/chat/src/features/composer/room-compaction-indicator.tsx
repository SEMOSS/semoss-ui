import { ArchiveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ResponseMessageStore } from "@semoss/sdk";
import { useMessageSelector } from "@semoss/sdk/react";
import { useLoadingMessage } from "@semoss/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";

const APPEAR_DELAY_MS = 150;

interface RoomCompactionIndicatorProps {
	message: ResponseMessageStore;
}

const STRIPE_STYLE = {
	backgroundImage:
		"repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
};

export const RoomCompactionIndicator: React.FC<
	RoomCompactionIndicatorProps
> = ({ message }) => {
	const { t } = useTranslation("room");
	const { isCompacting, conversationCompactedAbove } = useMessageSelector(
		message,
		(m) => ({
			isCompacting: m.isCompacting,
			conversationCompactedAbove: m.conversationCompactedAbove,
		}),
	);
	const { loadingMessage } = useLoadingMessage(isCompacting, [
		t("settings.compacting"),
	]);

	const isActive = isCompacting || conversationCompactedAbove;
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
				{conversationCompactedAbove ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="relative flex h-6 w-full cursor-default items-center justify-center overflow-hidden rounded-sm">
								<div
									className="absolute inset-0 opacity-[0.18]"
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
							className="absolute inset-0 opacity-[0.18]"
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
