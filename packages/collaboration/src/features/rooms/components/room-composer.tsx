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
	Send,
	Sparkles,
	Square,
	Undo,
	WandSparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Engine, EngineSelect } from "@semoss/shared";
import {
	Button,
	cn,
	P,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ComposerSubmission } from "../types/room";
import { RoomComposerEnterPlugin } from "./room-composer-enter-plugin";
import { RoomComposerFiles } from "./room-composer-files";
import { RoomComposerPasteScrollPlugin } from "./room-composer-paste-scroll-plugin";
import {
	RoomComposerSlashPlugin,
	type RoomSlashCommand,
} from "./room-composer-slash-plugin";

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

/** Collaboration-native Lexical composer for the room's fixed agent. */
export function RoomComposer({
	agentName,
	isSubmitting,
	isRunning,
	isCancelling,
	modelId,
	modelName,
	isModelSaving,
	modelError,
	roomInstructions,
	onModelChange,
	onOptimizePrompt,
	onSend,
	onStop,
	onSent,
}: {
	agentName: string;
	isSubmitting: boolean;
	isRunning: boolean;
	isCancelling: boolean;
	modelId: string;
	modelName: string;
	isModelSaving: boolean;
	modelError: Error | null;
	roomInstructions: string;
	onModelChange: (engine: Engine) => Promise<void>;
	onOptimizePrompt: (draft: string, instructions: string) => Promise<string>;
	onSend: (submission: ComposerSubmission) => Promise<void>;
	onStop: () => Promise<void>;
	onSent: () => void;
}) {
	const editorRef = useRef<LexicalEditor | null>(null);
	const scrollViewportRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
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
				onSent();
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

	const slashCommands = useMemo<RoomSlashCommand[]>(
		() => [
			{
				id: "document",
				label: "/document",
				description: "Attach a document to this message",
				icon: Paperclip,
				onSelect: () => fileInputRef.current?.click(),
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
		[draft, isOptimizing, optimize],
	);

	const alert = fileError || submissionError || modelError?.message;
	const sendDisabled =
		!draft.trim() || !modelId || isSubmitting || isModelSaving;

	return (
		<div className="shrink-0 border-t bg-background p-2 sm:p-3 lg:p-4">
			<fieldset
				aria-label="Message composer drop area"
				className={cn(
					"relative m-0 min-w-0 overflow-hidden rounded-xl border bg-card p-0 shadow-sm transition-colors",
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
						className="max-h-52 min-h-20"
						viewportRef={(element) => {
							scrollViewportRef.current = element;
						}}
					>
						<PlainTextPlugin
							contentEditable={
								<ContentEditable
									aria-label={`Message ${agentName}`}
									className="min-h-20 px-3 py-3 text-sm outline-none sm:px-4"
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
								<P className="pointer-events-none absolute top-3 left-3 text-muted-foreground text-sm sm:left-4">
									Message {agentName}…
								</P>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
					</ScrollArea>
					<div className="flex min-w-0 flex-wrap items-center gap-1 border-t px-2 py-2 sm:flex-nowrap">
						{tooltipButton(
							"Attach files",
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
								aria-label="Attach files"
								onClick={() => fileInputRef.current?.click()}
							>
								<Paperclip aria-hidden="true" />
							</Button>,
						)}
						<div className="min-w-0 flex-1 sm:max-w-52">
							<EngineSelect
								className="h-11 w-full border-0 bg-transparent px-2 text-xs shadow-none sm:h-8"
								name={modelName}
								value={modelId}
								disabled={
									isRunning || isSubmitting || isModelSaving
								}
								engineTypes={["MODEL"]}
								metaFilters={[{ tag: "text-generation" }]}
								showEngineIcon={false}
								onChange={(engine) =>
									void onModelChange(engine)
								}
								popoverContentProps={{ align: "start" }}
							/>
						</div>
						<div className="ms-auto flex shrink-0 items-center gap-1">
							{tooltipButton(
								isListening
									? "Stop dictation"
									: "Start dictation",
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
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
											className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
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
											className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
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
							{tooltipButton(
								isRunning
									? isCancelling
										? "Cancelling"
										: "Stop"
									: "Send",
								<Button
									type="button"
									size="icon-sm"
									className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
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
			{alert && (
				<P className="mt-1.5 text-destructive text-xs" role="alert">
					{alert}
				</P>
			)}
		</div>
	);
}
