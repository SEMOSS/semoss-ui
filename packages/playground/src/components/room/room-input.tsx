import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
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
	ChevronLeftIcon,
	ChevronRightIcon,
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	MicIcon,
	SendIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	Square,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { EnterPlugin, FocusPlugin, MentionPlugin } from "@/components";
import { AutoScrollOnPastePlugin } from "@/components/common/lexical/auto-scroll-on-paste-plugin";
import { useGracefulErrors } from "@/hooks";
import type { Engine } from "@/types";

// ============================================================================
// Constants & Helper Functions
// ============================================================================

/** Supported image file extensions for preview */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "img"];

/** Check if a file is an image based on its extension */
const isImageFile = (file: File): boolean => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return IMAGE_EXTENSIONS.includes(ext);
};

/** Shared icon styling for file type icons */
const ICON_CLASS = "size-8 shrink-0 text-muted-foreground";

/**
 * Map file extensions to appropriate Lucide icon components
 * Returns a generic FileIcon for unknown extensions
 */
const getIconForExt = (ext: string) => {
	if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheetIcon;
	if (
		[
			"py",
			"js",
			"ts",
			"tsx",
			"jsx",
			"java",
			"cpp",
			"c",
			"go",
			"rs",
		].includes(ext)
	)
		return FileCodeIcon;
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
		return FileTerminalIcon;
	if (ext === "json") return FileJsonIcon;
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return FileArchiveIcon;
	if (["ppt", "pptx"].includes(ext)) return FileChartPieIcon;
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
		return FileAudioIcon;
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
		return FileVideoIcon;
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext)) return FileTypeIcon;
	if (ext === "pdf") return FileBadgeIcon;
	if (["doc", "docx", "msg", "txt"].includes(ext)) return FileTextIcon;
	return FileIcon;
};

/**
 * Render a file type icon with extension label
 * For images, this will be replaced with an actual preview
 */
const getFileIcon = (file: File): React.ReactNode => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	const Icon = getIconForExt(ext);

	return (
		<div className="flex flex-col items-center gap-1">
			<Icon className={ICON_CLASS} strokeWidth={1.25} />
			<span className="max-w-16 truncate font-medium text-[10px] text-muted-foreground uppercase">
				{ext}
			</span>
		</div>
	);
};

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface RoomInputProps {
	/** Classes to override */
	className?: string;

	/** Track if it is loading */
	isLoading?: boolean;

	/** Model of the room */
	model: Engine | null;

	/** Update options on change */
	setModel: (model: Engine | null) => void;

	/** Menu component */
	MenuComponent: React.ComponentType<{
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		fileRef: React.RefObject<HTMLInputElement>;
		addToken: (token: string) => void;
	}>;

	/** Callback triggered to process the prompt. Throw an error if necessary */
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;

	/** Has outstanding tools */
	hasOutstandingTools?: boolean;

	/** Whether the pause-on-next-tool flag is armed */
	hasToolsPaused?: boolean;

	/** Toggle the pause-on-next-tool flag */
	toggleToolsPaused?: () => void;

	/** Hide the pause-on-next-tool button */
	hidePauseButton?: boolean;

	/** Content to render in the footer */
	footer?: React.ReactNode;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RoomInput - A rich text input component for chat/AI interactions
 *
 * Features:
 * - Lexical editor with mention support (/ commands)
 * - File upload via drag/drop, paste, or file picker
 * - Speech-to-text input
 * - Image file previews
 * - Model selection
 * - Tool pause/resume controls
 */
export const RoomInput: React.FC<RoomInputProps> = observer(
	({
		className,
		isLoading,
		model,
		setModel,
		MenuComponent,
		onPrompt = () => null,
		hasOutstandingTools = false,
		hasToolsPaused = false,
		toggleToolsPaused,
		footer = null,
		hidePauseButton = false,
	}) => {
		// ========================================================================
		// Hooks & State
		// ========================================================================

		const { t } = useTranslation("room");
		const { getGracefulErrorMessage } = useGracefulErrors();

		// Editor state
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);

		// Refs for DOM elements and Lexical editor
		const ref = useRef<HTMLDivElement>(null);
		const editorRef = useRef<LexicalEditor>(null);
		const fileRef = useRef<HTMLInputElement>(null);
		const contentEditableRef = useRef<HTMLDivElement>(null);

		// File handling
		const [isDragging, setIsDragging] = useState(false);
		const [files, setFiles] = useState<File[]>([]);

		// Speech-to-text
		const [canListen, setCanListen] = useState(false);
		const [isListening, setIsListening] = useState(false);
		const recognitionRef = useRef<SpeechRecognition | null>(null);

		// ========================================================================
		// Speech Recognition Setup
		// ========================================================================

		useEffect(() => {
			// Check browser support for Web Speech API
			const SpeechRecognition =
				window.SpeechRecognition || window.webkitSpeechRecognition;

			if (SpeechRecognition) {
				setCanListen(true);

				const recognition = new SpeechRecognition();
				recognition.continuous = true; // Keep listening until stopped
				recognition.interimResults = true; // Get real-time results
				recognition.lang = "en-US";

				recognition.onstart = () => {
					setIsListening(true);
				};

				recognition.onresult = (event) => {
					let transcript = "";

					// Collect only finalized transcription results
					for (
						let i = event.resultIndex;
						i < event.results.length;
						i++
					) {
						if (event.results[i].isFinal) {
							transcript += event.results[i][0].transcript;
						}
					}

					transcript = transcript.trim();
					if (transcript) {
						// Update Lexical editor with appended transcribed text
						editorRef.current?.update(() => {
							const root = $getRoot();
							const currentText = root.getTextContent();

							root.clear();

							// Append new transcript to existing text
							const paragraphNode = $createParagraphNode();
							const textNode = $createTextNode(
								currentText
									? `${currentText} ${transcript}`
									: transcript,
							);
							paragraphNode.append(textNode);
							root.append(paragraphNode);
						});
					}
				};

				recognition.onerror = (event) => {
					console.error(event);
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognition.onend = () => {
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognitionRef.current = recognition;
			} else {
				setCanListen(false);
			}

			// Cleanup: stop recognition when component unmounts
			return () => {
				recognitionRef.current?.stop();
			};
		}, []);

		// Disable editor during loading to prevent user input
		useEffect(() => {
			editorRef.current?.setEditable(!isLoading);
		}, [isLoading]);

		// ========================================================================
		// Core Functions
		// ========================================================================

		/**
		 * Submit the current prompt to the AI model
		 *
		 * Behavior:
		 * - Extracts text from editor and captures files
		 * - Clears editor optimistically before sending
		 * - On success: clears files
		 * - On failure: restores editor content and files for retry
		 */
		const promptModel = async () => {
			// Extract current text from Lexical editor
			let userInput = "";
			editorRef.current?.getEditorState().read(() => {
				const root = $getRoot();
				userInput = root.getTextContent();
			});

			// Capture files before clearing (for potential restore on error)
			const userFiles = [...files];

			// Guard: prevent submission if empty, loading, or waiting for tool response
			if (!userInput || isLoading || hasOutstandingTools) {
				return;
			}

			try {
				// Optimistically clear editor before sending
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();
					const paragraphNode = $createParagraphNode();
					root.append(paragraphNode);
				});

				// Submit to parent handler
				const result = await onPrompt(userInput, userFiles);
				if (result === null || result === false) {
					throw new Error(`Error processing chat`);
				}

				// Success: clear attached files
				setFiles([]);
			} catch (e) {
				// Show error to user
				toast.error(getGracefulErrorMessage(e as Error));

				// Restore files for retry
				setFiles(userFiles);

				// Restore original text in editor for editing/retry
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const paragraphNode = $createParagraphNode();
					const textNode = $createTextNode(userInput);
					paragraphNode.append(textNode);
					root.append(paragraphNode);
				});
			}
		};

		// ========================================================================
		// File Preview Management
		// ========================================================================

		/**
		 * Generate blob URLs for image file previews
		 * Memoized to avoid recreating URLs on every render
		 */
		const imagePreviewUrls = useMemo(() => {
			const urls = new Map<string, string>();
			for (const f of files) {
				if (isImageFile(f)) {
					// Use unique key to identify same file across renders
					const key = `${f.name}-${f.size}-${f.lastModified}`;
					urls.set(key, URL.createObjectURL(f));
				}
			}
			return urls;
		}, [files]);

		/**
		 * Cleanup blob URLs to prevent memory leaks
		 * Important: blob URLs persist until explicitly revoked
		 */
		useEffect(() => {
			return () => {
				for (const url of imagePreviewUrls.values()) {
					URL.revokeObjectURL(url);
				}
			};
		}, [imagePreviewUrls]);

		// ========================================================================
		// File List Scroll Controls
		// ========================================================================

		const filesScrollRef = useRef<HTMLDivElement>(null);
		const [showScrollLeft, setShowScrollLeft] = useState(false);
		const [showScrollRight, setShowScrollRight] = useState(false);

		/**
		 * Determine which scroll buttons to show based on scroll position
		 * Left button: shown when scrolled right
		 * Right button: shown when more content exists to the right
		 */
		const updateScrollButtons = useCallback(() => {
			const el = filesScrollRef.current;
			if (!el) return;

			setShowScrollLeft(el.scrollLeft > 0);
			setShowScrollRight(
				el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
			);
		}, []);

		// Initialize scroll button visibility
		useEffect(() => {
			updateScrollButtons();
		}, [updateScrollButtons]);

		/** Scroll the file list horizontally by a fixed amount */
		const scrollFiles = (direction: "left" | "right") => {
			const el = filesScrollRef.current;
			if (!el) return;
			const amount = 200;
			el.scrollBy({
				left: direction === "left" ? -amount : amount,
				behavior: "smooth",
			});
		};

		// ========================================================================
		// Render
		// ========================================================================

		return (
			<>
				<div className="relative w-full" ref={ref}>
					<input
						ref={fileRef}
						type="file"
						multiple={true}
						hidden
						onChange={(e) => {
							// set the new files
							if (e.target.files) {
								const updated = Array.from(e.target.files);
								setFiles((prev) => [...prev, ...updated]);
							}
						}}
					/>
					<LexicalComposer
						initialConfig={{
							namespace: "RoomInput",
							theme: {},
							nodes: [],
							onError: (error) => {
								console.error(error);
							},
						}}
					>
						<PlainTextPlugin
							contentEditable={
								<div className="relative">
									<ContentEditable
										ref={contentEditableRef}
										className={cn(
											`h-auto w-full overflow-y-auto rounded-md border border-input bg-transparent p-4 pb-18 text-sm shadow-lg outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40`,
											isDragging
												? "border-primary border-dashed"
												: "hover:border-primary",
											className,
										)}
										aria-placeholder={t(
											"input.ariaPlaceholder",
										)}
										aria-disabled={isLoading}
										disabled={isLoading}
										placeholder={
											<div className="pointer-events-none absolute top-0 left-0 inline-flex select-none flex-wrap items-center gap-1 p-4 text-muted-foreground text-sm">
												<SparklesIcon className="size-4" />
												{isLoading
													? t("input.thinking")
													: t("input.menuPrompt")}
											</div>
										}
										onDrop={(e) => {
											e.preventDefault();
											const updated = Array.from(
												e.dataTransfer.files,
											);
											setFiles((prev) => [
												...prev,
												...updated,
											]);
											setIsDragging(false);
										}}
										onDragOver={(e) => {
											e.preventDefault();
											setIsDragging(true);
										}}
										onDragLeave={(e) => {
											e.preventDefault();
											setIsDragging(false);
										}}
										onPaste={(e) => {
											// Support pasting files (e.g., screenshots)
											const updated = Array.from(
												e.clipboardData.files,
											);

											if (updated.length > 0) {
												e.preventDefault();
												setFiles((prev) => [
													...prev,
													...updated,
												]);
											}
										}}
									/>
									<div
										aria-hidden="true"
										className="pointer-events-none absolute inset-x-px bottom-px z-10 h-12 rounded-b-md bg-background"
									/>
								</div>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
						<OnChangePlugin
							onChange={(editorState) => {
								editorState.read(() => {
									const root = $getRoot();

									// Track empty state to disable send button
									setIsEmpty(
										root.getTextContent().trim().length ===
											0,
									);

									// Auto-scroll to bottom when content changes (e.g., paste)
									setTimeout(() => {
										if (contentEditableRef.current) {
											contentEditableRef.current.scrollTop =
												contentEditableRef.current.scrollHeight;
										}
									}, 0);
								});
							}}
						/>
						<HistoryPlugin />
						<AutoFocusPlugin />
						<FocusPlugin />
						<EditorRefPlugin editorRef={editorRef} />
						<EnterPlugin onEnter={() => promptModel()} />
						<AutoScrollOnPastePlugin
							scrollContainerRef={contentEditableRef}
						/>
						{/* Slash command menu - disabled during loading */}
						{!isLoading && (
							<MentionPlugin
								trigger="/"
								MenuComponent={({
									isOpen,
									onOpenChange,
									menuPosition,
									addToken,
								}) => (
									<DropdownMenu
										open={isOpen}
										onOpenChange={onOpenChange}
									>
										{/* Invisible trigger positioned at cursor for menu placement */}
										<DropdownMenuTrigger
											style={{
												position: "fixed",
												top: menuPosition?.top ?? 0,
												left: menuPosition?.left ?? 0,
												width: 0,
												height: 0,
											}}
										/>
										<DropdownMenuContent
											align="start"
											className="w-72"
										>
											<MenuComponent
												isOpen={isOpen}
												onOpenChange={onOpenChange}
												fileRef={fileRef}
												addToken={addToken}
											/>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							/>
						)}
					</LexicalComposer>
					{/* Bottom-left controls: settings menu + custom footer */}
					<div className="absolute bottom-3 left-3 z-10 flex flex-row items-center gap-2">
						{!isLoading && (
							<DropdownMenu
								open={menuOpen}
								onOpenChange={setMenuOpen}
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button
												className="bg-background"
												variant="ghost"
												size="icon-sm"
												disabled={isLoading}
												aria-label={t(
													"input.openSettings",
												)}
											>
												<SlidersHorizontalIcon />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>
										{t("input.openSettings")}
									</TooltipContent>
								</Tooltip>
								<DropdownMenuContent
									align="start"
									className="w-72"
								>
									<MenuComponent
										isOpen={menuOpen}
										onOpenChange={setMenuOpen}
										fileRef={fileRef}
										addToken={() => null}
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
						{footer}
					</div>

					{/* Bottom-right controls: model selector, mic, send */}
					<div className="absolute right-3 bottom-3 z-10 flex flex-row items-center gap-2">
						<EngineSelect
							className="h-8 w-48 gap-0.5 px-2 py-1 text-xs [&>svg]:hidden"
							disabled={isLoading}
							name={
								model?.engine_display_name ||
								model?.app_name ||
								""
							}
							value={model?.app_id || ""}
							engineTypes={["MODEL"]}
							metaFilters={[{ tag: "text-generation" }]}
							onChange={(v) => {
								setModel(v);
							}}
							popoverContentProps={{
								align: "start",
							}}
						/>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="bg-background"
									variant={"ghost"}
									aria-label={t("input.recordLabel")}
									size="icon-sm"
									disabled={!canListen || isLoading}
									onClick={() => {
										if (isListening) {
											recognitionRef.current?.stop();
											editorRef.current?.focus();
										} else {
											recognitionRef.current?.start();
										}
									}}
								>
									<MicIcon
										className={`${isListening ? "animate-pulse text-destructive" : ""}`}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isListening
									? t("input.stopRecording")
									: t("input.record")}
							</TooltipContent>
						</Tooltip>
						{/* Primary action button - dual purpose:
						     - When idle: Send prompt
						     - When loading: Pause tool execution */}
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Button
										variant="default"
										size="icon-sm"
										aria-label={
											isLoading
												? t("input.pauseToolsTooltip")
												: t("input.askLabel")
										}
										disabled={
											isLoading
												? hasToolsPaused ||
													hidePauseButton
												: isEmpty || hasOutstandingTools
										}
										onClick={() => {
											if (isLoading) {
												toggleToolsPaused?.();
											} else {
												promptModel();
											}
										}}
									>
										{isLoading ? (
											hasToolsPaused ||
											hidePauseButton ? (
												<Spinner />
											) : (
												<Square
													className="size-3"
													fill="currentColor"
												/>
											)
										) : (
											<SendIcon />
										)}
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{(() => {
									if (isLoading) {
										return hasToolsPaused || hidePauseButton
											? t("input.thinkingTooltip")
											: t("input.pauseToolsTooltip");
									} else if (isEmpty) {
										return t("input.enterQuestion");
									} else if (hasOutstandingTools) {
										return t("input.completeTool");
									}
									return t("input.ask");
								})()}
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{/* File attachment preview strip */}
				{files.length > 0 ? (
					<div className="relative flex items-center pt-4">
						{/* Left scroll button */}
						{showScrollLeft && (
							<Button
								variant="outline"
								size="icon-sm"
								className="absolute left-0 z-20 rounded-full bg-background shadow-md"
								onClick={() => scrollFiles("left")}
								aria-label="Scroll left"
							>
								<ChevronLeftIcon className="size-4" />
							</Button>
						)}

						{/* Horizontal scrollable file list */}
						<div
							ref={filesScrollRef}
							className="flex flex-row items-center gap-2 overflow-x-auto scroll-smooth px-1"
							style={{ scrollbarWidth: "none" }}
							onScroll={updateScrollButtons}
						>
							{files.map((f, fIdx) => {
								const fileKey = `${f.name}-${f.size}-${f.lastModified}`;
								const previewUrl =
									imagePreviewUrls.get(fileKey);
								return (
									<div
										key={fileKey}
										className="group relative shrink-0"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
													{previewUrl ? (
														<img
															src={previewUrl}
															alt={f.name}
															className="size-full object-cover"
														/>
													) : (
														getFileIcon(f)
													)}
												</div>
											</TooltipTrigger>
											<TooltipContent>
												{f.name}
											</TooltipContent>
										</Tooltip>
										{/* Remove button - shown on hover */}{" "}
										<div className="absolute top-0 right-0 z-10 hidden group-hover:inline-flex">
											<Button
												variant="ghost"
												size={"icon-sm"}
												onClick={() => {
													const updated = [...files];
													updated.splice(fIdx, 1);
													setFiles(updated);
												}}
											>
												<XIcon />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
						{showScrollRight && (
							<Button
								variant="outline"
								size="icon-sm"
								className="absolute right-0 z-20 rounded-full bg-background shadow-md"
								onClick={() => scrollFiles("right")}
								aria-label="Scroll right"
							>
								<ChevronRightIcon className="size-4" />
							</Button>
						)}
					</div>
				) : null}
			</>
		);
	},
);
