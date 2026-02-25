import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CircleAlert,
	CopyIcon,
	FileIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
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
import { RoomInlineTool } from "../room/room-inline-tool";
import { ResponseMessageText } from "./response-message-text";
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
		const { t } = useTranslation("chat");

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
					toast.success(t("notifications.feedbackSuccess"));
				}
			} catch (e) {
				toast.error(e.message);
			}
		};

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const handleRoomLink = useCallback(
			(path: string) => {
				const filename = path.split("/").filter(Boolean).pop() ?? path;

				room.addSidebarNode("FILE_EXPLORER", {
					type: "tab",
					name: "Files",
					component: "room-file-explorer",
					config: {},
					enableClose: true,
				});

				room.addSidebarNode(`FILE--${path}`, {
					type: "tab",
					name: filename,
					component: "room-file-editor",
					config: { name: filename, path },
					enableClose: true,
				});
			},
			[room],
		);

		const rewriteMessage = async () => {
			try {
				await message.rewriteMessage();

				toast.success(t("notifications.rewriteSuccess"));
			} catch (e) {
				toast.error(e.message);
			}
		};

		return (
			<HoverCard>
				<HoverCardTrigger asChild>
					<div className="mb-0 flex w-full flex-col gap-4 pr-3 sm:pr-10">
						{message.parts.map((p, pIdx) => {
							const key = `message-part-${pIdx}`;
							const isLast = pIdx === message.parts.length - 1;

							if (p.type === "TEXT") {
								return (
									<ResponseMessageText
										key={key}
										message={message}
										part={p}
										isLast={isLast}
										onRoomLink={handleRoomLink}
									/>
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
														name: p.mediaInfo
															.fileName,
														component:
															"room-file-editor",
														config: {
															name: p.mediaInfo
																.fileName,
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
										message={message}
										part={p}
										isLast={isLast}
									/>
								);
							} else if (p.type === "TOOL_CALL") {
								const tool = room.getTool(p.toolCall.id);

								// if tool is not found, return null
								if (!tool) {
									return null;
								}

								return (
									<div
										key={key}
										className="flex flex-col gap-2"
									>
										<ResponseMessageTool
											message={message}
											tool={tool}
										/>
										{tool.display === "inline" &&
											tool.isOpen && (
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
								{t("response.completeTools")}
							</p>
						)}
					</div>
				</HoverCardTrigger>
				<HoverCardContent
					className="flex w-auto flex-col items-center gap-0.5 p-1"
					side="right"
					align="start"
				>
					{inputMessage?.siblings.length > 1 && (
						<div className="flex flex-row items-center gap-0.5">
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
									{t("response.previousMessage")}
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
									{t("response.nextMessage")}
								</TooltipContent>
							</Tooltip>
						</div>
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
								{t("response.rewriteMessage")}
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
							{t("response.goodResponse")}
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
							{t("response.poorResponse")}
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
											} else if (part.type === "MEDIA") {
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
										toast.warning(
											t("notifications.noCopyContent"),
										);
										return;
									}

									try {
										navigator.clipboard.writeText(text);

										toast.success(
											t("notifications.copySuccess"),
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
							{t("response.copyResponse")}
						</TooltipContent>
					</Tooltip>
				</HoverCardContent>
			</HoverCard>
		);
	},
);
