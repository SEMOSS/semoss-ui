import { OverflowNode } from "@lexical/overflow";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	type LexicalEditor,
} from "lexical";
import {
	Mic,
	Paperclip,
	Plus,
	Send,
	Settings2,
	Sparkles,
	Square,
	Undo,
	WandSparkles,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { type Engine, EngineSelect, type MCPConfig } from "@semoss/shared";
import {
	Button,
	cn,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ComposerSubmission, RoomSettings } from "../types/room";
import { RoomComposerEnterPlugin } from "./room-composer-enter-plugin";
import { RoomComposerFiles } from "./room-composer-files";
import { RoomComposerPasteScrollPlugin } from "./room-composer-paste-scroll-plugin";
import {
	RoomComposerSlashPlugin,
	type RoomSlashCommand,
} from "./room-composer-slash-plugin";
import { RoomSettingsDialog } from "./room-settings-dialog";

interface RoomComposerProps {
	/** Optional caller-owned controls rendered in the composer toolbar. */
	children?: ReactNode;
	/** Classes applied to the composer root. */
	className?: string;
	/** Classes applied to the editable message surface. */
	inputClassName?: string;
	/** Name used to label the message input and send action. */
	agentName: string;
	/** Whether a message submission is in progress. */
	isSubmitting: boolean;
	/** Whether the agent is currently producing a response. */
	isRunning: boolean;
	/** Whether cancellation is in progress. */
	isCancelling: boolean;
	/** Selected model identifier; an empty value disables sending. */
	modelId: string;
	/** Selected model display name. */
	modelName: string;
	/** Whether the selected model is being persisted. */
	isModelSaving: boolean;
	/** Whether the model selector is locked. */
	isModelLocked?: boolean;
	/** Whether the model selector is rendered in the toolbar. */
	showModelSelector?: boolean;
	/** Additional caller-owned reason that sending is unavailable. */
	isSendDisabled?: boolean;
	/** Model selection error displayed with the composer. */
	modelError: Error | null;
	/** Agent instructions supplied to prompt optimization. */
	roomInstructions: string;
	/** Room-authored settings currently applied to this conversation. */
	roomSettings: RoomSettings;
	/** Agent resources that remain active but cannot be removed from the room. */
	inheritedMcp: MCPConfig[];
	/** Whether opening room settings is temporarily unavailable. */
	isSettingsDisabled?: boolean;
	/** Persists a newly selected model. */
	onModelChange: (engine: Engine) => Promise<void>;
	/** Persists room-only instructions and resources. */
	onSaveRoomSettings: (settings: RoomSettings) => Promise<void>;
	/** Optimizes the current draft. */
	onOptimizePrompt: (draft: string, instructions: string) => Promise<string>;
	/** Submits a message and any attachments. */
	onSend: (submission: ComposerSubmission) => Promise<void>;
	/** Stops the active response. */
	onStop: () => Promise<void>;
	/** Called after a message is sent successfully. */
	onSent?: () => void;
}

const MAX_CHARACTERS = 8_000;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const initialConfig = {
	namespace: "CollaborationRoomComposer",
	theme: {
		paragraph: "m-0",
	},
	nodes: [OverflowNode],
	onError(error: Error) {
		throw error;
	},
};

function errorMessage(cause: unknown) {
	return cause instanceof Error
		? cause.message
		: "The message could not be sent. Please try again.";
}

function writeEditorText(editor: LexicalEditor | null, text: string) {
	if (!editor) return;
	editor.update(() => {
		const root = $getRoot();
		root.clear();
		for (const line of text.split("\n")) {
			root.append($createParagraphNode().append($createTextNode(line)));
		}
		root.selectEnd();
	});
}

function tooltipButton(
	label: string,
	button: React.ReactElement,
	content = label,
) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
}

/** Collaboration-native Lexical composer for room and landing surfaces. */
export function RoomComposer({
	children,
	className,
	inputClassName,
	agentName,
	isSubmitting,
	isRunning,
	isCancelling,
	modelId,
	modelName,
	isModelSaving,
	isModelLocked = false,
	showModelSelector = true,
	isSendDisabled = false,
	modelError,
	roomInstructions,
	roomSettings,
	inheritedMcp,
	isSettingsDisabled = false,
	onModelChange,
	onSaveRoomSettings,
	onOptimizePrompt,
	onSend,
	onStop,
	onSent,
}: RoomComposerProps) {
	const editorRef = useRef<LexicalEditor | null>(null);
	const scrollViewportRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const actionsTriggerRef = useRef<HTMLButtonElement | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const submittingRef = useRef(false);
	const draftRef = useRef("");
	const [draft, setDraft] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState("");
	const [submissionError, setSubmissionError] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [canDictate, setCanDictate] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);
	const [originalDraft, setOriginalDraft] = useState<string | null>(null);
	const [isActionsOpen, setIsActionsOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	draftRef.current = draft;

	const focusEditor = useCallback(() => {
		requestAnimationFrame(() => editorRef.current?.focus());
	}, []);

	const setEditorText = useCallback((text: string) => {
		draftRef.current = text;
		writeEditorText(editorRef.current, text);
		setDraft(text);
	}, []);

	const addFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFiles((current) => {
			const known = new Set(
				current.map(
					(file) => `${file.name}-${file.size}-${file.lastModified}`,
				),
			);
			const unique = incoming.filter(
				(file) =>
					!known.has(
						`${file.name}-${file.size}-${file.lastModified}`,
					),
			);
			if (unique.some((file) => file.size > MAX_FILE_SIZE)) {
				setFileError("Each attachment must be 10 MiB or smaller.");
				return current;
			}
			if (current.length + unique.length > MAX_FILES) {
				setFileError("You can attach up to five files.");
				return current;
			}
			setFileError("");
			return [...current, ...unique];
		});
	}, []);

	const submit = useCallback(
		async (
			text = draftRef.current,
			submittedFiles = files,
			clearDraft = true,
		) => {
			const trimmed = text.trim();
			if (
				!trimmed ||
				!modelId ||
				isModelSaving ||
				isRunning ||
				isSubmitting ||
				isSendDisabled ||
				submittingRef.current
			) {
				return;
			}

			submittingRef.current = true;
			setSubmissionError("");
			const previousDraft = draftRef.current;
			const previousFiles = files;
			if (clearDraft) {
				setEditorText("");
				setFiles([]);
				setOriginalDraft(null);
			}

			try {
				await onSend({ text: trimmed, files: submittedFiles });
				onSent?.();
			} catch (cause) {
				if (clearDraft) {
					setEditorText(previousDraft);
					setFiles(previousFiles);
				}
				setSubmissionError(errorMessage(cause));
				focusEditor();
			} finally {
				submittingRef.current = false;
			}
		},
		[
			files,
			focusEditor,
			isRunning,
			isSendDisabled,
			isSubmitting,
			isModelSaving,
			modelId,
			onSend,
			onSent,
			setEditorText,
		],
	);

	const optimize = useCallback(
		async (source = draftRef.current) => {
			const current = source.trim();
			if (!current || isOptimizing || isRunning) return;
			setIsOptimizing(true);
			setSubmissionError("");
			try {
				const optimized = await onOptimizePrompt(
					current,
					roomInstructions,
				);
				setOriginalDraft(source);
				setEditorText(optimized);
				focusEditor();
			} catch (cause) {
				setSubmissionError(errorMessage(cause));
				focusEditor();
			} finally {
				setIsOptimizing(false);
			}
		},
		[
			focusEditor,
			isOptimizing,
			isRunning,
			onOptimizePrompt,
			roomInstructions,
			setEditorText,
		],
	);

	const revertOptimization = useCallback(() => {
		if (originalDraft === null) return;
		setEditorText(originalDraft);
		setOriginalDraft(null);
		focusEditor();
	}, [focusEditor, originalDraft, setEditorText]);

	useEffect(() => {
		const Recognition =
			window.SpeechRecognition ?? window.webkitSpeechRecognition;
		setCanDictate(Boolean(Recognition));
		if (!Recognition) return;

		const recognition = new Recognition();
		recognition.continuous = true;
		recognition.interimResults = false;
		recognition.lang = navigator.language || "en-US";
		recognition.onstart = () => setIsListening(true);
		recognition.onresult = (event) => {
			let transcript = "";
			for (
				let index = event.resultIndex;
				index < event.results.length;
				index++
			) {
				if (event.results[index].isFinal) {
					transcript += event.results[index][0]?.transcript ?? "";
				}
			}
			if (!transcript.trim()) return;
			const current = draftRef.current;
			const separator = current && !current.endsWith(" ") ? " " : "";
			setEditorText(`${current}${separator}${transcript.trim()}`);
		};
		recognition.onerror = (event) => {
			setIsListening(false);
			if (event.error !== "aborted") {
				setSubmissionError(
					event.message || "Speech recognition could not continue.",
				);
			}
			focusEditor();
		};
		recognition.onend = () => {
			setIsListening(false);
			focusEditor();
		};
		recognitionRef.current = recognition;

		return () => {
			recognition.onstart = null;
			recognition.onresult = null;
			recognition.onerror = null;
			recognition.onend = null;
			recognition.stop();
			recognitionRef.current = null;
		};
	}, [focusEditor, setEditorText]);

	const toggleDictation = useCallback(() => {
		try {
			if (isListening) recognitionRef.current?.stop();
			else recognitionRef.current?.start();
		} catch (cause) {
			setIsListening(false);
			setSubmissionError(errorMessage(cause));
			focusEditor();
		}
	}, [focusEditor, isListening]);

	const openFilePicker = useCallback(() => {
		setIsActionsOpen(false);
		requestAnimationFrame(() => fileInputRef.current?.click());
	}, []);

	const openSettings = useCallback(() => {
		setIsActionsOpen(false);
		setIsSettingsOpen(true);
	}, []);

	const slashCommands = useMemo<RoomSlashCommand[]>(
		() => [
			{
				id: "document",
				label: "/document",
				description: "Attach a document to this message",
				icon: Paperclip,
				onSelect: openFilePicker,
			},
			{
				id: "optimize",
				label: "/optimize",
				description: "Improve the current prompt",
				icon: WandSparkles,
				disabled: !draft.trim() || isOptimizing,
				onSelect: (text) => void optimize(text),
			},
		],
		[draft, isOptimizing, openFilePicker, optimize],
	);

	const alert = fileError || submissionError || modelError?.message;
	const sendDisabled =
		!draft.trim() ||
		!modelId ||
		isSubmitting ||
		isModelSaving ||
		isSendDisabled;

	return (
		<div
			data-slot="room-composer"
			className={cn("shrink-0 bg-background", className)}
		>
			<fieldset
				aria-label="Message composer drop area"
				className={cn(
					"relative m-0 min-w-0 overflow-hidden rounded-md border border-input bg-card p-0 transition-[color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					isDragging && "border-primary ring-2 ring-primary/20",
				)}
				onDragEnter={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragOver={(event) => event.preventDefault()}
				onDragLeave={(event) => {
					if (
						!event.currentTarget.contains(
							event.relatedTarget as Node | null,
						)
					) {
						setIsDragging(false);
					}
				}}
				onDrop={(event) => {
					event.preventDefault();
					setIsDragging(false);
					addFiles(Array.from(event.dataTransfer.files));
					focusEditor();
				}}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="sr-only"
					aria-label="Choose attachments"
					onChange={(event) => {
						addFiles(Array.from(event.target.files ?? []));
						event.target.value = "";
						focusEditor();
					}}
				/>
				<RoomComposerFiles
					files={files}
					onRemove={(index) =>
						setFiles((current) =>
							current.filter(
								(_, fileIndex) => fileIndex !== index,
							),
						)
					}
				/>
				<LexicalComposer initialConfig={initialConfig}>
					<ScrollArea
						className="max-h-64 min-h-20"
						viewportRef={(element) => {
							scrollViewportRef.current = element;
						}}
					>
						<PlainTextPlugin
							contentEditable={
								<ContentEditable
									aria-label={`Message ${agentName}`}
									className={cn(
										"min-h-20 px-3 py-3 text-base outline-none sm:px-4",
										inputClassName,
									)}
									onPaste={(event) => {
										const pastedFiles = Array.from(
											event.clipboardData.items,
										)
											.filter(
												(item) => item.kind === "file",
											)
											.map((item) => item.getAsFile())
											.filter(
												(file): file is File =>
													file !== null,
											);
										if (pastedFiles.length > 0)
											addFiles(pastedFiles);
									}}
								/>
							}
							placeholder={
								<P className="pointer-events-none absolute top-3 left-3 text-muted-foreground sm:left-4">
									Message {agentName}…
								</P>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
					</ScrollArea>
					<div className="flex min-w-0 items-center gap-2 bg-card p-2">
						<Popover
							open={isActionsOpen}
							onOpenChange={setIsActionsOpen}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<PopoverTrigger asChild>
										<Button
											ref={actionsTriggerRef}
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Open composer actions"
										>
											<Plus aria-hidden="true" />
										</Button>
									</PopoverTrigger>
								</TooltipTrigger>
								<TooltipContent>Add</TooltipContent>
							</Tooltip>
							<PopoverContent align="start" className="w-48 p-1">
								<Button
									type="button"
									variant="ghost"
									className="min-h-10 w-full justify-start"
									onClick={openFilePicker}
								>
									<Paperclip aria-hidden="true" />
									Attach files
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="min-h-10 w-full justify-start"
									disabled={isSettingsDisabled}
									onClick={openSettings}
								>
									<Settings2 aria-hidden="true" />
									Open settings
								</Button>
							</PopoverContent>
						</Popover>
						<div className="flex min-w-0 flex-1 items-center gap-2">
							{children}
							<div className="ms-auto flex min-w-0 flex-1 items-center justify-end gap-1 sm:max-w-72 sm:gap-2">
								{showModelSelector && (
									<div className="min-w-0 flex-1 sm:max-w-52">
										<EngineSelect
											className="h-8 w-full gap-0.5 border-none bg-transparent px-2 py-1 text-xs shadow-none hover:bg-accent dark:hover:bg-accent/50"
											name={modelName}
											value={modelId}
											disabled={
												isRunning ||
												isSubmitting ||
												isModelSaving ||
												isModelLocked
											}
											engineTypes={["MODEL"]}
											metaFilters={[
												{ tag: "text-generation" },
											]}
											showEngineIcon={false}
											onChange={(engine) =>
												void onModelChange(engine)
											}
											popoverContentProps={{
												align: "end",
											}}
										/>
									</div>
								)}
								{tooltipButton(
									isListening
										? "Stop dictation"
										: "Start dictation",
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label={
											isListening
												? "Stop dictation"
												: "Start dictation"
										}
										disabled={!canDictate}
										onClick={toggleDictation}
									>
										<Mic
											aria-hidden="true"
											className={cn(
												isListening &&
													"animate-pulse text-destructive",
											)}
										/>
									</Button>,
									canDictate
										? undefined
										: "Dictation is unavailable in this browser",
								)}
								{originalDraft !== null
									? tooltipButton(
											"Revert optimized prompt",
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Revert optimized prompt"
												onClick={revertOptimization}
											>
												<Undo aria-hidden="true" />
											</Button>,
										)
									: tooltipButton(
											"Optimize prompt",
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Optimize prompt"
												disabled={
													!draft.trim() ||
													isOptimizing ||
													isRunning
												}
												onClick={() => void optimize()}
											>
												{isOptimizing ? (
													<Spinner />
												) : (
													<Sparkles aria-hidden="true" />
												)}
											</Button>,
										)}
							</div>
						</div>
						{tooltipButton(
							isRunning
								? isCancelling
									? "Cancelling"
									: "Stop"
								: "Send",
							<Button
								type="button"
								size="icon-sm"
								aria-label={
									isRunning
										? isCancelling
											? "Cancelling turn"
											: "Stop response"
										: `Send message to ${agentName}`
								}
								disabled={
									isRunning ? isCancelling : sendDisabled
								}
								onClick={() => {
									if (isRunning) void onStop();
									else void submit();
								}}
							>
								{isCancelling || isSubmitting ? (
									<Spinner />
								) : isRunning ? (
									<Square
										aria-hidden="true"
										className="size-3"
										fill="currentColor"
									/>
								) : (
									<Send aria-hidden="true" />
								)}
							</Button>,
						)}
					</div>
					<OnChangePlugin
						onChange={(editorState) => {
							editorState.read(() => {
								const text = $getRoot().getTextContent();
								if (text.length > MAX_CHARACTERS) {
									setEditorText(
										text.slice(0, MAX_CHARACTERS),
									);
									return;
								}
								draftRef.current = text;
								setDraft(text);
							});
						}}
					/>
					<HistoryPlugin />
					<AutoFocusPlugin />
					<EditorRefPlugin editorRef={editorRef} />
					<CharacterLimitPlugin
						charset="UTF-16"
						maxLength={MAX_CHARACTERS}
						renderer={({ remainingCharacters }) => (
							<output
								className={cn(
									"absolute right-3 bottom-12 text-muted-foreground text-xs",
									remainingCharacters > 500 && "sr-only",
									remainingCharacters < 0 &&
										"text-destructive",
								)}
							>
								{remainingCharacters} characters remaining
							</output>
						)}
					/>
					<RoomComposerEnterPlugin onSubmit={() => void submit()} />
					<RoomComposerPasteScrollPlugin
						scrollRef={scrollViewportRef}
					/>
					<RoomComposerSlashPlugin commands={slashCommands} />
				</LexicalComposer>
			</fieldset>
			<RoomSettingsDialog
				open={isSettingsOpen}
				agentName={agentName}
				settings={roomSettings}
				inheritedMcp={inheritedMcp}
				returnFocusRef={actionsTriggerRef}
				onOpenChange={setIsSettingsOpen}
				onSave={onSaveRoomSettings}
			/>
			{alert && (
				<P className="mt-1.5 text-destructive text-xs" role="alert">
					{alert}
				</P>
			)}
		</div>
	);
}
