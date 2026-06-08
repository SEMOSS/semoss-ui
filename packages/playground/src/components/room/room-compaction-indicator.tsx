import { ArchiveIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore } from "@/stores";
import { formatTokens } from "@/utility";

const APPEAR_DELAY_MS = 150;

interface RoomCompactionIndicatorProps {
	message: ResponseMessageStore;
}

const STRIPE_STYLE = {
	backgroundImage:
		"repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
};

export const RoomCompactionIndicator: React.FC<RoomCompactionIndicatorProps> =
	observer(({ message }) => {
		const { t } = useTranslation("room");
		const { loadingMessage } = useLoadingMessage(message.isCompacting, [
			t("settings.compacting"),
		]);

		const isActive =
			message.isCompacting || message.conversationCompactedAbove;
		const [isOpen, setIsOpen] = useState(isActive);

		useEffect(() => {
			if (!isActive) {
				setIsOpen(false);
				return;
			}
			const timer = setTimeout(() => setIsOpen(true), APPEAR_DELAY_MS);
			return () => clearTimeout(timer);
		}, [isActive]);

		return (
			<div
				className="overflow-hidden transition-all duration-300 ease-in-out"
				style={{ maxHeight: isOpen ? "2.5rem" : "0" }}
			>
				<div className="pb-4">
					{message.conversationCompactedAbove ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="relative flex h-6 w-full cursor-default items-center justify-center overflow-hidden rounded-sm">
									<div
										className="absolute inset-0 opacity-[0.18]"
										style={STRIPE_STYLE}
									/>
									<div className="relative z-10 flex items-center gap-1.5 rounded bg-background px-2 text-muted-foreground text-xs leading-normal">
										<ArchiveIcon className="h-3 w-3" />
										<span>
											{t("settings.compactedAbove")}
										</span>
										{message.compactionTokensBefore > 0 && (
											<span className="opacity-60">
												&mdash;{" "}
												{formatTokens(
													message.compactionTokensBefore,
												)}
												{" → "}
												{formatTokens(
													message.compactionTokensAfter,
												)}{" "}
												tokens
											</span>
										)}
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
	});
