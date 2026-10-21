import { useId, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	z,
} from "@semoss/ui/next";
import { playgroundRoomsSchema } from "@/features/rooms/api/room-schemas";
import { pixel } from "@/lib/pixel";
import { saveTopicSource } from "./topic-sources.api";

const filesSchema = z.object({
	roomId: z.string(),
	files: z.array(
		z.object({
			name: z.string(),
			path: z.string(),
			size: z.number().nullish(),
		}),
	),
});

interface ImportChatSourceDialogProps {
	topicId: string;
	onSubmit: (id?: string) => void;
}

/** Promote a saved chat file, including a downloaded M365 file, to a durable topic copy. */
export function ImportChatSourceDialog({
	topicId,
	onSubmit,
}: ImportChatSourceDialogProps) {
	const { actions } = useInsight();
	const selectId = useId();
	const rooms = usePixel<unknown>(
		pixel("GetPlaygroundRooms", {
			mode: "collaboration",
			sort: ["DESC"],
			limit: 100,
			includeUnnamedRooms: true,
		}),
	);
	const [roomId, setRoomId] = useState("");
	const files = usePixel<unknown>(
		roomId ? pixel("BrainListTopicSourceFiles", { roomId }) : "",
	);
	const [pendingPath, setPendingPath] = useState("");
	const [error, setError] = useState("");
	const parsedRooms = playgroundRoomsSchema.safeParse(rooms.data);
	const parsedFiles = filesSchema.safeParse(files.data);
	const choices =
		rooms.status === "SUCCESS" && parsedRooms.success
			? parsedRooms.data
			: [];
	const available =
		files.status === "SUCCESS" &&
		parsedFiles.success &&
		parsedFiles.data.roomId === roomId
			? parsedFiles.data.files
			: null;
	const readError =
		rooms.status === "ERROR"
			? rooms.error?.message
			: files.status === "ERROR"
				? files.error?.message
				: rooms.status === "SUCCESS" && !parsedRooms.success
					? "Could not read your chats."
					: files.status === "SUCCESS" && !available
						? "Could not read the selected chat's files."
						: "";
	const handleImport = async (path: string, name: string): Promise<void> => {
		setPendingPath(path);
		setError("");
		let id: string;
		try {
			id = await saveTopicSource(actions, {
				topicId,
				roomId,
				filePath: path,
				title: name,
				kind: "document",
			});
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not import this file.",
			);
			setPendingPath("");
			return;
		}
		setPendingPath("");
		onSubmit(id);
	};
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !pendingPath) onSubmit();
			}}
		>
			<DialogContent
				className="max-h-dvh overflow-y-auto"
				showCloseButton={!pendingPath}
				onEscapeKeyDown={(event) => {
					if (pendingPath) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (pendingPath) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Add a file from a chat</DialogTitle>
					<DialogDescription>
						Create a saved copy for this topic. Files downloaded
						from Microsoft 365 into the chat can be added here too.
						Copies do not follow changes or access updates to the
						original.
					</DialogDescription>
				</DialogHeader>
				{rooms.status === "LOADING" && (
					<Spinner aria-label="Loading chats" />
				)}
				<Label htmlFor={selectId}>Chat</Label>
				<Select
					value={roomId}
					disabled={!!pendingPath}
					onValueChange={(id) => {
						setRoomId(id);
						setError("");
					}}
				>
					<SelectTrigger id={selectId}>
						<SelectValue placeholder="Choose a chat" />
					</SelectTrigger>
					<SelectContent>
						{choices.map((room) => (
							<SelectItem key={room.ROOM_ID} value={room.ROOM_ID}>
								{room.ROOM_NAME || "Untitled chat"}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{rooms.status === "SUCCESS" && choices.length === 0 && (
					<P className="text-muted-foreground text-sm">
						No saved chats yet.
					</P>
				)}
				{files.status === "LOADING" && (
					<Spinner aria-label="Loading chat files" />
				)}
				{(error || readError) && (
					<Alert variant="destructive">
						<AlertDescription>
							{error || readError}
						</AlertDescription>
						{readError && (
							<Button
								variant="outline"
								onClick={() => {
									rooms.refresh();
									if (roomId) files.refresh();
								}}
							>
								Retry
							</Button>
						)}
					</Alert>
				)}
				{available?.length === 0 && (
					<P className="text-muted-foreground text-sm">
						No files in this chat. Save or upload a file in the chat
						first.
					</P>
				)}
				{available && (
					<ul className="divide-y divide-border">
						{available.map((file) => (
							<li
								key={file.path}
								className="flex min-w-0 flex-wrap items-center gap-3 py-3"
							>
								<P className="min-w-0 flex-1 break-words text-sm">
									{file.name}
								</P>
								<Button
									variant="outline"
									aria-label={`Add to topic: ${file.name}`}
									disabled={!!pendingPath}
									onClick={() =>
										void handleImport(file.path, file.name)
									}
								>
									{pendingPath === file.path
										? "Adding…"
										: "Add to topic"}
									<span className="sr-only">
										: {file.name}
									</span>
								</Button>
							</li>
						))}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	);
}
