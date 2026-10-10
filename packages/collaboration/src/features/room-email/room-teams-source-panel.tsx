import { ExternalLink, MessagesSquare } from "lucide-react";
import { createElement } from "react";
import { Alert, AlertDescription, Button, H4, P, Small } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { ThreadMessage } from "@/features/collaboration/components/thread-message";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { useRoomEmail } from "./room-email.context";

export const ROOM_TEAMS_SOURCE_PANEL_TYPE = "collaboration-teams-source";

/** Read the Teams chat a room was opened from, oldest message first. */
export function RoomTeamsSourcePanel(_props: WorkbenchPanelProps) {
	const {
		source,
		sourceMessages,
		isSourceLoading,
		sourceError,
		reloadSource,
	} = useRoomEmail();
	if (source?.channel !== "teams")
		return <P className="p-4">This room does not have a Teams chat.</P>;
	const allowedIds = new Set(source.messages.map((message) => message.id));
	const messages = sourceMessages
		.filter((message) => allowedIds.has(message.id) && !message.excluded)
		.sort((left, right) => left.at.localeCompare(right.at));
	const people = [
		...new Set(
			messages.flatMap((message) => {
				const name = message.fromName || message.fromAddress;
				return name ? [name] : [];
			}),
		),
	];
	const webLink = safeSourceUrl(source.webLink);
	return (
		<section
			aria-label="Teams chat"
			aria-busy={isSourceLoading}
			className="flex size-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto bg-background p-4"
		>
			<header className="flex min-w-0 items-start gap-2">
				<div className="min-w-0 flex-1 space-y-1">
					<H4 className="truncate">{source.title || "Teams chat"}</H4>
					{people.length > 0 && (
						<Small className="block truncate text-muted-foreground text-xs">
							{people.join(", ")}
						</Small>
					)}
				</div>
				{webLink && (
					<Button variant="ghost" size="sm" asChild>
						<a
							href={webLink}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink aria-hidden="true" />
							Open in Teams
						</a>
					</Button>
				)}
			</header>
			{source.kind === "teams" && (
				<Small className="text-muted-foreground">
					Only the latest Teams messages (up to 30) are shown; older
					chat history is not included.
				</Small>
			)}
			{isSourceLoading && <output>Loading chat...</output>}
			{sourceError && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P>{sourceError}</P>
						<Button
							type="button"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={isSourceLoading}
							onClick={reloadSource}
						>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{messages.length ? (
				<div className="flex flex-col gap-5">
					{messages.map((message) => (
						<ThreadMessage
							key={message.id}
							message={message}
							name={
								message.fromName ||
								message.fromAddress ||
								"Participant"
							}
							channel="teams"
							isIncluded
							isEmpty={!message.text.trim()}
							isFlat
						/>
					))}
				</div>
			) : !isSourceLoading && !sourceError ? (
				<P>No messages from this chat are available in this room.</P>
			) : null}
		</section>
	);
}

const ROOM_TEAMS_SOURCE_PANEL: WorkbenchPanelConfig<Record<string, never>> = {
	name: "Teams chat",
	icon: ({ className }) =>
		createElement(MessagesSquare, { className, "aria-hidden": true }),
	content: RoomTeamsSourcePanel,
	mount: "keepAlive",
	canRename: false,
	canSplitTab: false,
	matches: () => true,
};

/** Register the Teams reader in the room's existing tool and file dock. */
export const ROOM_TEAMS_SOURCE_PANEL_COMPONENTS = {
	[ROOM_TEAMS_SOURCE_PANEL_TYPE]: ROOM_TEAMS_SOURCE_PANEL,
};
