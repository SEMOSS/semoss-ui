import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ButtonGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { InputMessageStore } from "../../room/store/input-message.store";
import type { RoomStore } from "../../room/store/room.store";
import { useRoomSelector } from "../../room/store/use-room-selector";

/** Props for {@link ResponseBranchNav}. */
interface ResponseBranchNavProps {
	/** The room the messages are in. */
	room: RoomStore;
	/** The user's message the response answers, one of its siblings. */
	inputMessage: InputMessageStore;
	/** Whether the arrows wait, while the response is being written. */
	disabled: boolean;
}

/**
 * Previous and next arrows between the branches of the user's message, with
 * which of them shows ("2/3"). Renders nothing for a message with no siblings.
 */
export const ResponseBranchNav = ({
	room,
	inputMessage,
	disabled,
}: ResponseBranchNavProps) => {
	const { t } = useTranslation("chat");
	// its siblings are other messages in the room
	const { position, count, hasPrevious, hasNext } = useRoomSelector(
		room,
		() => ({
			position: inputMessage.position,
			count: inputMessage.siblings.length,
			hasPrevious: !!inputMessage.previousSibling,
			hasNext: !!inputMessage.nextSibling,
		}),
	);

	if (count <= 1) {
		return null;
	}

	const arrows = [
		{
			label: t("response.previousMessage"),
			Icon: ArrowLeftIcon,
			isAvailable: hasPrevious,
			onClick: () => inputMessage.previousSibling?.activateMessage(),
		},
		{
			label: t("response.nextMessage"),
			Icon: ArrowRightIcon,
			isAvailable: hasNext,
			onClick: () => inputMessage.nextSibling?.activateMessage(),
		},
	];
	const [previous, next] = arrows.map(
		({ label, Icon, isAvailable, onClick }) => (
			<Tooltip key={label}>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={label}
						disabled={disabled || !isAvailable}
						onClick={onClick}
					>
						<Icon aria-hidden="true" className="rtl:-scale-x-100" />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">{label}</TooltipContent>
			</Tooltip>
		),
	);

	return (
		<ButtonGroup className="items-center gap-0.5 pt-2">
			{previous}
			<span className="text-muted-foreground text-xs">
				{position + 1}/{count}
			</span>
			{next}
		</ButtonGroup>
	);
};
