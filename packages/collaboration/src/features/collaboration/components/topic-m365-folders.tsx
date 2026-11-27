import { FolderOpen, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Command,
	CommandInput,
	CommandItem,
	CommandList,
	H3,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import {
	type FolderPointer,
	linkTopicM365Folder,
	listAvailableOneDriveFolders,
	listAvailableTeams,
	listTeamChannels,
	type OneDriveFolder,
	type Team,
	type TeamChannel,
	type TopicM365Folder,
	unlinkTopicM365Folder,
} from "@/features/connectors/api/m365-folders";
import { useWorkUpdates } from "../live/work-updates.context";

interface TopicM365FoldersProps {
	topicId: string;
	folders: TopicM365Folder[];
	isSample: boolean;
}

/** The Microsoft 365 folders (Teams channels, OneDrive folders) linked to a topic. */
export function TopicM365Folders(props: TopicM365FoldersProps) {
	const updates = useWorkUpdates();
	// samples and isolated pages have no connection to change links through
	return updates && !props.isSample ? (
		<LiveTopicM365Folders {...props} />
	) : (
		<FolderList folders={props.folders} />
	);
}

function FolderList({ folders }: { folders: TopicM365Folder[] }) {
	if (!folders || !folders.length) return null;
	return (
		<div className="space-y-2 border-t pt-3">
			<H3 className="font-medium text-sm">Microsoft 365 folders</H3>
			<div className="flex flex-wrap gap-2">
				{folders.map((folder) => (
					<Badge
						key={folder.linkId}
						variant="outline"
						className="max-w-full gap-1 whitespace-normal break-words font-normal"
					>
						<FolderOpen className="size-3" aria-hidden="true" />
						{folder.displayName}
						{folder.state === "no_access" && (
							<span className="text-destructive text-xs">
								(no access)
							</span>
						)}
					</Badge>
				))}
			</div>
		</div>
	);
}

function LiveTopicM365Folders({
	topicId,
	folders,
	isSample,
}: TopicM365FoldersProps) {
	const { actions } = useInsight();
	const updates = useWorkUpdates();
	// Local state tracks changes after linking; initialized with the prop value from backend
	const [linked, setLinked] = useState<TopicM365Folder[] | null>(
		folders && folders.length > 0 ? folders : null,
	);
	const [teams, setTeams] = useState<Team[] | null>(null);
	const [channels, setChannels] = useState<TeamChannel[] | null>(null);
	const [onedriveFolders, setOnedriveFolders] = useState<
		OneDriveFolder[] | null
	>(null);
	const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [note, setNote] = useState("");
	const shown = linked ?? folders;

	// Sync linked state when folders prop changes (e.g., after page reload with backend data)
	useEffect(() => {
		if (folders && folders.length > 0 && !linked) {
			setLinked(folders);
		}
	}, [folders, linked]);

	async function open(next: boolean) {
		setIsOpen(next);
		if (!next) return;
		setError("");
		setNote("");
		// Load data for both tabs when opening
		try {
			const [teamsList, allFolders] = await Promise.all([
				listAvailableTeams(actions),
				listAvailableOneDriveFolders(actions),
			]);
			setTeams(teamsList);
			// Filter to show only folders, exclude files
			const foldersOnly = allFolders.filter(
				(item) => item.isFolder === true,
			);
			setOnedriveFolders(foldersOnly);
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not read your folders.",
			);
		}
	}

	async function loadChannels(teamId: string) {
		try {
			setChannels(null);
			setSelectedTeam(teamId);
			const channelsList = await listTeamChannels(actions, teamId);
			setChannels(channelsList);
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not read channels for this team.",
			);
		}
	}

	async function linkFolder(pointer: FolderPointer, remove: boolean) {
		setBusy(true);
		setError("");
		setNote("");
		try {
			// a topic made on this page is known to the server by another id
			const serverId = updates
				? await updates.serverId(topicId)
				: topicId;
			const result = remove
				? await unlinkTopicM365Folder(
						actions,
						serverId,
						pointer.linkId || "",
					)
				: await linkTopicM365Folder(actions, serverId, pointer);
			setLinked(result);
			setIsOpen(false);
			updates?.refresh();
		} catch (cause: unknown) {
			setError(
				cause instanceof Error ? cause.message : "That did not work.",
			);
		} finally {
			setBusy(false);
		}
	}

	const linkedIds = new Set(shown.map((folder) => folder.linkId));

	return (
		<div className="space-y-2 border-t pt-3">
			<div className="flex items-center justify-between gap-2">
				<H3 className="font-medium text-sm">Microsoft 365 folders</H3>
				{!isSample && (
					<Popover
						open={isOpen}
						onOpenChange={(next) => void open(next)}
					>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Link a Microsoft 365 folder"
								className="text-muted-foreground"
								disabled={busy}
							>
								<Plus aria-hidden="true" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 p-0">
							<Tabs
								defaultValue="teams"
								className="w-full"
								onValueChange={() => setSelectedTeam(null)}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="teams">
										Teams
									</TabsTrigger>
									<TabsTrigger value="onedrive">
										OneDrive
									</TabsTrigger>
								</TabsList>

								<TabsContent value="teams" className="p-4">
									{!teams && !error && (
										<div className="flex items-center justify-center py-4">
											<Spinner aria-label="Loading teams" />
										</div>
									)}
									{error && !teams && (
										<Alert variant="destructive">
											<AlertDescription>
												{error}
											</AlertDescription>
										</Alert>
									)}
									{teams && teams.length === 0 && (
										<P className="text-muted-foreground text-sm">
											No teams found.
										</P>
									)}
									{teams &&
										teams.length > 0 &&
										!selectedTeam && (
											<Command label="Your Teams">
												<CommandInput
													aria-label="Search teams"
													placeholder="Search teams..."
												/>
												<CommandList>
													{teams.map((team) => (
														<CommandItem
															key={team.id}
															value={
																team.displayName
															}
															disabled={busy}
															onSelect={() =>
																void loadChannels(
																	team.id,
																)
															}
														>
															<FolderOpen className="mr-2 size-4 shrink-0 text-muted-foreground" />
															<span className="min-w-0 flex-1 break-words">
																{
																	team.displayName
																}
															</span>
														</CommandItem>
													))}
												</CommandList>
											</Command>
										)}
									{selectedTeam && channels !== null && (
										<div className="space-y-2">
											<Button
												variant="ghost"
												size="sm"
												className="text-xs"
												onClick={() =>
													setSelectedTeam(null)
												}
											>
												← Back to teams
											</Button>
											<Command label="Team Channels">
												<CommandInput
													aria-label="Search channels"
													placeholder="Search channels..."
												/>
												<CommandList>
													{channels.length === 0 && (
														<CommandItem disabled>
															No channels found.
														</CommandItem>
													)}
													{channels.map((channel) => (
														<CommandItem
															key={channel.id}
															value={
																channel.displayName
															}
															disabled={
																busy ||
																linkedIds.has(
																	channel.id,
																)
															}
															className="min-h-9"
															onSelect={() =>
																void linkFolder(
																	{
																		kind: "channel_files",
																		teamId: selectedTeam,
																		channelId:
																			channel.id,
																		displayName:
																			channel.displayName,
																	} as FolderPointer,
																	false,
																)
															}
														>
															<FolderOpen className="size-4 shrink-0 text-muted-foreground" />
															<span className="min-w-0 flex-1 break-words">
																{
																	channel.displayName
																}
															</span>
															{linkedIds.has(
																channel.id,
															) && " - linked"}
														</CommandItem>
													))}
												</CommandList>
											</Command>
										</div>
									)}
								</TabsContent>

								<TabsContent value="onedrive" className="p-4">
									{!onedriveFolders && !error && (
										<div className="flex items-center justify-center py-4">
											<Spinner aria-label="Loading OneDrive folders" />
										</div>
									)}
									{error && !onedriveFolders && (
										<Alert variant="destructive">
											<AlertDescription>
												{error}
											</AlertDescription>
										</Alert>
									)}
									{onedriveFolders &&
										onedriveFolders.length === 0 && (
											<P className="text-muted-foreground text-sm">
												No folders found.
											</P>
										)}
									{onedriveFolders &&
										onedriveFolders.length > 0 && (
											<Command label="Your OneDrive folders">
												<CommandInput
													aria-label="Search folders"
													placeholder="Search folders..."
												/>
												<CommandList>
													{onedriveFolders.map(
														(folder) => (
															<CommandItem
																key={folder.id}
																value={
																	folder.name
																}
																disabled={
																	busy ||
																	linkedIds.has(
																		folder.id,
																	)
																}
																className="min-h-9"
																onSelect={() =>
																	void linkFolder(
																		{
																			kind: "drive_folder",
																			driveId:
																				folder.driveId,
																			itemId: folder.id,
																			displayName:
																				folder.name,
																		} as FolderPointer,
																		false,
																	)
																}
															>
																<FolderOpen className="size-4 shrink-0 text-muted-foreground" />
																<span className="min-w-0 flex-1 break-words">
																	{
																		folder.name
																	}
																</span>
																{linkedIds.has(
																	folder.id,
																) &&
																	" - linked"}
															</CommandItem>
														),
													)}
												</CommandList>
											</Command>
										)}
								</TabsContent>
							</Tabs>
						</PopoverContent>
					</Popover>
				)}
			</div>
			{shown.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{shown.map((folder) => (
						<Badge
							key={folder.linkId}
							variant={
								folder.state === "no_access"
									? "secondary"
									: "outline"
							}
							className="max-w-full gap-1 whitespace-normal break-words pr-1 font-normal"
						>
							<FolderOpen className="size-3" aria-hidden="true" />
							<span>
								{folder.displayName}
								{folder.state === "no_access" && (
									<span className="text-destructive text-xs">
										(no access)
									</span>
								)}
							</span>
							{!isSample && (
								<Button
									type="button"
									aria-label={`Unlink folder ${folder.displayName}`}
									variant="ghost"
									size="icon-sm"
									className="size-6 rounded-full text-muted-foreground"
									disabled={busy}
									onClick={() =>
										void linkFolder(
											{
												kind: folder.kind,
												driveId: folder.driveId,
												itemId: folder.itemId,
												teamId: folder.teamId,
												channelId: folder.channelId,
												displayName: folder.displayName,
												linkId: folder.linkId,
											} as FolderPointer,
											true,
										)
									}
								>
									<X className="size-3" aria-hidden="true" />
								</Button>
							)}
						</Badge>
					))}
				</div>
			)}
			<P className="text-muted-foreground text-sm leading-relaxed">
				{shown.length
					? "Files from these folders are available in this topic's chat."
					: "Link a Teams channel or OneDrive folder to explore its files in this topic's chat."}
			</P>
			{note && <P className="text-muted-foreground text-sm">{note}</P>}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
