import { MessageSquare, SquareCheck, Users } from "lucide-react";
import {
	type AppIcon,
	OutlookCalendarIcon,
	OutlookIcon,
	TeamsIcon,
} from "@/components/common/app-icons";
import type { Channel } from "./state/collaboration.types";

// mail, Teams and the calendar are read from Microsoft 365, so each wears its app's logo
const CHANNELS: Record<Channel, { label: string; icon: AppIcon }> = {
	email: { label: "Email", icon: OutlookIcon },
	teams: { label: "Teams", icon: TeamsIcon },
	calendar: { label: "Calendar", icon: OutlookCalendarIcon },
	room: { label: "Room", icon: Users },
	task: { label: "Task", icon: SquareCheck },
};

/** Label and icon for a channel; an unknown one reads as a message. */
export function channelMeta(channel: string): {
	label: string;
	icon: AppIcon;
} {
	return (
		CHANNELS[channel as Channel] ?? { label: channel, icon: MessageSquare }
	);
}
