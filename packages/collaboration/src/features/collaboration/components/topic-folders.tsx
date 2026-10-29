import { FolderOpen, Plus, X } from "lucide-react";
import { useState } from "react";
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
} from "@semoss/ui/next";
import {
	linkTopicFolder,
	listMailFolders,
	type MailFolder,
	type TopicFolder,
} from "@/features/connectors/api/mail-folders";
import { useWorkUpdates } from "../live/work-updates.context";

interface TopicFoldersProps {
	topicId: string;
	folders: TopicFolder[];
	isSample: boolean;
}

/** The Outlook folders a topic stands for: mail in them is filed under it, as it arrives and when moved there. */
export function TopicFolders(props: TopicFoldersProps) {
	const updates = useWorkUpdates();
	// samples and isolated pages have no connection to change links through
	return updates && !props.isSample ? (
		<LiveTopicFolders {...props} />
	) : (
		<FolderList folders={props.folders} />
	);
}

function FolderList({ folders }: { folders: TopicFolder[] }) {
	if (!folders.length) return null;
	return (
		<div className="space-y-2 border-t pt-3">
			<H3 className="font-medium text-sm">Outlook folders</H3>
			<div className="flex flex-wrap gap-2">
				{folders.map((folder) => (
					<Badge
						key={folder.id}
						variant="outline"
						className="max-w-full gap-1 whitespace-normal break-words font-normal"
					>
						<FolderOpen className="size-3" aria-hidden="true" />
						{folder.path}
					</Badge>
				))}
			</div>
		</div>
	);
}

function LiveTopicFolders({ topicId, folders, isSample }: TopicFoldersProps) {
	const { actions } = useInsight();
	const updates = useWorkUpdates();
	// the page's copy until the next reload brings the saved links
	const [linked, setLinked] = useState<TopicFolder[] | null>(null);
	const [choices, setChoices] = useState<MailFolder[] | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [note, setNote] = useState("");
	const shown = linked ?? folders;

	async function open(next: boolean) {
		setIsOpen(next);
		if (!next || choices) return;
		try {
			setChoices(await listMailFolders(actions));
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not read your folders.",
			);
		}
	}

	async function change(folderId: string, remove: boolean) {
		setBusy(true);
		setError("");
		setNote("");
		try {
			// a topic made on this page is known to the server by another id
			const result = await linkTopicFolder(
				actions,
				updates ? await updates.serverId(topicId) : topicId,
				folderId,
				remove,
			);
			setLinked(result.folders);
			setIsOpen(false);
			if (result.filed)
				setNote(
					`Filed ${result.filed} ${result.filed === 1 ? "conversation" : "conversations"} from that folder here.`,
				);
			updates?.refresh();
		} catch (cause: unknown) {
			setError(
				cause instanceof Error ? cause.message : "That did not work.",
			);
		} finally {
			setBusy(false);
		}
	}

	const linkedIds = new Set(shown.map((folder) => folder.id));
	return (
		<div className="space-y-2 border-t pt-3">
			<div className="flex items-center justify-between gap-2">
				<H3 className="font-medium text-sm">Outlook folders</H3>
				{!isSample && (
					<Popover
						open={isOpen}
						onOpenChange={(next) => void open(next)}
					>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Link an Outlook folder"
								className="text-muted-foreground"
								disabled={busy}
							>
								<Plus aria-hidden="true" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 p-0">
							<Command label="Your Outlook folders">
								<CommandInput
									aria-label="Search your folders"
									placeholder="Search your folders..."
								/>
								<CommandList>
									{!choices && !error && (
										<Spinner
											className="m-4"
											aria-label="Loading folders"
										/>
									)}
									{choices?.length === 0 && (
										<CommandItem disabled>
											No folders you made yet. They show
											up after the next refresh.
										</CommandItem>
									)}
									{choices?.map((folder) => (
										<CommandItem
											key={folder.id}
											value={folder.path}
											disabled={
												busy || linkedIds.has(folder.id)
											}
											className="min-h-9"
											onSelect={() =>
												void change(folder.id, false)
											}
										>
											<FolderOpen
												className="size-4 shrink-0 text-muted-foreground"
												aria-hidden="true"
											/>
											<span className="min-w-0 flex-1 break-words">
												{folder.path}
											</span>
											{linkedIds.has(folder.id) &&
												" - linked"}
										</CommandItem>
									))}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				)}
			</div>
			{shown.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{shown.map((folder) => (
						<Badge
							key={folder.id}
							variant="outline"
							className="max-w-full gap-1 whitespace-normal break-words pr-1 font-normal"
						>
							<FolderOpen className="size-3" aria-hidden="true" />
							{folder.path}
							{!isSample && (
								<Button
									type="button"
									aria-label={`Unlink folder ${folder.path}`}
									variant="ghost"
									size="icon-sm"
									className="size-6 rounded-full text-muted-foreground"
									disabled={busy}
									onClick={() => void change(folder.id, true)}
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
					? "Mail in these folders is filed here, as it arrives and when you move it there."
					: "Link a folder you file this work in, and its mail is filed here."}
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
