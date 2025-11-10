import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CopyIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Button,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { InputMessageStore, type ResponseMessageStore } from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

// Styled components replaced with Tailwind classes inline

interface ResponseMessageProps {
	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ message }) => {
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

				toast.success("Successfully copied to clipboar");
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

		return (
			<div className="group mb-0 flex w-full flex-col gap-2 overflow-hidden">
				<div className="group flex flex-row items-center gap-2">
					<MessageCircleIcon className="size-4" />
					<span className="mr-0.5 font-medium text-base">Ask</span>
				</div>
				{message.text ? <Markdown>{message.text}</Markdown> : null}
				{message.tools.map((t) => (
					<ResponseMessageTool
						key={`tool-${t.id}`}
						message={message}
						tool={t}
					/>
				))}

				<div className="flex flex-1 flex-row items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					{inputMessage?.siblings.length > 1 && (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										disabled={!inputMessage.previousSibling}
										onClick={() => {
											if (!inputMessage.previousSibling) {
												return;
											}

											inputMessage.previousSibling.activateMessage();
										}}
									>
										<ArrowLeftIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
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
								<TooltipContent>Next Message</TooltipContent>
							</Tooltip>
						</>
					)}

					{inputMessage && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										rewriteMessage();
									}}
								>
									<RefreshCwIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Rewrite Message</TooltipContent>
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
						<TooltipContent>Share Positive Feedback</TooltipContent>
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
						<TooltipContent>Share Negative Feedback</TooltipContent>
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
						<TooltipContent>Copy Response</TooltipContent>
					</Tooltip>
				</div>
			</div>
		);
	},
);
