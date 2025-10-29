import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CopyIcon,
	MessageCircleIcon,
	RefreshCcwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button, Markdown, toast } from "@semoss/ui/next";
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
			<div className="flex w-full flex-col gap-2 overflow-hidden">
				<div className="group flex flex-row items-center gap-2">
					<MessageCircleIcon className="size-4" />
					<span className="mr-0.5 font-medium text-base">Ask</span>
					<div className="flex flex-1 flex-row items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						{inputMessage?.siblings.length > 1 && (
							<>
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
								<span className="text-muted-foreground text-xs">
									{inputMessage.position + 1}/
									{inputMessage.siblings.length}
								</span>
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
							</>
						)}

						{inputMessage && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									rewriteMessage();
								}}
							>
								<RefreshCcwIcon />
							</Button>
						)}

						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								recordFeedback(true);
							}}
						>
							<ThumbsUpIcon />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								recordFeedback(false);
							}}
						>
							<ThumbsDownIcon />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
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
					</div>
				</div>
				{message.text ? <Markdown>{message.text}</Markdown> : null}
				{message.tools.map((t) => (
					<ResponseMessageTool
						key={`tool-${t.id}`}
						message={message}
						tool={t}
					/>
				))}
			</div>
		);
	},
);
