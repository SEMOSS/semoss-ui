import { PaperclipIcon, SendIcon, XIcon } from "lucide-react";
import type {
	ChangeEvent,
	ClipboardEvent,
	FormEvent,
	KeyboardEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import { WorkbenchChatUsage } from "./workbench-chat-usage";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** One pending file attachment queued in the composer. */
interface PendingFile {
	/** Stable client-generated ID used for removal and reconciliation */
	id: string;

	/** The queued file itself */
	file: File;

	/** Object URL for image previews; undefined for non-image files. */
	previewUrl?: string;
}

interface PendingFileStripProps {
	/** Pending attachments queued in the composer */
	files: PendingFile[];

	/** Called with the attachment ID when the user removes it */
	onRemove: (id: string) => void;

	/** Disables the remove buttons (e.g. while a message is sending) */
	disabled: boolean;
}

/**
 * Strip of pending attachments above the textarea: image files render as
 * thumbnails with a hover remove button, other files render as chips.
 * Renders nothing when no files are queued.
 *
 * @name PendingFileStrip
 * @param files - Pending attachments queued in the composer.
 * @param onRemove - Called with the attachment ID when the user removes it.
 * @param disabled - Disables the remove buttons while sending.
 * @return The attachment strip, or null when empty.
 */
const PendingFileStrip = ({
	files,
	onRemove,
	disabled,
}: PendingFileStripProps) => {
	if (files.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2 px-3 pt-3">
			{files.map((attachment) =>
				attachment.previewUrl ? (
					<div
						key={attachment.id}
						className="group relative size-12 shrink-0 overflow-hidden rounded-md border border-border"
						title={attachment.file.name}
					>
						<img
							src={attachment.previewUrl}
							alt={attachment.file.name}
							className="h-full w-full object-cover"
						/>
						<button
							type="button"
							disabled={disabled}
							onClick={() => onRemove(attachment.id)}
							aria-label={`Remove ${attachment.file.name}`}
							className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-background text-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
						>
							<XIcon className="size-3" />
						</button>
					</div>
				) : (
					<span
						key={attachment.id}
						className="inline-flex max-w-48 items-center gap-1 rounded-sm border border-border bg-background/70 px-2 py-1 text-xs"
						title={attachment.file.name}
					>
						<PaperclipIcon className="size-3 shrink-0" />
						<span className="min-w-0 truncate">
							{attachment.file.name}
						</span>
						<button
							type="button"
							disabled={disabled}
							onClick={() => onRemove(attachment.id)}
							aria-label={`Remove ${attachment.file.name}`}
							className="shrink-0 text-muted-foreground hover:text-foreground"
						>
							<XIcon className="size-3" />
						</button>
					</span>
				),
			)}
		</div>
	);
};

/**
 * The CHAT panel footer: pending file attachments, the prompt textarea with
 * attach/usage affordances (file picker, paste, and drag-and-drop), and the
 * send/stop button. Enter sends (Shift+Enter inserts a newline), a failed
 * submit restores the draft and its attachments, and image previews revoke
 * their object URLs on removal, send, and unmount.
 *
 * @name WorkbenchChatComposer
 * @return The chat composer footer.
 */
export const WorkbenchChatComposer = () => {
	const roomId = useWorkbench((state) => state.chat.roomId);
	const isInitializing = useWorkbench((state) => state.chat.isInitializing);
	const isSending = useWorkbench((state) => state.chat.isSending);
	const submit = useWorkbench((state) => state.chat.submit);

	const [draft, setDraft] = useState("");
	const [files, setFiles] = useState<PendingFile[]>([]);
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const filesRef = useRef<PendingFile[]>([]);

	const isComposerDisabled = isInitializing || !roomId;
	const isSendDisabled = (!draft.trim() && files.length === 0) || isSending;

	useEffect(() => {
		filesRef.current = files;
	}, [files]);

	// Revoke every outstanding preview URL when the composer unmounts.
	useEffect(
		() => () => {
			for (const attachment of filesRef.current) {
				if (attachment.previewUrl) {
					URL.revokeObjectURL(attachment.previewUrl);
				}
			}
		},
		[],
	);

	const queueFiles = useCallback((selected: File[]) => {
		if (selected.length === 0) return;

		const oversized = selected.filter(
			(file) => file.size > MAX_FILE_SIZE_BYTES,
		);
		if (oversized.length > 0) {
			toast.error("Each file must be 10 MB or smaller.");
		}

		const accepted = selected.filter(
			(file) => file.size <= MAX_FILE_SIZE_BYTES,
		);
		setFiles((current) => {
			const remaining = MAX_ATTACHMENTS - current.length;
			if (remaining <= 0) {
				toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
				return current;
			}
			if (accepted.length > remaining) {
				toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
			}
			return [
				...current,
				...accepted.slice(0, remaining).map((file) => ({
					id: crypto.randomUUID(),
					file,
					previewUrl: file.type.startsWith("image/")
						? URL.createObjectURL(file)
						: undefined,
				})),
			];
		});
	}, []);

	const removePendingFile = useCallback((id: string) => {
		setFiles((current) => {
			const removed = current.find((attachment) => attachment.id === id);
			if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
			return current.filter((attachment) => attachment.id !== id);
		});
	}, []);

	const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
		const selected = Array.from(event.target.files ?? []);
		event.target.value = "";
		queueFiles(selected);
	};

	const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
		const clipboardFiles = Array.from(event.clipboardData.files);
		if (clipboardFiles.length === 0) return;

		// When text rides along (e.g. copying from a document), let the text
		// paste through and attach only the non-image files; a bare file paste
		// (screenshot, file from the OS) attaches everything.
		const hasText =
			event.clipboardData.types.includes("text/plain") ||
			event.clipboardData.types.includes("text/html");
		const filesToAttach = hasText
			? clipboardFiles.filter((file) => !file.type.startsWith("image/"))
			: clipboardFiles;
		if (filesToAttach.length === 0) return;

		if (!hasText) {
			event.preventDefault();
		}
		queueFiles(filesToAttach);
	};

	const handleSend = async () => {
		if (isSendDisabled || isComposerDisabled) return;

		const submittedDraft = draft;
		const submittedFiles = files;

		setDraft("");

		const ok = await submit(
			submittedDraft,
			submittedFiles.map((attachment) => attachment.file),
		);
		if (ok) {
			for (const attachment of submittedFiles) {
				if (attachment.previewUrl) {
					URL.revokeObjectURL(attachment.previewUrl);
				}
			}
			setFiles((current) =>
				current.filter(
					(attachment) =>
						!submittedFiles.some(
							(submitted) => submitted.id === attachment.id,
						),
				),
			);
		} else {
			setDraft((current) =>
				current.trim()
					? `${submittedDraft.trimEnd()} ${current}`.trim()
					: submittedDraft,
			);
		}
		textareaRef.current?.focus();
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void handleSend();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.nativeEvent.isComposing) {
			return;
		}

		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void handleSend();
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="shrink-0 bg-background p-3 pt-1"
			onDragOver={(event) => {
				if (event.dataTransfer.types.includes("Files")) {
					event.preventDefault();
					setIsDraggingFiles(true);
				}
			}}
			onDragLeave={(event) => {
				const nextTarget = event.relatedTarget;
				if (
					nextTarget instanceof Node &&
					event.currentTarget.contains(nextTarget)
				) {
					return;
				}
				setIsDraggingFiles(false);
			}}
			onDrop={(event) => {
				setIsDraggingFiles(false);
				const droppedFiles = Array.from(event.dataTransfer.files);
				if (droppedFiles.length > 0) {
					event.preventDefault();
					queueFiles(droppedFiles);
				}
			}}
		>
			<div
				className={cn(
					"flex w-full flex-col overflow-hidden rounded-md border border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					isDraggingFiles &&
						"border-primary bg-primary/5 ring-[3px] ring-primary/20",
				)}
			>
				<PendingFileStrip
					files={files}
					onRemove={removePendingFile}
					disabled={isSending}
				/>

				<Textarea
					ref={textareaRef}
					value={draft}
					aria-label="Chat message"
					placeholder="What do you want to do?"
					disabled={isComposerDisabled}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					className="max-h-56 min-h-24 w-full resize-none border-0 bg-card px-4 py-3 shadow-none focus-visible:ring-0"
				/>

				<div className="flex items-center gap-2 bg-card p-2">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						onChange={handleFileSelection}
						className="hidden"
						aria-label="Attach files"
					/>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={
									isComposerDisabled ||
									isSending ||
									files.length >= MAX_ATTACHMENTS
								}
								onClick={() => fileInputRef.current?.click()}
								aria-label="Attach files"
							>
								<PaperclipIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Attach files</TooltipContent>
					</Tooltip>

					<WorkbenchChatUsage />

					<div className="min-w-0 flex-1" />

					<Button
						type="submit"
						size="icon-sm"
						disabled={isSendDisabled || isComposerDisabled}
						aria-label="Send message"
					>
						{isSending ? (
							<Spinner className="size-4" />
						) : (
							<SendIcon />
						)}
					</Button>
				</div>
			</div>
		</form>
	);
};
