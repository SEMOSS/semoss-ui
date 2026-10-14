import { ListMinusIcon, PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Small } from "@semoss/ui/next";
import { useRoomSuggestions } from "@/features/suggestions/use-room-suggestions";
import type { RoomStore } from "@/stores/room/room.store";

interface RoomSuggestionsProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * Follow-up messages that continue the conversation or use its attached tools.
 */
export const RoomSuggestions: React.FC<RoomSuggestionsProps> = observer(
	({ room }) => {
		const { t } = useTranslation("room");
		const suggestions = useRoomSuggestions(room);
		if (suggestions.length === 0) {
			return null;
		}

		return (
			<div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
				<div className="flex items-center gap-2 bg-muted/50 p-2">
					<ListMinusIcon aria-hidden="true" className="size-4" />
					<Small>{t("suggestions.title")}</Small>
				</div>
				{suggestions.map((suggestion) => (
					<Button
						key={suggestion}
						variant="ghost"
						className="h-auto min-h-11 w-full justify-between whitespace-normal rounded-none border-border border-t p-3 text-start font-normal"
						type="button"
						onClick={() => {
							void room
								.askMessage(suggestion, [])
								.catch((error: unknown) => {
									room.setError(
										error instanceof Error
											? error
											: new Error(String(error)),
									);
								});
						}}
					>
						<span className="wrap-anywhere min-w-0 flex-1">
							{suggestion}
						</span>
						<PlusIcon aria-hidden="true" className="size-4" />
					</Button>
				))}
			</div>
		);
	},
);
