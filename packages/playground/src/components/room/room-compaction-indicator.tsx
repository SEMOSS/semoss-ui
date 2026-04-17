import { ArchiveIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, RoomStore } from "@/stores";

interface RoomCompactionIndicatorProps {
	/** Room — when provided, shows the loading state via useLoadingMessage */
	room?: RoomStore;
	/** Message — when provided, shows the completed state if conversationCompactedAbove */
	message?: ResponseMessageStore;
}

export const RoomCompactionIndicator: React.FC<RoomCompactionIndicatorProps> =
	observer(({ room, message }) => {
		const { t } = useTranslation("room");
		const { loadingMessage } = useLoadingMessage(
			room?.isCompacting ?? false,
			[t("settings.compacting")],
		);

		if (message) {
			if (!message.conversationCompactedAbove) return null;

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="relative mb-4 flex h-6 w-full cursor-default items-center justify-center overflow-hidden rounded-sm">
							<div
								className="absolute inset-0 opacity-[0.18]"
								style={{
									backgroundImage:
										"repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
								}}
							/>
							<div className="relative z-10 flex items-center gap-1.5 rounded bg-secondary-background px-2 text-muted-foreground text-xs leading-normal">
								<ArchiveIcon className="h-3 w-3" />
								<span>{t("settings.compactedAbove")}</span>
							</div>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						{t("settings.compactedAboveTooltip")}
					</TooltipContent>
				</Tooltip>
			);
		}

		if (!loadingMessage) return null;

		return (
			<div className="relative flex h-6 w-full items-center justify-center overflow-hidden rounded-sm">
				<div
					className="absolute inset-0 opacity-[0.18]"
					style={{
						backgroundImage:
							"repeating-linear-gradient(-45deg, currentColor, currentColor 1px, transparent 1px, transparent 8px)",
					}}
				/>
				<div className="relative z-10 flex items-center gap-1.5 rounded bg-secondary-background px-2 text-muted-foreground text-xs leading-normal">
					<ArchiveIcon className="h-3 w-3 animate-pulse" />
					<span>{loadingMessage}</span>
				</div>
			</div>
		);
	});
