import {
	FileAudio2Icon,
	FileIcon,
	FileType2Icon,
	FileVideoCameraIcon,
	MicIcon,
	PaperclipIcon,
	SendIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";

const ENABLE_ATTACHMENT = import.meta.env.VITE_ENABLE_ATTACHMENT === "true";

interface RoomInputProps {
	prompt: string;

	onPromptChange: React.Dispatch<React.SetStateAction<string>>;
	/** Track if it is loading */
	isLoading: boolean;

	/** Track if it is disabled */
	isDisabled: boolean;

	/** Minimum number of rendered rows rows */
	minRows: number;

	/** Maximum number of rendered rows rows */
	maxRows: number;

	/** Workspace toggle */
	workspace?: React.ReactNode;

	/** Configuration toggle */
	configuration?: React.ReactNode;

	/** Callback triggered to process the prompt. Throw an error if necessary */
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;

	/** Optionally clear the input when the user asks a question */
	clearInputOnPrompt?: boolean;
}

export const RoomInput: React.FC<RoomInputProps> = observer(
	({
		prompt,
		onPromptChange,
		isLoading,
		isDisabled,
		minRows = 2,
		maxRows = 6,
		workspace = null,
		configuration = null,
		onPrompt = () => null,
		clearInputOnPrompt = false,
	}) => {
		const isEmpty = prompt.trim().length === 0;

		const fileRef = useRef<HTMLInputElement>(null);
		const inputRef = useRef<HTMLTextAreaElement>(null);

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
						onPromptChange((prev) => {
							if (!prev) {
								return transcript;
							}

							return `${prev} ${transcript}`;
						});
					}
				};

				recognition.onerror = (event) => {
					console.error(event);

					// turn off and focus on element
					setIsListening(false);
					inputRef.current?.focus();
				};

				recognition.onend = () => {
					// turn off and focus on element
					setIsListening(false);
					inputRef.current?.focus();
				};

				recognitionRef.current = recognition;
			} else {
				setCanListen(false);
			}

			return () => {
				if (recognitionRef.current) {
					recognitionRef.current.stop();
				}
			};
		}, [onPromptChange]);

		/**
		 * Prompt the model
		 *
		 * @param - input
		 */
		const promptModel = async () => {
			let success = false;
			// store old options
			const userInput = prompt;
			const userFiles = files;
			try {
				// ignore if loading
				if (isDisabled || isLoading) {
					return;
				}

				// clear out the input components
				if (clearInputOnPrompt) {
					onPromptChange("");
					setFiles([]);
				}
				success = await onPrompt(userInput, userFiles);
				if (!success) {
					throw new Error(`Error processing chat`);
				}
			} catch (e) {
				toast.error(e.message);
			} finally {
				if (success) {
					// clear the input + files
					onPromptChange("");
					setFiles([]);
				} else if (!clearInputOnPrompt) {
					// restore to original
					onPromptChange(userInput);
					setFiles(userFiles);
				}
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

		/**
		 * Start Listening
		 */
		const startListening = () => {
			if (recognitionRef.current && !isListening) {
				recognitionRef.current.start();
			}
		};

		/**
		 * Stop Listening
		 */
		const stopListening = () => {
			if (recognitionRef.current && isListening) {
				recognitionRef.current.stop();
			}
		};

		return (
			<>
				<div className="relative w-full">
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
					<div className="relative">
						<Textarea
							ref={inputRef}
							placeholder="What do you want to do today?"
							value={prompt}
							disabled={isDisabled}
							rows={minRows}
							className={`w-full resize-none px-3 pt-3 pb-14${
								isDragging
									? "border-primary border-dashed"
									: "hover:border-primary"
							}rounded-md bg-background shadow-lg transition-colors`}
							autoFocus={true}
							style={{
								minHeight: `${minRows * 3}rem`,
								maxHeight: `${maxRows * 3}rem`,
							}}
							onChange={(e) => {
								onPromptChange(e.target.value);
							}}
							onDrop={(e) => {
								e.preventDefault();

								// set the new files
								const updated = Array.from(
									e.dataTransfer.files,
								);
								setFiles((prev) => [...prev, ...updated]);

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
								// Only handle file pasting if attachments are enabled
								if (!ENABLE_ATTACHMENT) {
									return;
								}

								// set the new files
								const updated = Array.from(
									e.clipboardData.files,
								);

								if (updated.length > 0) {
									e.preventDefault();
									setFiles((prev) => [...prev, ...updated]);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									// allow new lines with shift
									if (e.shiftKey) {
										return;
									}

									// prompt the model
									e.preventDefault();
									promptModel();
								}
							}}
						/>
					</div>
					<div className="absolute bottom-3 left-3 z-10 flex flex-row items-center">
						{workspace}
					</div>
					<div className="absolute right-3 bottom-3 z-10 flex flex-row items-center gap-4">
						<div className="flex flex-row items-center">
							{ENABLE_ATTACHMENT && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Attach Documents"
											disabled={isDisabled || isLoading}
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												fileRef.current?.click();
											}}
										>
											<PaperclipIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Attach Document
									</TooltipContent>
								</Tooltip>
							)}

							{configuration}

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={"ghost"}
										aria-label="Record the Model"
										size="icon-sm"
										disabled={
											!canListen ||
											isDisabled ||
											isLoading
										}
										onClick={() => {
											if (isListening) {
												stopListening();
											} else {
												startListening();
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
								<Button
									variant="default"
									aria-label="Prompt the Model"
									disabled={
										isDisabled || isLoading || isEmpty
									}
									onClick={() => {
										promptModel();
									}}
								>
									{isLoading ? <Spinner /> : <SendIcon />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{(() => {
									if (isLoading) {
										return "Processing prompt";
									} else if (isEmpty) {
										return "Please enter a prompt";
									} else if (isDisabled) {
										return "";
									}
									return "Prompt";
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
