import {
	ArrowLeft,
	Brain,
	CircleDashed,
	File,
	Mail,
	MessageSquare,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { type MailFolder, useMailFolders } from "@semoss/connectors";
import { Button, cn, H1, P } from "@semoss/ui/next";
import {
	OneDriveIcon,
	TeamsFilesIcon,
	TeamsIcon,
} from "@/components/common/app-icons";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { topicPath } from "@/lib/workspace-paths";
import { ChatSource } from "./chat-source";
import { FileSource } from "./file-source";
import { MailboxSource } from "./mailbox-source";
import { ThreadSource } from "./thread-source";
import { isInThreadView, type ThreadView } from "./thread-views";
import {
	folderLabel,
	TopicContentsNav,
	type TopicPlaceGroup,
} from "./topic-contents-nav";

// the mailbox takes the inbox by this name in place of its id
const INBOX = "folder:inbox";
const THREAD_VIEWS: ThreadView[] = ["topic", "unfiled", "teams", "all"];
// the places that list files, with what each shows; a map, since the place is read from the address
const FILE_VIEWS = new Map<string, "topic" | "onedrive" | "teams">([
	["topic-files", "topic"],
	["onedrive", "onedrive"],
	["teams-files", "teams"],
]);
// Outlook's own folders that Brain never reads mail from, so nothing in them can be added
// shortcut: matched by their English names, the only identity the listing gives them, so a mailbox in another
// language lists them all; have the folder listing name its well known folders to hide them there too
const UNREAD_FOLDERS = new Set([
	"deleted items",
	"junk email",
	"drafts",
	"outbox",
	"conversation history",
	"sync issues",
	"clutter",
]);

/** The folders mail can be filed from: the listing without Outlook's system folders and what is under them. */
function fileableFolders(folders: MailFolder[]): MailFolder[] {
	const kept: MailFolder[] = [];
	let isUnderSkipped = false;
	for (const folder of folders) {
		// a listing puts each folder right after the one it sits in
		if (folder.depth === 0)
			isUnderSkipped = UNREAD_FOLDERS.has(folder.name.toLowerCase());
		if (!isUnderSkipped) kept.push(folder);
	}
	return kept;
}

/**
 * A full page for choosing what is in a topic by hand: the owner's Outlook folders as the mailbox has them,
 * the conversations Brain has read, the assistant chats, and their OneDrive and Teams files, each row with a
 * box that adds it or takes it off, and for mail a pane to read it in first.
 */
export function TopicContents() {
	const { topicId } = useParams();
	const [params, setParams] = useSearchParams();
	const { state } = useCollaborationSession();
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	// the server files mail and links chats and files, and it holds no sample topic
	const isSaved = topic !== undefined && !topic.isSample;
	const mailbox = useMailFolders(isSaved ? "microsoft" : null);
	if (!topic) return <Navigate to={topicPath(topicId ?? "")} replace />;
	// the server only links a chat to a topic that is active or dormant
	const canLinkChats =
		isSaved && (topic.status === "active" || topic.status === "dormant");

	const counts: Record<ThreadView, number> = {
		topic: 0,
		unfiled: 0,
		teams: 0,
		all: 0,
	};
	for (const thread of state.threads)
		if (thread.isSample === topic.isSample)
			for (const view of THREAD_VIEWS)
				if (isInThreadView(view, thread, topic.id)) counts[view] += 1;
	// short lists first, so they stay in view above a mailbox with many folders
	const groups: TopicPlaceGroup[] = [
		{
			title: "In this topic",
			places: [
				{
					id: "topic",
					label: "Emails and Teams chats",
					icon: Mail,
					count: counts.topic,
				},
				...(canLinkChats
					? [
							{
								id: "topic-chats",
								label: "Assistant chats",
								icon: MessageSquare,
							},
						]
					: []),
				...(isSaved
					? [
							{
								id: "topic-files",
								label: "Files",
								icon: File,
								count: topic.files?.length ?? 0,
							},
						]
					: []),
			],
		},
		{
			title: "Add from",
			places: [
				{
					id: "teams",
					label: "Teams chats",
					icon: TeamsIcon,
					count: counts.teams,
				},
				...(canLinkChats
					? [
							{
								id: "chats",
								label: "Assistant chats",
								icon: MessageSquare,
							},
						]
					: []),
				{
					id: "unfiled",
					label: "No topic yet",
					icon: CircleDashed,
					count: counts.unfiled,
				},
				{
					id: "all",
					label: "Everything Brain has read",
					icon: Brain,
					count: counts.all,
				},
				...(isSaved
					? [
							{
								id: "onedrive",
								label: "OneDrive",
								icon: OneDriveIcon,
							},
							{
								id: "teams-files",
								label: "Teams files",
								icon: TeamsFilesIcon,
							},
						]
					: []),
			],
		},
	];
	const folders = fileableFolders(mailbox.folders);

	const place = params.get("in") ?? (isSaved ? INBOX : "unfiled");
	const folderId = place.startsWith("folder:")
		? place.slice("folder:".length)
		: undefined;
	const folder = folders.find((entry) => entry.id === folderId);
	const threadView = THREAD_VIEWS.find((view) => view === place);
	const fileView = isSaved ? FILE_VIEWS.get(place) : undefined;
	// the topic page opens on the tab that lists what was just changed
	let tab = "threads";
	if (place === "chats" || place === "topic-chats") tab = "sessions";
	else if (fileView) tab = "files";
	const backState = { tab };
	// each place starts with its own search and open row; one this topic cannot show falls back to the unfiled
	let active: string = threadView ?? "unfiled";
	let list: ReactNode = (
		<ThreadSource
			key={active}
			topic={topic}
			view={threadView ?? "unfiled"}
			emptyAction={
				// Brain reads Teams chats only once the owner turns them on
				threadView === "teams" &&
				isSaved &&
				!state.settings.sourcesJson.teams && (
					<Button
						asChild
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11"
					>
						<Link to="/brain/sources">
							Turn on Teams chats in Connections
						</Link>
					</Button>
				)
			}
		/>
	);
	if (isSaved && folderId) {
		active = place;
		list = (
			<MailboxSource
				key={place}
				topic={topic}
				folderId={folderId}
				folderName={folder ? folderLabel(folder) : "Mailbox"}
				onSignedIn={mailbox.reload}
			/>
		);
	} else if (canLinkChats && (place === "chats" || place === "topic-chats")) {
		active = place;
		list = (
			<ChatSource
				key={place}
				topic={topic}
				view={place === "chats" ? "all" : "topic"}
			/>
		);
	} else if (fileView) {
		active = place;
		list = <FileSource key={place} topic={topic} view={fileView} />;
	}

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
			<header className="flex shrink-0 items-center gap-2 border-b px-3 py-3 md:gap-3 md:px-4">
				<Button
					asChild
					variant="ghost"
					size="icon-sm"
					className="pointer-coarse:size-11 shrink-0"
				>
					<Link
						to={topicPath(topic.id)}
						state={backState}
						aria-label={`Back to ${topic.name}`}
					>
						<ArrowLeft aria-hidden="true" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<H1 className="flex min-w-0 items-start gap-2 font-medium text-base leading-snug tracking-normal sm:text-lg">
						<span
							aria-hidden="true"
							className={cn(
								"mt-1.5 size-2.5 shrink-0 rounded-full",
								topicTone(topic.id),
							)}
						/>
						<span className="wrap-anywhere line-clamp-2 min-w-0">
							Emails, chats and files in {topic.name}
						</span>
					</H1>
					{/* a phone keeps the room for the list; the page says the same as it is used */}
					<P className="hidden text-muted-foreground text-sm sm:block">
						Check what belongs in this topic. Changes save as you
						go.
					</P>
				</div>
				<Button asChild className="pointer-coarse:min-h-11 shrink-0">
					<Link to={topicPath(topic.id)} state={backState}>
						Done
					</Link>
				</Button>
			</header>
			<div className="flex min-h-0 flex-1 flex-col md:flex-row">
				<TopicContentsNav
					groups={groups}
					mailbox={isSaved ? { ...mailbox, folders } : undefined}
					place={active}
					onPlaceChange={(next) =>
						// replaced, so Back leaves the page instead of walking the folders
						setParams({ in: next }, { replace: true })
					}
				/>
				{list}
			</div>
		</div>
	);
}
