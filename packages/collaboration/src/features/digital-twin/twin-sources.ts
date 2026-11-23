import { File } from "lucide-react";
import {
	type AppIcon,
	OneDriveIcon,
	OutlookCalendarIcon,
	OutlookIcon,
	TeamsChatsIcon,
	TeamsFilesIcon,
} from "@/components/common/app-icons";
import type { TwinSource } from "./api/digital-twin";
import { TwinFinderIcon } from "./twin-finder-icon";

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
			"Your mailbox. Save an email to add its whole conversation to this twin.",
	},
	calendar: {
		label: "Calendar",
		icon: OutlookCalendarIcon,
		description:
			"Your Outlook calendar. Save a meeting to add when it was, who was invited and what it was about to this twin.",
	},
	"teams-chats": {
		label: "Teams chats",
		icon: TeamsChatsIcon,
		description:
			"Your Teams chats. Save one to add its latest messages to this twin.",
	},
	onedrive: {
		label: "OneDrive",
		icon: OneDriveIcon,
		description:
			"Your OneDrive files and the files shared with you. Save one to add it to this twin.",
	},
	"teams-files": {
		label: "Teams files",
		icon: TeamsFilesIcon,
		description:
			"The files of a Teams channel. Choose a team and a channel, then save a file to add it to this twin.",
	},
} as const;

/** One of the places in {@link TWIN_SOURCES}. */
export type TwinSourceId = keyof typeof TWIN_SOURCES;

/**
 * The place that finds a twin's knowledge from a description of it, in place
 * of browsing for it. The rail lists it first among the places to add from.
 */
export const TWIN_FINDER = {
	id: "find",
	label: "Find with AI",
	icon: TwinFinderIcon,
	description:
		"Describe what this twin should know. Your Outlook, Teams chats and OneDrive are searched, and the emails, chats and files that fit are suggested for you to add.",
} as const;

// The mail viewer knows an email by its thread, or by itself when it has none, and a file attached to one by
// the email's id and its own. One with no key is taken for an email, as it was before attachments were told apart.
const isAttachment = (source: TwinSource): boolean =>
	source.service === "outlook-mail" &&
	source.itemKey !== undefined &&
	!/^(conversation|message):/.test(source.itemKey);

/** What a chosen item is and where it came from, for a list of them. */
export function twinSourceKind(source: TwinSource): {
	label: string;
	icon: AppIcon;
} {
	switch (source.service) {
		case "outlook-mail":
			return {
				label: isAttachment(source)
					? "Attachment from Outlook"
					: "Email from Outlook",
				icon: OutlookIcon,
			};
		case "outlook-calendar":
			return {
				label: "Meeting from your calendar",
				icon: OutlookCalendarIcon,
			};
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
 * How many emails, meetings, Teams chats and files a choice holds, in words,
 * such as "2 emails, 1 Teams chat"; empty when nothing is chosen.
 */
export function describeTwinSources(sources: TwinSource[]): string {
	// a file attached to an email is a file
	const emails = sources.filter(
		(source) => source.service === "outlook-mail" && !isAttachment(source),
	).length;
	const meetings = sources.filter(
		(source) => source.service === "outlook-calendar",
	).length;
	const chats = sources.filter(
		(source) => source.service === "teams-chats",
	).length;
	const files = sources.length - emails - meetings - chats;
	return [
		emails && `${emails} ${emails === 1 ? "email" : "emails"}`,
		meetings && `${meetings} ${meetings === 1 ? "meeting" : "meetings"}`,
		chats && `${chats} ${chats === 1 ? "Teams chat" : "Teams chats"}`,
		files && `${files} ${files === 1 ? "file" : "files"}`,
	]
		.filter(Boolean)
		.join(", ");
}
