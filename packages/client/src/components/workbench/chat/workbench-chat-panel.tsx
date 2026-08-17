import {
	MicIcon,
	MoveDownIcon,
	PaperclipIcon,
	PlusIcon,
	SendIcon,
	SparklesIcon,
	XIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	ScrollArea,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChatModelOptions } from "@/api/rooms";
import { useWorkbenchChat } from "./use-workbench-chat";
import type { WorkbenchChatConfig } from "./workbench-chat.types";
import { WorkbenchChatAttachments } from "./workbench-chat-attachments";
import { WorkbenchChatMessage } from "./workbench-chat-message";
import { WorkbenchChatOptions } from "./workbench-chat-options";

const SCROLL_LOCK_THRESHOLD = 80;

interface WorkbenchSpeechRecognitionResult {
	isFinal: boolean;
	[index: number]: { transcript: string };
}

interface WorkbenchSpeechRecognitionEvent {
	resultIndex: number;
	results: {
		length: number;
		[index: number]: WorkbenchSpeechRecognitionResult;
	};
}

interface WorkbenchSpeechRecognition {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	onstart: (() => void) | null;
	onresult: ((event: WorkbenchSpeechRecognitionEvent) => void) | null;
	onerror: (() => void) | null;
	onend: (() => void) | null;
}

type WorkbenchSpeechRecognitionConstructor =
	new () => WorkbenchSpeechRecognition;

type WorkbenchSpeechWindow = Window & {
	SpeechRecognition?: WorkbenchSpeechRecognitionConstructor;
	webkitSpeechRecognition?: WorkbenchSpeechRecognitionConstructor;
};

/** Generic chat panel rendered inside a workbench border. */
export const WorkbenchChatPanel: React.FC<WorkbenchChatConfig> = (config) => {
	const {
		state,
		hasPendingTools,
		submit,
		newRoom,
		setModel,
		runTool,
		cancelTool,
		clearError,
	} = useWorkbenchChat(config);
	const [prompt, setPrompt] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [modelOptions, setModelOptions] = useState<WorkbenchChatModelOptions>(
		{},
	);
	const [showThinking, setShowThinking] = useState(true);
	const [canListen, setCanListen] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const [showScrollDown, setShowScrollDown] = useState(false);
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
		null,
	);
	const scrollLockedRef = useRef(false);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const recognitionRef = useRef<WorkbenchSpeechRecognition | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: message changes trigger auto-scroll
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || scrollLockedRef.current) {
			return;
		}
		requestAnimationFrame(() => {
			viewport.scrollTop = viewport.scrollHeight;
			setShowScrollDown(false);
		});
	}, [state.messages]);

	useEffect(() => {
		if (!scrollElement) {
			return;
		}

		const handleScroll = () => {
			const isAwayFromBottom =
				scrollElement.scrollHeight -
					scrollElement.scrollTop -
					scrollElement.clientHeight >
				SCROLL_LOCK_THRESHOLD;
			scrollLockedRef.current = isAwayFromBottom;
			setShowScrollDown(isAwayFromBottom);
		};
		scrollElement.addEventListener("scroll", handleScroll, {
			passive: true,
		});
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [scrollElement]);

	useEffect(() => {
		const speechWindow = window as WorkbenchSpeechWindow;
		const SpeechRecognition =
			speechWindow.SpeechRecognition ??
			speechWindow.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";
		recognition.onstart = () => setIsListening(true);
		recognition.onresult = (event) => {
			let transcript = "";
			for (
				let index = event.resultIndex;
				index < event.results.length;
				index += 1
			) {
				if (event.results[index].isFinal) {
					transcript += event.results[index][0]?.transcript ?? "";
				}
			}

			const finalized = transcript.trim();
			if (finalized) {
				setPrompt((current) =>
					current.trim()
						? `${current.trimEnd()} ${finalized}`
						: finalized,
				);
			}
		};
		recognition.onerror = () => setIsListening(false);
		recognition.onend = () => {
			setIsListening(false);
			textareaRef.current?.focus();
		};
		recognitionRef.current = recognition;
		setCanListen(true);

		return () => {
			recognition.onstart = null;
			recognition.onresult = null;
			recognition.onerror = null;
			recognition.onend = null;
			recognition.stop();
			recognitionRef.current = null;
		};
	}, []);

	const addFiles = (incoming: File[]) => {
		setFiles((current) => {
			const existing = new Set(
				current.map(
					(file) => `${file.name}-${file.size}-${file.lastModified}`,
				),
			);
			return [
				...current,
				...incoming.filter((file) => {
					const key = `${file.name}-${file.size}-${file.lastModified}`;
					if (existing.has(key)) {
						return false;
					}
					existing.add(key);
					return true;
				}),
			];
		});
	};

	const handleSubmit = async () => {
		const value = prompt.trim();
		if (!value && files.length === 0) {
			return;
		}
		const submittedPrompt = prompt;
		const submittedFiles = files;
		setPrompt("");
		setFiles([]);
		scrollLockedRef.current = false;
		const didSubmit = await submit(value, submittedFiles, modelOptions);
		if (!didSubmit) {
			setPrompt((current) =>
				current.trim()
					? `${submittedPrompt.trimEnd()} ${current}`.trim()
					: submittedPrompt,
			);
			addFiles(submittedFiles);
		}
		textareaRef.current?.focus();
	};

	const handleNewRoom = async () => {
		setPrompt("");
		setFiles([]);
		setModelOptions({});
		setShowThinking(true);
		scrollLockedRef.current = false;
		setShowScrollDown(false);
		await newRoom();
		textareaRef.current?.focus();
	};

	const handleTalking = () => {
		if (isListening) {
			recognitionRef.current?.stop();
		} else {
			recognitionRef.current?.start();
		}
	};

	const scrollToBottom = () => {
		const viewport = viewportRef.current;
		if (!viewport) {
			return;
		}
		scrollLockedRef.current = false;
		setShowScrollDown(false);
		viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
	};

	const isSendDisabled =
		(!prompt.trim() && files.length === 0) ||
		!state.roomId ||
		!state.model ||
		state.isInitializing ||
		state.isStreaming ||
		hasPendingTools;
	const isNewRoomDisabled =
		state.isInitializing || state.isStreaming || hasPendingTools;
	const visibleMessages = state.messages.filter((message) => message.visible);

	return (
		<div
			className="flex h-full min-h-0 w-full flex-col bg-background"
			data-testid="workbench-chat-panel"
		>
			<div className="flex h-11 shrink-0 items-center gap-2 border-border border-b px-3">
				<p
					className="min-w-0 flex-1 truncate font-medium text-sm"
					title={state.roomName || "New chat"}
				>
					{state.roomName || "New chat"}
				</p>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Start a new chat"
							disabled={isNewRoomDisabled}
							onClick={() => void handleNewRoom()}
						>
							<PlusIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>New chat</TooltipContent>
				</Tooltip>
			</div>

			{state.error ? (
				<Alert
					variant="destructive"
					className="m-3 mb-0 w-auto shrink-0"
				>
					<AlertDescription className="flex items-start gap-2">
						<span className="min-w-0 flex-1">
							<span className="wrap-break-word">
								{state.error}
							</span>
						</span>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label="Dismiss chat error"
							onClick={clearError}
						>
							<XIcon />
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<div className="relative min-h-0 flex-1">
				{state.isInitializing ? (
					<div className="absolute inset-0 flex items-center justify-center">
						<Spinner />
					</div>
				) : (
					<ScrollArea
						className="[&_[data-slot=scroll-area-viewport]>div]:block! h-full"
						viewportRef={(element) => {
							viewportRef.current = element;
							setScrollElement(element);
						}}
					>
						<div className="flex min-h-full flex-col gap-2 px-4 py-6">
							{visibleMessages.length === 0 ? (
								<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
									<div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
										<SparklesIcon className="size-5" />
									</div>
									<p className="font-medium text-foreground text-sm">
										How can I help?
									</p>
								</div>
							) : (
								visibleMessages.map((message) => (
									<WorkbenchChatMessage
										key={message.messageId}
										message={message}
										tools={state.tools}
										showThinking={showThinking}
										onRunTool={(toolId) =>
											void runTool(toolId)
										}
										onCancelTool={(toolId) =>
											void cancelTool(toolId)
										}
									/>
								))
							)}
						</div>
					</ScrollArea>
				)}
				{showScrollDown ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon-sm"
								className="-translate-x-1/2 absolute bottom-3 left-1/2 z-10 rounded-full bg-background shadow-md"
								aria-label="Scroll to latest message"
								onClick={scrollToBottom}
							>
								<MoveDownIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Latest message</TooltipContent>
					</Tooltip>
				) : null}
			</div>

			<form
				className="shrink-0 bg-background p-3 pt-1"
				onSubmit={(event) => {
					event.preventDefault();
					void handleSubmit();
				}}
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
						addFiles(droppedFiles);
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
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="sr-only"
						aria-label="Attach files"
						onChange={(event) => {
							addFiles(Array.from(event.target.files ?? []));
							event.target.value = "";
						}}
					/>
					<WorkbenchChatAttachments
						files={files}
						onRemove={(index) =>
							setFiles((current) =>
								current.filter(
									(_, fileIndex) => fileIndex !== index,
								),
							)
						}
					/>
					<Textarea
						ref={textareaRef}
						value={prompt}
						rows={1}
						aria-label="Chat message"
						placeholder={
							state.isStreaming
								? "Waiting for a response..."
								: state.model
									? "What do you want to do?"
									: "Select a model to begin"
						}
						className="max-h-56 min-h-24 w-full resize-none border-0 bg-card px-4 py-3 shadow-none focus-visible:ring-0"
						onChange={(event) => setPrompt(event.target.value)}
						onPaste={(event) => {
							const clipboardFiles = Array.from(
								event.clipboardData.files,
							);
							const hasText =
								event.clipboardData.types.includes(
									"text/plain",
								) ||
								event.clipboardData.types.includes("text/html");
							const filesToAttach = hasText
								? clipboardFiles.filter(
										(file) =>
											!file.type.startsWith("image/"),
									)
								: clipboardFiles;
							if (filesToAttach.length > 0) {
								if (!hasText) {
									event.preventDefault();
								}
								addFiles(filesToAttach);
							}
						}}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								if (!isSendDisabled) {
									void handleSubmit();
								}
							}
						}}
					/>
					<div className="flex items-center gap-2 bg-card p-2">
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Add to chat"
											disabled={state.isInitializing}
										>
											<PlusIcon />
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>Add to chat</TooltipContent>
							</Tooltip>
							<DropdownMenuContent
								side="top"
								align="start"
								className="w-52"
							>
								<DropdownMenuItem
									onSelect={() =>
										fileInputRef.current?.click()
									}
								>
									<PaperclipIcon />
									<span>Attach files</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<WorkbenchChatOptions
							model={state.model}
							disabled={
								state.isInitializing ||
								state.isStreaming ||
								hasPendingTools
							}
							options={modelOptions}
							onOptionsChange={setModelOptions}
							onModelChange={setModel}
							showThinking={showThinking}
							onShowThinkingChange={setShowThinking}
						/>
						<div className="min-w-0 flex-1" />

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={
										isListening
											? "Stop talking"
											: "Start talking"
									}
									disabled={
										!canListen || state.isInitializing
									}
									onClick={handleTalking}
								>
									<MicIcon
										className={
											isListening
												? "animate-pulse text-destructive"
												: undefined
										}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isListening ? "Stop talking" : "Start talking"}
							</TooltipContent>
						</Tooltip>

						<Button
							type="submit"
							size="icon-sm"
							aria-label="Send message"
							disabled={isSendDisabled}
						>
							{state.isStreaming ? <Spinner /> : <SendIcon />}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
};
