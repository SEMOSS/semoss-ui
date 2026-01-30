import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	SkipForwardIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import {
	Button,
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
			try {
				await message.recordFeedback(rating);

				toast.success("Successfully saved feedback");
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

		const areToolsActive =
			message.type === "RESPONSE" &&
			message.tools.some((tool) => !tool.response);

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
				<Markdown className="[&>*:first-child]:mt-0">
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
									<ThumbsUpIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Share Positive Feedback
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
									<ThumbsDownIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Share Negative Feedback
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

										copyMessage(message.text);
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
				</div>
			</div>
		);
	},
);
