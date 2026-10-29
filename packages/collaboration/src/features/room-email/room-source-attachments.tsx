import { FileText, Paperclip } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import { Alert, AlertDescription, P, Small } from "@semoss/ui/next";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { stageMailAttachment } from "@/features/connectors/api/microsoft";
import type { SourceAttachment } from "@/features/connectors/types";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import {
	sendsAsText,
	stageThreadAttachment,
} from "@/features/thread-assistant/api/thread-attachments";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";
import { useRoomEmail } from "./room-email.context";

interface RoomSourceAttachmentsProps {
	source: Pick<RoomSource, "threadId" | "kind">;
	message: WorkspaceMessage;
	attachments: SourceAttachment[];
}

/** Source email files open in the room: copied into its folder, then shown in the dock. */
export function RoomSourceAttachments({
	source,
	message,
	attachments,
}: RoomSourceAttachmentsProps) {
	const { session } = useRoomEmail();
	const workbench = useContext(ToolWorkbenchContext);
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	// one copy per attachment; reopening reuses it
	const staged = useRef(new Map<string, string>());
	if (!attachments.length) return null;
	const canOpen = Boolean(workbench) && source.kind !== "sample";

	async function open(attachment: SourceAttachment): Promise<void> {
		if (!workbench || pending) return;
		const key = JSON.stringify([message.id, attachment.id]);
		setError(null);
		let path = staged.current.get(key);
		if (!path) {
			setPending(attachment.id);
			try {
				const { actions, insightId } = session.insight;
				// Brain mail is read under the thread's rules; imported mail through Outlook
				const file = attachment.messageId
					? await stageThreadAttachment(
							actions,
							insightId,
							source.threadId,
							attachment,
							sendsAsText(attachment.name),
						)
					: await stageMailAttachment(
							actions,
							insightId,
							message.id,
							attachment.id,
							attachment.name,
						);
				path = `/${file.filePath}`;
				staged.current.set(key, path);
				workbench.store
					.getState()
					.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
						scope: getFilePanelScope({
							type: "INSIGHT",
							insightId,
						}),
						paths: [path],
					});
			} catch (cause: unknown) {
				setError(
					cause instanceof Error
						? cause.message
						: "The attachment could not be opened.",
				);
				return;
			} finally {
				setPending(null);
			}
		}
		workbench.openFile(path, attachment.name);
	}

	return (
		<section
			aria-label="Attachments"
			className="space-y-3 border-border border-t pt-4"
		>
			<Small className="flex items-center gap-2 font-medium">
				<Paperclip className="size-4" aria-hidden="true" />
				Attachments ({attachments.length})
			</Small>
			<ul className="grid min-w-0 gap-2">
				{attachments.map((attachment) => {
					const content = (
						<>
							<FileText
								className="size-5 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="min-w-0 flex-1 break-words text-sm">
								{attachment.name}
								{pending === attachment.id ? (
									<span className="text-muted-foreground">
										{" "}
										- Opening...
									</span>
								) : (
									!attachment.isFile && (
										<span className="text-muted-foreground">
											{" "}
											- linked file, open in Outlook
										</span>
									)
								)}
							</span>
						</>
					);
					return (
						<li key={`${attachment.id}:${attachment.name}`}>
							{canOpen && attachment.isFile ? (
								<button
									type="button"
									className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
									aria-label={`Open ${attachment.name}`}
									disabled={pending !== null}
									onClick={() => void open(attachment)}
								>
									{content}
								</button>
							) : (
								<div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
									{content}
								</div>
							)}
						</li>
					);
				})}
			</ul>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						<P>{error}</P>
					</AlertDescription>
				</Alert>
			)}
		</section>
	);
}
