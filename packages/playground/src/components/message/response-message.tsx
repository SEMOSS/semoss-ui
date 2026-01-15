import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	DownloadIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {useState} from 'react';
import {
	Button,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import {
	InputMessageStore,
	type ResponseMessageStore,
	RootMessageStore,
} from "@/stores";
import { ResponseMessageTool } from "./response-message-tool";

interface ResponseMessageProps {
	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ message }) => {
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
			try {
				await message.recordFeedback(rating);
				toast.success("Successfully saved feedback");
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

		/**
		 * Download the response in specified format
		 * @param format - format to download (word, excel, pdf, powerpoint)
		 */
		const downloadResponse = async (format: string) => {
			try {
				await message.downloadResponse(format);
				toast.success(`Response downloaded successfully as ${format.toUpperCase()}`);
				setIsDownloadDialogOpen(false);
			} catch (e) {
				toast.error(e.message || "Failed to download response");
			}
		};

		const downloadFormats = [
			{ value: "word", label: "Word Document", extension: ".docx" },
			{ value: "excel", label: "Excel Spreadsheet", extension: ".xlsx" },
			{ value: "pdf", label: "PDF Document", extension: ".pdf" },
			{ value: "powerpoint", label: "PowerPoint Presentation", extension: ".pptx" },
		];

		return (
			<div className="group mb-0 flex w-full flex-col gap-2">
				<div className="group flex flex-row items-center gap-2">
					<MessageCircleIcon className="size-4" />
					<span className="mr-0.5 font-medium text-base">
						{message.model.name ?? "Agent"}
					</span>
				</div>
				{message.text ? (
					<Markdown className="[&>*:first-child]:mt-0">
						{message.text}
					</Markdown>
				) : null}
				{message.tools.map((t) => (
					<ResponseMessageTool
						key={`tool-${t.id}`}
						message={message}
						tool={t}
					/>
				))}
				{areToolsActive && (
					<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
						<CircleAlert className="size-4" />
						Please complete the tool(s) to proceed.
					</p>
				)}

				<div className="-ml-2.5 flex flex-1 flex-row items-center justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
										inputMessage.parent instanceof RootMessageStore ||
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

				<Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Download Response</DialogTitle>
							<DialogDescription>
								Choose the format you'd like to download your response as:
							</DialogDescription>
						</DialogHeader>
						<div className="grid grid-cols-2 gap-3 py-4">
							{downloadFormats.map((format) => (
								<Button
									key={format.value}
									variant="outline"
									className="h-auto flex-col gap-1 p-4"
									onClick={() => downloadResponse(format.value)}
								>
									<span className="font-medium">{format.label}</span>
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