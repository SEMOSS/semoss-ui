import { File } from "lucide-react";
import {
	type AppIcon,
	OneDriveIcon,
	OutlookIcon,
	TeamsChatsIcon,
	TeamsFilesIcon,
} from "@/components/common/app-icons";
import type { TwinSource } from "./api/digital-twin";

/**
 * The owner's own places a twin's knowledge is picked from, as the rail names
 * each and as it says above the place's list. Each is a viewer of
 * `@semoss/connectors`, which saves an item into the page's files.
 */
export const TWIN_SOURCES = {
	outlook: {
		label: "Outlook",
		icon: OutlookIcon,
		description:
			"Your mailbox. Save an email to add its whole conversation to your Digital Twin.",
	},
	"teams-chats": {
		label: "Teams chats",
		icon: TeamsChatsIcon,
		description:
			"Your Teams chats. Save one to add its latest messages to your Digital Twin.",
	},
	onedrive: {
		label: "OneDrive",
		icon: OneDriveIcon,
		description:
			"Your OneDrive files and the files shared with you. Save one to add it to your Digital Twin.",
	},
	"teams-files": {
		label: "Teams files",
		icon: TeamsFilesIcon,
		description:
			"The files of a Teams channel. Choose a team and a channel, then save a file to add it to your Digital Twin.",
	},
} as const;

/** One of the places in {@link TWIN_SOURCES}. */
export type TwinSourceId = keyof typeof TWIN_SOURCES;

/** What a chosen item is and where it came from, for a list of them. */
export function twinSourceKind(source: TwinSource): {
	label: string;
	icon: AppIcon;
} {
	switch (source.service) {
		case "outlook-mail":
			return { label: "Email from Outlook", icon: OutlookIcon };
		case "teams-chats":
			return { label: "Teams chat", icon: TeamsChatsIcon };
		case "onedrive":
			return { label: "File from OneDrive", icon: OneDriveIcon };
		case "teams-files":
			return { label: "File from Teams", icon: TeamsFilesIcon };
		default:
			return { label: "File from your computer", icon: File };
	}
}

/**
 * How many emails, Teams chats and files a choice holds, in words, such as
 * "2 emails, 1 Teams chat"; empty when nothing is chosen.
 */
export function describeTwinSources(sources: TwinSource[]): string {
	const emails = sources.filter(
		(source) => source.service === "outlook-mail",
	).length;
	const chats = sources.filter(
		(source) => source.service === "teams-chats",
	).length;
	const files = sources.length - emails - chats;
	return [
		emails && `${emails} ${emails === 1 ? "email" : "emails"}`,
		chats && `${chats} ${chats === 1 ? "Teams chat" : "Teams chats"}`,
		files && `${files} ${files === 1 ? "file" : "files"}`,
	]
		.filter(Boolean)
		.join(", ");
}
