import {
	Calendar,
	type LucideIcon,
	Mail,
	MessageSquare,
	MessagesSquare,
	SquareCheck,
	Users,
} from "lucide-react";
import type { Channel } from "./state/collaboration.types";

const CHANNELS: Record<Channel, { label: string; icon: LucideIcon }> = {
	email: { label: "Email", icon: Mail },
	teams: { label: "Teams", icon: MessagesSquare },
	calendar: { label: "Calendar", icon: Calendar },
	room: { label: "Room", icon: Users },
	task: { label: "Task", icon: SquareCheck },
};

/** Label and icon for a channel; an unknown one reads as a message. */
export function channelMeta(channel: string): {
	label: string;
	icon: LucideIcon;
} {
	return (
		CHANNELS[channel as Channel] ?? { label: channel, icon: MessageSquare }
	);
}
