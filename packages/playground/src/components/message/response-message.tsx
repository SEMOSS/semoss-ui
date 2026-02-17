import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	FileIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Button,
	Code,
	Markdown,
	ScrollArea,
	ScrollBar,
	Table,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
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
		// const typewriter = useMarkdownTypewriter(message.text);
		//
		// useEffect(() => {
		// 	if (message.isThinking) {
		// 		typewriter.start();
		// 	}
		// }, [message.isThinking, typewriter.start]);

		// get the parent input message
		let inputMessage: InputMessageStore | null = null;
		if (message.parent instanceof InputMessageStore) {
			inputMessage = message.parent;
		}

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
		 * Copy the text
		 * @param text - text to copy
		 */
		const rewriteMessage = async () => {
			try {
				await message.rewriteMessage();

				toast.success("Successfully rewrote message");
			} catch (e) {
				toast.error(e.message);
			}
		};

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
				table: ({ ...props }) => (
					<ScrollArea className="w-full">
						<ScrollBar orientation="horizontal"></ScrollBar>
						<Table {...props} />
					</ScrollArea>
				),
			};
		}, []);

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
				{message.parts.map((p, pIdx) => {
					const key = `message-part-${pIdx}`;

					if (p.type === "TEXT") {
						return (
							<Markdown
								key={key}
								components={markdownComponents}
								className="[&>*:first-child]:mt-0"
							>
								{p.text}
							</Markdown>
						);
					} else if (p.type === "MEDIA") {
						return (
							<div key={`${message.id}-part-${pIdx}`}>
								<button
									type="button"
									className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
									onClick={() => {
										// this will select if there or open if not
										room.addSidebarNode(
											`FILE--${p.mediaInfo.fileLocation}`,
											{
												type: "tab",
												name: p.mediaInfo.fileName,
												component: "room-file-editor",
												config: {
													name: p.mediaInfo.fileName,
													path: p.mediaInfo
														.fileLocation,
												},
												enableClose: true,
											},
										);
									}}
									aria-label={`View ${p.mediaInfo.fileName}`}
								>
									{p.mediaInfo.mimeType?.startsWith(
										"image/",
									) ? (
										<img
											className="w-full"
											src={`data:image/png;base64,${p.mediaInfo.base64Data}`}
											alt={p.mediaInfo.fileName}
										/>
									) : (
										<FileIcon className="size-6 text-muted-foreground" />
									)}
								</button>
							</div>
						);
					} else if (p.type === "THINKING") {
						return (
							<ResponseMessageThinking
								key={key}
								room={room}
								message={message}
								part={p}
							/>
						);
					} else if (p.type === "TOOL_CALL") {
						const tool = room.getTool(p.toolCall.id);

						// if tool is not found, return null
						if (!tool) {
							return null;
						}

						return (
							<div key={key} className="flex flex-col gap-2">
								<ResponseMessageTool
									message={message}
									tool={tool}
								/>
								{tool.display === "inline" && tool.isOpen && (
									<RoomInlineTool
										room={room}
										message={message}
										tool={tool}
									/>
								)}
							</div>
						);
					}

					return null;
				})}
				{message.hasUnfinishedTools && (
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
									disabled={message.parts.length === 0}
									onClick={() => {
										const text = message.parts
											.map((part) => {
												if (part.type === "TEXT") {
													return part.text;
												} else if (
													part.type === "MEDIA"
												) {
													return `<${part.mediaInfo.fileName}?`;
												} else if (
													part.type === "TOOL_CALL"
												) {
													return `<${part.toolCall.name}?`;
												}

												return "";
											})
											.join("\n");

										if (!text) {
											toast.warning("No content to copy");
											return;
										}

										try {
											navigator.clipboard.writeText(text);

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

					{/* {typewriter.isTyping && !message.isThinking && (
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
					)} */}
				</div>
			</div>
		);
	},
);
