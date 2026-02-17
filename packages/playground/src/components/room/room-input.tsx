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
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import type { Engine } from "@/types";
import { ContextChart } from "./context-chart";

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

	/** Percentage of context used */
	tokensMax?: number;
	tokensUsed?: number;
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
		tokensMax,
		tokensUsed,
	}) => {
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);

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
				success = await onPrompt(userInput, userFiles);
				if (!success) {
					throw new Error(`Error processing chat`);
				}

				// clear the files
				setFiles([]);
			} catch (e) {
				// throw the error
				toast.error(e.message);

				// keep the files
				setFiles(userFiles);

				// keep the view
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const textNode = $createTextNode(userInput);
					root.append(textNode);
				});
			}
		};

		/**
		 * Get an image for the file
		 */
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
							// set the new files
							const updated = Array.from(e.target.files);
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
											`h-auto w-full overflow-y-auto rounded-md border border-input bg-transparent p-4 pb-14 text-sm shadow-lg outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40`,
											isDragging
												? "border-primary border-dashed"
												: "hover:border-primary",
											className,
										)}
										aria-placeholder={"Enter text"}
										aria-disabled={isLoading}
										disabled={isLoading}
										placeholder={
											<div className="pointer-events-none absolute top-0 left-0 inline-flex select-none flex-wrap items-center gap-1 p-4 text-muted-foreground text-sm">
												<SparklesIcon className="size-4" />
												{isLoading
													? "Thinking..."
													: "/ to open menu"}
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
					{!isLoading && (
						<div className="absolute bottom-3 left-3 z-10 flex flex-row items-center gap-2">
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
												aria-label="Open settings"
											>
												<SlidersHorizontalIcon />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>
										Open settings
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
							<ContextChart
								tokensUsed={tokensUsed}
								tokensMax={tokensMax}
							/>
						</div>
					)}
					<div className="absolute right-3 bottom-3 z-10 flex flex-row items-center gap-4">
						<div className="flex flex-row items-center gap-1">
							<EngineSelect
								className="h-8 w-48 gap-0.5 px-2 py-1 text-xs [&>svg]:hidden"
								disabled={isLoading}
								name={model?.app_name || ""}
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
										aria-label="Record the Model"
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
									{isListening ? "Stop Recording" : "Record"}
								</TooltipContent>
							</Tooltip>
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Button
										variant="default"
										aria-label="Ask the AI"
										disabled={
											isLoading ||
											isEmpty ||
											hasOutstandingTools
										}
										onClick={() => {
											promptModel();
										}}
									>
										{isLoading ? <Spinner /> : <SendIcon />}
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{(() => {
									if (isLoading) {
										return "Thinking";
									} else if (isEmpty) {
										return "Please enter a question";
									} else if (hasOutstandingTools) {
										return "Please complete the tool(s) to proceed";
									}
									return "Ask";
								})()}
							</TooltipContent>
						</Tooltip>
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

														// remove it
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
