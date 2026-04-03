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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useGracefulErrors, useRoot } from "@/hooks";
import type { Engine } from "@/types";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "img"];

const isImageFile = (file: File): boolean => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return IMAGE_EXTENSIONS.includes(ext);
};

const ICON_CLASS = "size-8 shrink-0 text-muted-foreground";

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

interface RoomInputProps {
	/** Classes to override */
	className?: string;

	/** Track if it is loading */
	isLoading?: boolean;

	/** Model of the room */
	model: Engine | null;

	/** Update options on change */
	setModel: (model: Engine) => void;

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
		const { t } = useTranslation("room");
		const { getGracefulErrorMessage } = useGracefulErrors();
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);
		const { root } = useRoot();

		const ref = useRef<HTMLDivElement>(null);
		const editorRef = useRef<LexicalEditor>(null);
		const fileRef = useRef<HTMLInputElement>(null);
		const contentEditableRef = useRef<HTMLDivElement>(null);

		const [isDragging, setIsDragging] = useState(false);
		const [files, setFiles] = useState<File[]>([]);

		const [canListen, setCanListen] = useState(false);
		const [isListening, setIsListening] = useState(false);

		const recognitionRef = useRef<SpeechRecognition | null>(null);

		useEffect(() => {
			// Check if Speech Recognition is supported
			const SpeechRecognition =
				window.SpeechRecognition || window.webkitSpeechRecognition;

			if (SpeechRecognition) {
				setCanListen(true);

				const recognition = new SpeechRecognition();
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = "en-US";

				recognition.onstart = () => {
					setIsListening(true);
				};

				recognition.onresult = (event) => {
					let transcript = "";

					// get the final ones
					for (
						let i = event.resultIndex;
						i < event.results.length;
						i++
					) {
						if (event.results[i].isFinal) {
							transcript += event.results[i][0].transcript;
						}
					}

					// trim to manually handle spaces
					transcript = transcript.trim();
					if (transcript) {
						editorRef.current?.update(() => {
							const root = $getRoot();
							const currentText = root.getTextContent();

							// clear existing content
							root.clear();

							// create new paragraph with combined text
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

					// turn off and focus on element
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognition.onend = () => {
					// turn off and focus on element
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognitionRef.current = recognition;
			} else {
				setCanListen(false);
			}

			return () => {
				recognitionRef.current?.stop();
			};
		}, []);

		// update editable
		useEffect(() => {
			editorRef.current?.setEditable(!isLoading);
		}, [isLoading]);

		/**
		 * Prompt the model
		 *
		 * @param - input
		 */
		const promptModel = async () => {
			let success = false;

			// store old options

			let userInput = "";
			editorRef.current?.getEditorState().read(() => {
				const root = $getRoot();
				userInput = root.getTextContent();
			});

			const userFiles = [...files];

			// skip if there is no input, if loading, or if there are outstanding tools
			if (!userInput || isLoading || hasOutstandingTools) {
				return;
			}

			try {
				// clear the view
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const paragraphNode = $createParagraphNode();
					root.append(paragraphNode);
				});

				// clear out the input components
				success = Boolean(await onPrompt(userInput, userFiles));
				if (!success) {
					throw new Error(`Error processing chat`);
				}

				// clear the files
				setFiles([]);
			} catch (e) {
				// throw the error
				toast.error(getGracefulErrorMessage(e as Error));

				// keep the files
				setFiles(userFiles);

				// keep the view
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

		// Generate object URLs for image file previews
		const imagePreviewUrls = useMemo(() => {
			const urls = new Map<string, string>();
			for (const f of files) {
				if (isImageFile(f)) {
					const key = `${f.name}-${f.size}-${f.lastModified}`;
					urls.set(key, URL.createObjectURL(f));
				}
			}
			return urls;
		}, [files]);

		// Cleanup object URLs on change
		useEffect(() => {
			return () => {
				for (const url of imagePreviewUrls.values()) {
					URL.revokeObjectURL(url);
				}
			};
		}, [imagePreviewUrls]);

		const filesScrollRef = useRef<HTMLDivElement>(null);
		const [showScrollLeft, setShowScrollLeft] = useState(false);
		const [showScrollRight, setShowScrollRight] = useState(false);

		const updateScrollButtons = () => {
			const el = filesScrollRef.current;
			if (!el) return;
			setShowScrollLeft(el.scrollLeft > 0);
			setShowScrollRight(
				el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
			);
		};

		useEffect(() => {
			updateScrollButtons();
		}, [files]);

		const scrollFiles = (direction: "left" | "right") => {
			const el = filesScrollRef.current;
			if (!el) return;
			const amount = 200;
			el.scrollBy({
				left: direction === "left" ? -amount : amount,
				behavior: "smooth",
			});
		};

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
							const updated = Array.from(e.target.files ?? []);
							setFiles((prev) => [...prev, ...updated]);
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
											`h-auto w-full overflow-y-auto rounded-md border border-input bg-background p-4 pb-18 text-sm shadow-lg outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-card dark:aria-invalid:ring-destructive/40`,
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

											// set the new files
											const updated = Array.from(
												e.dataTransfer.files,
											);
											setFiles((prev) => [
												...prev,
												...updated,
											]);

											// turn off dragging
											setIsDragging(false);
										}}
										onDragOver={(e) => {
											e.preventDefault();

											// turn on dragging
											setIsDragging(true);
										}}
										onDragLeave={(e) => {
											e.preventDefault();

											// turn off dragging
											setIsDragging(false);
										}}
										onPaste={(e) => {
											// set the new files
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
										className="pointer-events-none absolute inset-x-px bottom-px z-10 h-12 rounded-b-md"
									/>
								</div>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
						<OnChangePlugin
							onChange={(editorState) => {
								editorState.read(() => {
									// get the root
									const root = $getRoot();

									// set empty state
									setIsEmpty(
										root.getTextContent().trim().length ===
											0,
									);

									// Scroll to bottom after content changes
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
										{/* Invisible trigger positioned at the cursor */}
										<DropdownMenuTrigger
											style={{
												position: "fixed",
												top: menuPosition?.top,
												left: menuPosition?.left,
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
					<div className="absolute right-3 bottom-3 z-10 flex flex-row items-center gap-2">
						{root.theme.featureFlags?.enableModelSelect && (
							<EngineSelect
								className="h-8 w-48 gap-0.5 border-none bg-transparent px-2 py-1 text-xs shadow-none [&>svg]:hidden"
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
						)}

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
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
				{files.length > 0 ? (
					<div className="relative flex items-center pt-4">
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
