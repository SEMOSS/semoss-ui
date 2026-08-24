import { CheckIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Button, cn, Input, ScrollArea, Spinner, toast } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import { formatSessionDate } from "./workbench-assistant-format";

interface WorkbenchAssistantConversationsProps {
	/** Called after a room is resumed or created so the panel can return to the assistant view */
	onConversationSelected: () => void;
}

/**
 * Conversation history view: lists this workbench's previous rooms with
 * inline rename (Enter saves, Escape cancels), highlights the active room,
 * and resumes a room on click. Loads the conversation list on mount and
 * offers a new-conversation action above the list.
 *
 * @name WorkbenchAssistantConversations
 * @param onConversationSelected - Called after a room is resumed or created
 * so the panel can return to the assistant view.
 * @return The conversation history list view.
 */
export const WorkbenchAssistantConversations = ({
	onConversationSelected,
}: WorkbenchAssistantConversationsProps) => {
	const activeRoomId = useWorkbench((state) => state.assistant.roomId);
	const conversations = useWorkbench(
		(state) => state.assistant.conversations,
	);
	const isLoadingConversations = useWorkbench(
		(state) => state.assistant.isLoadingConversations,
	);
	const loadConversations = useWorkbench(
		(state) => state.assistant.loadConversations,
	);
	const resumeRoom = useWorkbench((state) => state.assistant.resumeRoom);
	const renameRoom = useWorkbench((state) => state.assistant.renameRoom);
	const newRoom = useWorkbench((state) => state.assistant.newRoom);

	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	const [draftRoomName, setDraftRoomName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);

	useEffect(() => {
		void loadConversations();
	}, [loadConversations]);

	const handleNewConversation = async () => {
		setEditingRoomId(null);
		setDraftRoomName("");
		await newRoom();
		onConversationSelected();
	};

	const handleResume = (roomId: string) => {
		void resumeRoom(roomId);
		setEditingRoomId(null);
		setDraftRoomName("");
		onConversationSelected();
	};

	const handleStartEditing = (roomId: string, roomName: string) => {
		setEditingRoomId(roomId);
		setDraftRoomName(roomName);
	};

	const handleCancelEditing = () => {
		setEditingRoomId(null);
		setDraftRoomName("");
	};

	const handleRename = async (roomId: string) => {
		const trimmedRoomName = draftRoomName.trim();
		if (!trimmedRoomName) {
			toast.error("Room name cannot be empty.");
			return;
		}

		setIsRenaming(true);
		try {
			await renameRoom(roomId, trimmedRoomName);
			toast.success("Conversation renamed.");
			setEditingRoomId(null);
			setDraftRoomName("");
		} catch (error) {
			console.error("Failed to rename room:", error);
			toast.error("Could not rename conversation.");
		} finally {
			setIsRenaming(false);
		}
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-full justify-start gap-2"
				onClick={() => void handleNewConversation()}
			>
				<PlusIcon className="size-3.5" />
				New conversation
			</Button>

			<ScrollArea className="min-h-0 flex-1 rounded-md border border-border">
				{isLoadingConversations ? (
					<div className="flex items-center justify-center py-8">
						<Spinner />
					</div>
				) : conversations.length === 0 ? (
					<p className="px-4 py-6 text-center text-muted-foreground text-sm">
						No previous conversations yet.
					</p>
				) : (
					conversations.map((room) => {
						const isActive = room.roomId === activeRoomId;
						const isEditing = editingRoomId === room.roomId;

						return (
							<div
								key={room.roomId}
								className={cn(
									"group flex w-full items-start gap-2 border-border border-b px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-accent/50",
									isActive && "bg-accent",
								)}
							>
								{isEditing ? (
									<Input
										value={draftRoomName}
										onChange={(event) =>
											setDraftRoomName(event.target.value)
										}
										onKeyDown={(
											event: KeyboardEvent<HTMLInputElement>,
										) => {
											if (event.key === "Enter") {
												event.preventDefault();
												void handleRename(room.roomId);
											}
											if (event.key === "Escape") {
												event.preventDefault();
												handleCancelEditing();
											}
										}}
										autoFocus
										className="h-8"
										disabled={isRenaming}
									/>
								) : (
									<button
										type="button"
										onClick={() =>
											handleResume(room.roomId)
										}
										className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left"
									>
										<span className="line-clamp-2 w-full font-medium leading-snug">
											{room.roomName ||
												"New conversation"}
										</span>
										<span className="text-muted-foreground text-xs">
											{formatSessionDate(
												room.dateCreated,
											)}
										</span>
									</button>
								)}

								{isEditing ? (
									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Save room name"
											onClick={() =>
												void handleRename(room.roomId)
											}
											disabled={isRenaming}
										>
											<CheckIcon />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Cancel rename"
											onClick={handleCancelEditing}
											disabled={isRenaming}
										>
											<XIcon />
										</Button>
									</div>
								) : (
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label="Rename conversation"
										className="shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
										onClick={() =>
											handleStartEditing(
												room.roomId,
												room.roomName,
											)
										}
									>
										<PencilIcon />
									</Button>
								)}
							</div>
						);
					})
				)}
			</ScrollArea>
		</div>
	);
};
