import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	DownloadIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	SkipForwardIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useMarkdownTypewriter } from "@/hooks";
import {
	InputMessageStore,
	type ResponseMessageStore,
	type RoomStore,
} from "@/stores";
import { AppLogo } from "../common";
import { RoomInlineTool } from "../room/room-inline-tool";
import { ResponseMessageThinking } from "./response-message-thinking";
import { ResponseMessageTool } from "./response-message-tool";

interface ResponseMessageProps {
	/** Room */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ room, message }) => {
		const typewriter = useMarkdownTypewriter(message.text);

		useEffect(() => {
			if (message.isThinking) {
				typewriter.start();
			}
		}, [message.isThinking, typewriter.start]);

		const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

		// get the parent input message
		let inputMessage: InputMessageStore | null = null;
		if (message.parent instanceof InputMessageStore) {
			inputMessage = message.parent;
		}

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const copyMessage = (text: string) => {
			try {
				navigator.clipboard.writeText(text);
				toast.success("Successfully copied to clipboard");
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Record the feedback
		 * @param rating - positive or negative
		 */
		const recordFeedback = async (rating: boolean) => {
			const isDeleting = message.feedback?.rating === rating;
			try {
				await message.recordFeedback(isDeleting ? null : rating);
				if (!isDeleting) {
					toast.success("Thank you for the feedback!");
				}
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Rewrite the message
		 */
		const rewriteMessage = async () => {
			try {
				await message.rewriteMessage();
				toast.success("Successfully rewrote message");
			} catch (e) {
				toast.error(e.message);
			}
		};

		const areToolsActive =
			message.type === "RESPONSE" &&
			message.tools.some((tool) => !tool.response);

		const markdownComponents = useMemo(() => {
			return {
				code: ({ children, className, ...props }) => {
					const match = /language-(\w+)/.exec(className || "");
					const code = children as string;

					let lang: string = "";
					if (match?.[1]) {
						lang = match[1];
					}

					return (
						<div className="group/response-markdown relative">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="absolute top-0 right-0 bg-background opacity-0 transition-opacity group-hover/response-markdown:opacity-100"
										variant="ghost"
										size="icon"
										disabled={!code}
										onClick={() => {
											try {
												navigator.clipboard.writeText(
													code,
												);

												toast.success(
													"Successfully copied to clipboard",
												);
											} catch (e) {
												toast.error(e.message);
											}
										}}
									>
										<CopyIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Copy Code
								</TooltipContent>
							</Tooltip>
							<Code
								code={code}
								lang={lang || undefined}
								{...props}
							/>
						</div>
					);
				},
			};
		}, []);

		/**
		 * Download the response in specified format
		 * @param format - format to download (word, pdf)
		 */
		const downloadResponse = async (format: string) => {
			try {
				await message.downloadResponse(format);
				toast.success(
					`Response downloaded successfully as ${format.toUpperCase()}`,
				);
				setIsDownloadDialogOpen(false);
			} catch (e) {
				toast.error(e.message || "Failed to download response");
			}
		};

		const downloadFormats = [
			{ value: "word", label: "Word Document", extension: ".docx" },
			{ value: "pdf", label: "PDF Document", extension: ".pdf" },
		];

		return (
			<div className="group mb-0 flex w-full flex-col gap-4">
				<div className="group flex flex-row items-center gap-2">
					{message.isThinking ? (
						<div className="flex size-4 animate-spin items-center justify-center">
							<AppLogo full={false} />
						</div>
					) : (
						<MessageCircleIcon className="size-4" />
					)}
					<span className="mr-0.5 font-medium text-base">
						{message.model.name ?? "Agent"}
					</span>
				</div>
				<ResponseMessageThinking room={room} message={message} />
				<Markdown
					components={markdownComponents}
					className="[&>*:first-child]:mt-0"
				>
					{typewriter.isTyping ? typewriter.rendered : message.text}
				</Markdown>
				{message.tools.map((t) => {
					return (
						<div
							key={`tool-${t.id}`}
							className="flex flex-col gap-2"
						>
							<ResponseMessageTool message={message} tool={t} />
							{t.display === "inline" && t.isOpen && (
								<RoomInlineTool
									room={room}
									message={message}
									tool={t}
								/>
							)}
						</div>
					);
				})}
				{areToolsActive && (
					<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
						<CircleAlert className="size-4" />
						Please complete the tool(s) to proceed.
					</p>
				)}
				<div className="-ml-2.5 flex flex-1 flex-row items-center justify-start">
					<div className="flex flex-row items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						{inputMessage?.siblings.length > 1 && (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											disabled={
												!inputMessage.previousSibling
											}
											onClick={() => {
												if (
													!inputMessage.previousSibling
												) {
													return;
												}

												inputMessage.previousSibling.activateMessage();
											}}
										>
											<ArrowLeftIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										Previous Message
									</TooltipContent>
								</Tooltip>
								<span className="text-muted-foreground text-xs">
									{inputMessage.position + 1}/
									{inputMessage.siblings.length}
								</span>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											disabled={!inputMessage.nextSibling}
											onClick={() => {
												if (!inputMessage.nextSibling) {
													return;
												}

												inputMessage.nextSibling.activateMessage();
											}}
										>
											<ArrowRightIcon />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										Next Message
									</TooltipContent>
								</Tooltip>
							</>
						)}

						{inputMessage && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={
											!inputMessage.parent?.parent ||
											message.room.mode === "executing"
										}
										variant="ghost"
										size="icon"
										onClick={() => {
											rewriteMessage();
										}}
									>
										<RefreshCwIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Rewrite Message
								</TooltipContent>
							</Tooltip>
						)}

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										recordFeedback(true);
									}}
								>
									<ThumbsUpIcon
										fill={
											message.feedback?.rating === true
												? "currentColor"
												: "none"
										}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Good response
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										recordFeedback(false);
									}}
								>
									<ThumbsDownIcon
										fill={
											message.feedback?.rating === false
												? "currentColor"
												: "none"
										}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Poor response
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={!message.text}
									onClick={() => {
										if (!message.text) {
											return;
										}
										try {
											navigator.clipboard.writeText(
												message.text,
											);

											toast.success(
												"Successfully copied to clipboard",
											);
										} catch (e) {
											toast.error(e.message);
										}
									}}
								>
									<CopyIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Copy Response
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex-1" />

					{typewriter.isTyping && !message.isThinking && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={!message.text}
									onClick={() => typewriter.skipToEnd()}
								>
									<SkipForwardIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Fast Forward to End
							</TooltipContent>
						</Tooltip>
					)}

					{/* Separate Tooltip for Download Button */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								disabled={!message.text}
								onClick={() => setIsDownloadDialogOpen(true)}
							>
								<DownloadIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Download Response
						</TooltipContent>
					</Tooltip>
				</div>

				<Dialog
					open={isDownloadDialogOpen}
					onOpenChange={setIsDownloadDialogOpen}
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Download Response</DialogTitle>
							<DialogDescription>
								Choose the format you'd like to download your
								response as:
							</DialogDescription>
						</DialogHeader>
						<div className="grid grid-cols-2 gap-3 py-4">
							{downloadFormats.map((format) => (
								<Button
									key={format.value}
									variant="outline"
									className="h-auto flex-col gap-1 p-4"
									onClick={() =>
										downloadResponse(format.value)
									}
								>
									<span className="font-medium">
										{format.label}
									</span>
									<span className="text-muted-foreground text-xs">
										{format.extension}
									</span>
								</Button>
							))}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
