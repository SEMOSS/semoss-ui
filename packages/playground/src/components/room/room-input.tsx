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
	FileAudio2Icon,
	FileIcon,
	FileType2Icon,
	FileVideoCameraIcon,
	MicIcon,
	SendIcon,
	SlidersHorizontalIcon,
	SparklesIcon,
	Square,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import type { RoomStore } from "@/stores";
import { useGracefulErrors } from "@/hooks";
import type { Engine } from "@/types";
import { PromptOptimizer } from "../../components/prompt/PromptOptimizer";

interface RoomInputProps {
	className?: string;
	isLoading?: boolean;
	model: Engine | null;
	setModel: (model: Engine | null) => void;
	MenuComponent: React.ComponentType<{
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		fileRef: React.RefObject<HTMLInputElement>;
		addToken: (token: string) => void;
	}>;
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;
	hasOutstandingTools?: boolean;

	/** Whether the pause-on-next-tool flag is armed */
	hasToolsPaused?: boolean;

	/** Toggle the pause-on-next-tool flag */
	toggleToolsPaused?: () => void;

	/** Hide the pause-on-next-tool button */
	hidePauseButton?: boolean;

	/** Content to render in the footer */
	footer?: React.ReactNode;

	room: RoomStore;
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
		room,
	}) => {
		const { t } = useTranslation("room");
		const { getGracefulErrorMessage } = useGracefulErrors();
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);
		const [inputText, setInputText] = useState("");

		const ref = useRef<HTMLDivElement>(null);
		const editorRef = useRef<LexicalEditor>(null);
		const fileRef = useRef<HTMLInputElement>(null);
		const contentEditableRef = useRef<HTMLDivElement>(null);

		const [isDragging, setIsDragging] = useState(false);
		const [files, setFiles] = useState<File[]>([]);

		const [canListen, setCanListen] = useState(false);
		const [isListening, setIsListening] = useState(false);

		const recognitionRef = useRef<SpeechRecognition | null>(null);

		// Bridge setInput() (PromptOptimizer) -> Lexical editor content
		const setInputFromOptimizer: React.Dispatch<
			React.SetStateAction<string>
		> = (nextValue) => {
			setInputText((prev) => {
				const next =
					typeof nextValue === "function"
						? (nextValue as (p: string) => string)(prev)
						: nextValue;

				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const paragraphNode = $createParagraphNode();
					if (next?.length) {
						paragraphNode.append($createTextNode(next));
					}
					root.append(paragraphNode);
				});
				editorRef.current?.focus();
				return next;
			});
		};

		useEffect(() => {
			const SpeechRecognition =
				window.SpeechRecognition ||
				(window as any).webkitSpeechRecognition;

			if (SpeechRecognition) {
				setCanListen(true);

				const recognition = new SpeechRecognition();
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = "en-US";

				recognition.onstart = () => {
					setIsListening(true);
				};

				recognition.onresult = (event: SpeechRecognitionEvent) => {
					let transcript = "";

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
						editorRef.current?.update(() => {
							const root = $getRoot();
							const currentText = root.getTextContent();

							root.clear();

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

				recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

			return () => {
				recognitionRef.current?.stop();
			};
		}, []);

		useEffect(() => {
			editorRef.current?.setEditable(!isLoading);
		}, [isLoading]);

		const promptModel = async () => {
			let success = false;

			let userInput = "";
			editorRef.current?.getEditorState().read(() => {
				const root = $getRoot();
				userInput = root.getTextContent();
			});

			const userFiles = [...files];

			if (!userInput || isLoading || hasOutstandingTools) {
				return;
			}

			try {
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();
					const paragraphNode = $createParagraphNode();
					root.append(paragraphNode);
				});

				success = await onPrompt(userInput, userFiles);
				if (!success) {
					throw new Error(`Error processing chat`);
				}

				setFiles([]);
			} catch (e) {
				// throw the error
				toast.error(getGracefulErrorMessage(e));

				setFiles(userFiles);

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

		const getFileImage = (file: File): React.ReactNode => {
			if (file.type.startsWith("image/")) {
				const imageUrl = URL.createObjectURL(file);
				return (
					<img
						className="width-100"
						src={imageUrl}
						alt={file.name}
						onLoad={() => URL.revokeObjectURL(imageUrl)}
					/>
				);
			} else if (
				file.type.includes("text") ||
				file.type.includes("document")
			) {
				return (
					<FileType2Icon className="size-6 text-muted-foreground" />
				);
			} else if (file.type.includes("audio")) {
				return (
					<FileAudio2Icon className="size-6 text-muted-foreground" />
				);
			} else if (file.type.includes("video")) {
				return (
					<FileVideoCameraIcon className="size-6 text-muted-foreground" />
				);
			}

			return <FileIcon className="size-6 text-muted-foreground" />;
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
												e.dataTransfer.files ?? [],
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
											const updated = Array.from(
												e.clipboardData.files ?? [],
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
									const text = root.getTextContent();
									setInputText(text);
									setIsEmpty(text.trim().length === 0);
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
										<DropdownMenuTrigger
											style={{
												position: "fixed",
												top: menuPosition.top,
												left: menuPosition.left,
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

						<div className="flex flex-row items-center gap-1">
							<PromptOptimizer
								input={inputText}
								setInput={setInputFromOptimizer}
								disabled={Boolean(
									isLoading || hasOutstandingTools,
								)}
								modelId={model?.app_id || undefined}
								room={room}
							/>

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
												(
											hasToolsPaused ||
											hidePauseButton ? (
												<Spinner />
											) : (
												<Square
													className="size-3"
													fill="currentColor"
												/>
											)
										)
											) : (
											(
												<SendIcon />
										)
											)}
										</Button>
									</span>
								</TooltipTrigger>
								<TooltipContent>
									{(() => {
										if (isLoading)
											return hasToolsPaused || hidePauseButton
											? t("input.thinkingTooltip")
											: t("input.pauseToolsTooltip");
										if (isEmpty)
											return t("input.enterQuestion");
										if (hasOutstandingTools)
											return t("input.completeTool");
										return t("input.ask");
									})()}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>

				{files.length > 0 ? (
					<div className="flex flex-row items-center gap-2 pt-4">
						{files.map((f, fIdx) => {
							const fileKey = `${f.name}-${f.size}-${f.lastModified}`;
							return (
								<Tooltip key={fileKey}>
									<TooltipTrigger asChild>
										<div className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden border border-border bg-muted">
											{getFileImage(f)}
											<div className="absolute top-0 right-0 z-10 hidden group-hover:inline-flex">
												<Button
													variant="ghost"
													size={"icon-sm"}
													onClick={() => {
														const updated = [
															...files,
														];
														updated.splice(fIdx, 1);
														setFiles(updated);
													}}
												>
													<XIcon />
												</Button>
											</div>
										</div>
									</TooltipTrigger>
									<TooltipContent>{f.name}</TooltipContent>
								</Tooltip>
							);
						})}
					</div>
				) : null}
			</>
		);
	},
);
