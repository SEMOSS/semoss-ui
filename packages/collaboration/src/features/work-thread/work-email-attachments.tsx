import { Download, Eye, FileText, Paperclip, X } from "lucide-react";
import { useContext, useRef, useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription, Button, P, Small } from "@semoss/ui/next";
import { formatByteSize } from "@semoss/utility";
import type { SourceAttachment } from "@/features/connectors/types";
import { sendsAsText } from "@/features/thread-assistant/api/thread-attachments";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";
import { useWorkEmail } from "./work-email.context";
import { WorkThreadContext } from "./work-thread-context";

/** The composer's own limit on files per message. */
const MAX_SELECTED = 5;

/** Props for {@link WorkEmailAttachments}. */
interface WorkEmailAttachmentsProps {
	/** The email's attachments as the thread read listed them. */
	attachments: SourceAttachment[];
	/** Opens the email in Outlook, where links and attached emails can be read. */
	webLink?: string;
}

/**
 * One email's attachments. Nothing is read until a person chooses Open,
 * Download, or Attach; Attach only queues the file for the next request.
 */
export function WorkEmailAttachments({
	attachments,
	webLink,
}: WorkEmailAttachmentsProps) {
	const { thread, composer } = useWorkEmail();
	const threadContext = useContext(WorkThreadContext);
	const workbench = useContext(ToolWorkbenchContext);
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState("");
	const isBusy = useRef(false);
	if (!attachments.length) return null;
	const session = threadContext?.session;
	const sourceUid =
		thread.source?.kind === "outlook" ? thread.source.nativeId : undefined;
	const selected = memory.selected;

	async function handleFile(
		attachment: SourceAttachment,
		action: "open" | "download",
	): Promise<void> {
		if (!session || isBusy.current) return;
		isBusy.current = true;
		setPending(attachment.id);
		setError(null);
		setStatus("");
		try {
			if (action === "open") {
				if (!workbench)
					throw new Error("The file viewer is unavailable.");
				const preview = await session.previewAttachment(
					sourceUid,
					attachment,
				);
				workbench.openFile(
					preview.path,
					preview.name,
					preview.insightId,
				);
				setStatus(`${attachment.name} is open in the side panel.`);
			} else {
				await session.downloadAttachment(sourceUid, attachment);
				setStatus(`Download requested for ${attachment.name}.`);
			}
		} catch (cause: unknown) {
			setError(
				cause instanceof Error
					? cause.message
					: "The attachment could not be read.",
			);
		} finally {
			isBusy.current = false;
			setPending(null);
		}
	}

	function handleToggle(attachment: SourceAttachment): void {
		const isAttached = selected.includes(attachment.id);
		composer.setSelected(
			isAttached
				? selected.filter((id) => id !== attachment.id)
				: [...selected, attachment.id],
		);
		setStatus(
			isAttached
				? `${attachment.name} will not be sent.`
				: `${attachment.name} will go to Assistant with your next message.`,
		);
	}

	return (
		<section
			aria-label="Attachments"
			className="space-y-3 border-border border-t pt-4"
		>
			<Small className="flex items-center gap-2 font-medium">
				<Paperclip className="size-4" aria-hidden="true" />
				Attachments · {attachments.length}
			</Small>
			<ul className="grid min-w-0 gap-2">
				{attachments.map((attachment) => {
					const isAttached = selected.includes(attachment.id);
					const details = [
						attachment.size === undefined
							? ""
							: formatByteSize(attachment.size),
						attachment.isFile
							? sendsAsText(attachment.name)
								? "Assistant reads its text"
								: ""
							: "Linked or attached email",
					].filter(Boolean);
					return (
						<li
							key={attachment.id}
							className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 p-3"
						>
							<FileText
								className="size-5 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<P className="break-words font-medium text-sm">
									{attachment.name}
								</P>
								{details.length > 0 && (
									<Small className="block text-muted-foreground">
										{details.join(" · ")}
									</Small>
								)}
							</div>
							{attachment.isFile && session ? (
								<div className="flex flex-wrap gap-2">
									{workbench && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="pointer-coarse:min-h-11"
											disabled={pending !== null}
											aria-label={`Open ${attachment.name}`}
											onClick={() =>
												void handleFile(
													attachment,
													"open",
												)
											}
										>
											<Eye aria-hidden="true" />
											{pending === attachment.id
												? "Opening…"
												: "Open"}
										</Button>
									)}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="pointer-coarse:min-h-11"
										disabled={pending !== null}
										aria-label={`Download ${attachment.name}`}
										onClick={() =>
											void handleFile(
												attachment,
												"download",
											)
										}
									>
										<Download aria-hidden="true" />
										Download
									</Button>
									<Button
										type="button"
										variant={
											isAttached ? "secondary" : "outline"
										}
										size="sm"
										className="pointer-coarse:min-h-11"
										disabled={
											memory.isSubmitting ||
											(!isAttached &&
												selected.length >= MAX_SELECTED)
										}
										aria-pressed={isAttached}
										aria-label={
											isAttached
												? `Remove ${attachment.name} from your next message`
												: `Attach ${attachment.name} to your next message`
										}
										onClick={() => handleToggle(attachment)}
									>
										{isAttached ? (
											<X aria-hidden="true" />
										) : (
											<Paperclip aria-hidden="true" />
										)}
										{isAttached ? "Attached" : "Attach"}
									</Button>
								</div>
							) : !attachment.isFile && webLink ? (
								<Button
									variant="ghost"
									size="sm"
									className="pointer-coarse:min-h-11"
									asChild
								>
									<a
										href={webLink}
										target="_blank"
										rel="noreferrer"
										aria-label={`Open ${attachment.name} in Outlook`}
									>
										Open in Outlook
									</a>
								</Button>
							) : null}
						</li>
					);
				})}
			</ul>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<output className="block text-muted-foreground text-sm">
				{status}
			</output>
		</section>
	);
}
