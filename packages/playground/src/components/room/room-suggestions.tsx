import { ListMinusIcon, PlusIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { usePixel } from "@semoss/sdk/react";
import type { RoomStore } from "@/stores";

interface RoomSuggestionsProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * The suggestions page for a room
 */
export const RoomSuggestions: React.FC<RoomSuggestionsProps> = observer(
	({ room }) => {
		const getSuggestions = usePixel<{ suggestions: string[] }>(
			!room.isLoading && !room.error
				? `GenerateFollowUpQuestions(engine=["${room.model.engine_id}"], roomId=["${room.roomId}"])`
				: "",
			{
				data: {
					suggestions: [],
				},
			},
			room.insightId,
		);

		// hide if not successful
		if (getSuggestions.status !== "SUCCESS") {
			return null;
		}

		// hide if suggestions is missing or not an array
		if (
			!Array.isArray(getSuggestions.data?.suggestions) ||
			getSuggestions.data.suggestions.length === 0
		) {
			return null;
		}

		// TODO: animate
		return (
			<div className="mx-8 flex animate-accordion-down flex-col items-start overflow-hidden rounded-lg border border-border bg-primary-foreground shadow-sm">
				<div className="flex w-full flex-row items-center gap-1 p-2">
					<ListMinusIcon className="size-4" />
					<div className="font-medium text-sm">
						Suggested Questions
					</div>
				</div>
				{getSuggestions.data.suggestions.map((suggestion) => (
					<button
						key={suggestion}
						className="flex w-full flex-row flex-wrap gap-2.5 border-border border-t bg-background px-2 py-3 text-muted-foreground outline-none transition-colors duration-100 hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						type="button"
						onClick={() => {
							room.askMessage(suggestion, []);
						}}
					>
						<div
							className="flex-1 truncate text-left text-sm"
							title={suggestion}
						>
							{suggestion}
						</div>
						<PlusIcon className="size-4" />
					</button>
				))}
			</div>
		);
	},
);
