import { PaperclipIcon, SendIcon, SquareIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useModelChat } from "@/hooks";
import { isSpawnDrag } from "../../core/workbench-spawn-drag";
import { ModelChatAttachmentStrip } from "./model-chat-attachment-strip";

/**
 * The model chat composer: a card-shelled textarea with a tri-state action
 * button that sends, then stops the streaming turn, then waits for the stop to
 * settle. Enter sends, Shift+Enter inserts a newline.
 *
 * Files can be dropped on the card, picked with the paperclip, or pasted, but
 * only when the engine reports it takes attachments. They are uploaded into
 * the insight space when the turn is sent.
 *
 * @name ModelChatComposer
 * @return The composer.
 */
export const ModelChatComposer = () => {
	const draft = useModelChat((state) => state.draft);
	const setDraft = useModelChat((state) => state.setDraft);
	const send = useModelChat((state) => state.send);
	const stop = useModelChat((state) => state.stop);
	const isSending = useModelChat((state) => state.isSending);
	const isStopping = useModelChat((state) => state.isStopping);
	const isInitializing = useModelChat((state) => state.isInitializing);
	const roomId = useModelChat((state) => state.roomId);
	const error = useModelChat((state) => state.error);
	const dismissError = useModelChat((state) => state.dismissError);
	const pendingFiles = useModelChat((state) => state.pendingFiles);
	const addFiles = useModelChat((state) => state.addFiles);
	const removeFile = useModelChat((state) => state.removeFile);
	const supportsAttachments = useModelChat(
		(state) => state.supportsAttachments,
	);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);

	const isReady = Boolean(roomId) && !isInitializing;
	// `isStopping` outlives `isSending`: send() unwinds as soon as its stream
	// aborts, while stop() is still persisting the cancelled turn. Treating
	// both as busy keeps the button from inviting a second turn mid-commit.
	const isBusy = isSending || isStopping;
	const canSend = isReady && !isBusy && draft.trim().length > 0;
	const canAttach = supportsAttachments && isReady && !isBusy;

	const submit = () => {
		if (!canSend) return;
		void send(draft).finally(() => textareaRef.current?.focus());
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	};

	/** Queue files, surfacing whatever the store refused to take. */
	const queueFiles = (files: File[]) => {
		if (files.length === 0) return;
		const rejection = addFiles(files);
		if (rejection) toast.error(rejection);
	};

	/**
	 * Pasting a screenshot attaches it, but pasting rich text that merely
	 * carries an image (the Office clipboard always does) should paste the
	 * text and leave the image alone.
	 */
	const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
		if (!canAttach) return;

		const pasted = Array.from(event.clipboardData.files);
		if (pasted.length === 0) return;

		const hasText =
			event.clipboardData.types.includes("text/plain") ||
			event.clipboardData.types.includes("text/html");
		const files = hasText
			? pasted.filter((file) => !file.type.startsWith("image/"))
			: pasted;
		if (files.length === 0) return;

		if (!hasText) event.preventDefault();
		queueFiles(files);
	};

	return (
		<div className="mx-auto flex w-full max-w-[1120px] shrink-0 flex-col gap-2 px-4 py-4 sm:px-8 lg:px-16">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						<div className="flex items-start justify-between gap-2">
							<span className="wrap-break-word">{error}</span>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Dismiss error"
								onClick={dismissError}
							>
								<span aria-hidden>×</span>
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/*
			 * The dock drags panels with native HTML5 drags too, so a tab
			 * crossing the composer must not paint a file-drop highlight —
			 * hence the spawn-drag check alongside the "Files" one.
			 */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drop target — the paperclip button is the keyboard path */}
			<div
				className={cn(
					"flex w-full flex-col overflow-hidden rounded-md border border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					isDraggingFiles &&
						"border-primary bg-primary/5 ring-[3px] ring-primary/20",
				)}
				onDragOver={(event) => {
					if (
						!canAttach ||
						isSpawnDrag(event.dataTransfer) ||
						!event.dataTransfer.types.includes("Files")
					) {
						return;
					}
					event.preventDefault();
					setIsDraggingFiles(true);
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
					if (!canAttach || isSpawnDrag(event.dataTransfer)) return;

					const dropped = Array.from(event.dataTransfer.files);
					if (dropped.length === 0) return;
					event.preventDefault();
					queueFiles(dropped);
				}}
			>
				<ModelChatAttachmentStrip
					files={pendingFiles}
					onRemove={removeFile}
					disabled={isBusy}
				/>
				<Textarea
					ref={textareaRef}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					disabled={!isReady}
					placeholder="Ask this model a question"
					aria-label="Message"
					className="max-h-56 min-h-24 resize-none rounded-none border-0 bg-card px-4 py-4 shadow-none focus-visible:ring-0"
					data-testid="model-chat-composer-input"
				/>
				<div className="flex items-center gap-2 bg-card p-2">
					{supportsAttachments && (
						<>
							<input
								ref={fileInputRef}
								type="file"
								multiple
								hidden
								onChange={(event) => {
									const selected = Array.from(
										event.target.files ?? [],
									);
									event.target.value = "";
									queueFiles(selected);
								}}
								data-testid="model-chat-composer-file-input"
							/>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Attach files"
								disabled={!canAttach}
								onClick={() => fileInputRef.current?.click()}
								data-testid="model-chat-composer-attach"
							>
								<PaperclipIcon aria-hidden />
							</Button>
						</>
					)}
					<div className="min-w-0 flex-1" />
					{isBusy ? (
						<Button
							variant="default"
							size="icon-sm"
							aria-label="Stop generating"
							disabled={isStopping}
							onClick={() => void stop()}
							data-testid="model-chat-composer-stop"
						>
							{isStopping ? (
								<Spinner />
							) : (
								<SquareIcon
									className="size-3"
									fill="currentColor"
									aria-hidden
								/>
							)}
						</Button>
					) : (
						<Button
							variant="default"
							size="icon-sm"
							aria-label="Send message"
							disabled={!canSend}
							onClick={submit}
							data-testid="model-chat-composer-send"
						>
							<SendIcon aria-hidden />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
