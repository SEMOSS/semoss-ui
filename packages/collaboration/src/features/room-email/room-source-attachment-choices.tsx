import { Check, FileText, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, Button, P, Spinner } from "@semoss/ui/next";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { SourceAttachment } from "@/features/connectors/types";
import type { UploadedRoomFile } from "@/features/rooms/api/upload-room-files";
import { sendsAsText } from "@/features/thread-assistant/api/thread-attachments";
import { useRoomEmail } from "./room-email.context";
import { stageSourceAttachment } from "./room-source-attachments";

/**
 * The files on a room's source emails that can be copied into the room.
 * Linked cloud files cannot.
 *
 * @param messages - The source emails.
 * @returns Each file with the email it is on.
 */
export function sourceFileAttachments(
	messages: readonly WorkspaceMessage[],
): { message: WorkspaceMessage; attachment: SourceAttachment }[] {
	return messages.flatMap((message) =>
		(message.attachments ?? [])
			.filter((attachment) => attachment.isFile)
			.map((attachment) => ({ message, attachment })),
	);
}

interface RoomSourceAttachmentChoicesProps {
	/** Files already queued for the next message. */
	queued: readonly UploadedRoomFile[];
	/** Queue a copied file for the next message. */
	onAdd: (file: UploadedRoomFile) => void;
}

/** The source email's files, offered from the composer's + menu; each one added goes with the next message. */
export function RoomSourceAttachmentChoices({
	queued,
	onAdd,
}: RoomSourceAttachmentChoicesProps) {
	const { source, sourceMessages, session } = useRoomEmail();
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// one copy per attachment; adding it again after removing its chip reuses it
	const copies = useRef(new Map<string, UploadedRoomFile>());
	if (!source) return null;
	const queuedPaths = new Set(queued.map((file) => file.fileLocation));

	async function add(
		message: WorkspaceMessage,
		attachment: SourceAttachment,
		key: string,
	): Promise<void> {
		if (pending || !source) return;
		setError(null);
		let file = copies.current.get(key);
		if (!file) {
			setPending(key);
			try {
				const asText = sendsAsText(attachment.name);
				const staged = await stageSourceAttachment(
					session,
					source.threadId,
					message.id,
					attachment,
					asText,
				);
				// most providers reject Office and mail files, so one goes as its text or not at all
				if (asText && !staged.textPath)
					throw new Error(
						staged.textError ??
							`The text of ${attachment.name} could not be read.`,
					);
				file = staged.textPath
					? {
							fileLocation: staged.textPath,
							fileName: `${staged.name} (text)`,
						}
					: { fileLocation: staged.filePath, fileName: staged.name };
				copies.current.set(key, file);
			} catch (cause: unknown) {
				setError(
					cause instanceof Error
						? cause.message
						: "The attachment could not be added.",
				);
				return;
			} finally {
				setPending(null);
			}
		}
		onAdd(file);
	}

	return (
		<div className="space-y-3">
			<P className="text-muted-foreground text-sm">
				Files you add go with your next message.
			</P>
			<ul className="grid min-w-0 gap-2">
				{sourceFileAttachments(sourceMessages).map(
					({ message, attachment }) => {
						const key = JSON.stringify([message.id, attachment.id]);
						const copy = copies.current.get(key);
						const isQueued = Boolean(
							copy && queuedPaths.has(copy.fileLocation),
						);
						return (
							<li
								key={key}
								className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
							>
								<FileText
									className="size-5 shrink-0 text-muted-foreground"
									aria-hidden="true"
								/>
								<span className="min-w-0 flex-1 break-words text-sm">
									{attachment.name}
								</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="pointer-coarse:min-h-11"
									disabled={pending !== null || isQueued}
									aria-label={
										isQueued
											? `${attachment.name} added`
											: `Add ${attachment.name}`
									}
									onClick={() =>
										void add(message, attachment, key)
									}
								>
									{pending === key ? (
										<Spinner />
									) : isQueued ? (
										<Check aria-hidden="true" />
									) : (
										<Plus aria-hidden="true" />
									)}
									{isQueued ? "Added" : "Add"}
								</Button>
							</li>
						);
					},
				)}
			</ul>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						<P>{error}</P>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
