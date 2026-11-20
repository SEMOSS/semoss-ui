import {
	CopyIcon,
	DownloadIcon,
	RefreshCwIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { ChatReasoning } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";
import { getErrorMessage } from "@semoss/utility/error";
import { useChatConfig } from "../../chat/config/use-chat-config";
import { InputMessageStore } from "../../room/store/input-message.store";
import type { ResponseMessageStore } from "../../room/store/response-message.store";
import type { RoomStore } from "../../room/store/room.store";
import { useMessage } from "../../room/store/use-message";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { STREAMING_PLACEHOLDER_ID } from "../../tools/mcp/mcp-constants";
import { MessageActions } from "./message-actions";
import { ResponseBranchNav } from "./response-branch-nav";
import { ResponseDownloadDialog } from "./response-download-dialog";
import { ResponseFeedbackDialog } from "./response-feedback-dialog";
import { ResponseMessageMedia } from "./response-message-media";
import { ResponseMessageSubagent } from "./response-message-subagent";
import { ResponseMessageText } from "./response-message-text";
import { ResponseMessageToolGroup } from "./response-message-tool-group";
import { groupToolActivity } from "./tool-activity";
import { useActiveIndex } from "./use-active-index";
import { useResponseFeedback } from "./use-response-feedback";

/**
 * Whether the message has streamed any real content yet. A freshly-created
 * streaming message starts with zero parts, so an empty array means nothing
 * has streamed. Used to tell a first view (start animations from 0) apart
 * from a return view (jump to the latest part/chunk/content).
 *
 * @param parts - The message's parts, with those of the messages folded into it.
 * @returns Whether any has content.
 */
const hasStreamedContent = (parts: ResponseMessageStore["parts"]) =>
	parts.some(
		(part) =>
			(part.type === "TEXT" && part.text.length > 0) ||
			(part.type === "THINKING" && part.thinking.length > 0) ||
			part.type === "TOOL_CALL" ||
			part.type === "MEDIA",
	);

/** Props for {@link ResponseMessage}. */
interface ResponseMessageProps {
	/** The room the message is in. */
	room: RoomStore;

	/** The response to render. */
	message: ResponseMessageStore;

	/** Tool-only messages folded into this one — see room-messages.tsx */
	subsequentTools?: ResponseMessageStore[];
}

/**
 * A response from the model: its parts revealed in order (text, reasoning,
 * media, tool calls, and subagents), then its actions: switching between
 * the branches of the user's message, Rewrite Message, rating, Copy, and Download.
 */
export const ResponseMessage = ({
	room,
	message,
	subsequentTools = [],
}: ResponseMessageProps) => {
	const { t } = useTranslation("chat");
	const { theme } = useChatConfig();

	// this message's own content renders only this message
	const { id, parts, isMessageThinking, feedbackRating, hasVisibleContent } =
		useMessage(message, (current) => ({
			id: current.id,
			parts: current.parts,
			isMessageThinking: current.isThinking,
			feedbackRating: current.feedback?.rating,
			hasVisibleContent: current.hasVisibleContent,
		}));
	// the folded tool messages, the parent input message, and the tool
	// calls are other stores in the room
	const subsequentParts = useRoomSelector(room, () =>
		subsequentTools.map((sub) => sub.parts),
	);
	const resolvedTools = useRoomSelector(room, (current) =>
		[message, ...subsequentTools].flatMap((item) =>
			item.parts.flatMap((part) =>
				part.type === "TOOL_CALL"
					? [current.getTool(part.toolCall.id)]
					: [],
			),
		),
	);
	const {
		inputMessage,
		isInputVisible,
		canRewrite,
		hasParentContent,
		isSubsequentThinking,
	} = useRoomSelector(room, () => {
		// get the parent input message
		const parent = message.parent;
		const input = parent instanceof InputMessageStore ? parent : null;
		return {
			inputMessage: input,
			isInputVisible: input?.visible ?? false,
			canRewrite: !!input?.parent?.parent,
			hasParentContent: input?.parts.some(
				(part) => part.type === "TEXT" || part.type === "MEDIA",
			),
			isSubsequentThinking: subsequentTools.some((m) => m.isThinking),
		};
	});

	const allParts = [...parts, ...subsequentParts.flat()];

	const isThinking = isMessageThinking || isSubsequentThinking;

	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
	// the action whose dialog is open, where focus goes back when it closes
	const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
	const isFeedbackTextEnabled = !!theme.featureFlags?.enableFeedbackText;
	const feedback = useResponseFeedback(message, isFeedbackTextEnabled);

	// Captured once at mount: was this the first time we saw this message
	// stream (it had no content yet), or are we returning to one already in
	// progress? Drives whether animations play from 0 or jump to the latest
	// part/chunk/content. Anchored here at the message level so a late-
	// mounting part (e.g. text revealed after thinking) still inherits the
	// correct decision instead of inferring it from its own mount.
	const [isFirstView] = useState(() => !hasStreamedContent(allParts));

	// Sequential reveal queue: parts animate in order, each waiting for the
	// part above to finish. Text parts type via their own nested typewriter;
	// thinking/media/tool parts snap to their final state but still wait their
	// turn. Once the message stops streaming, every part renders in full. On a
	// return view, seed at the latest part to jump straight to the frontier.
	const { chunkCallbacks, getChunkStatus } = useActiveIndex(
		allParts.length,
		isThinking,
		undefined,
		!isFirstView,
	);

	// Non-text parts (thinking, media, tools) snap to their final state, so
	// the queue moves past the active one the moment it is reached. Text parts
	// report their own completion once their typewriter catches up. Each
	// advance makes the next part active, which runs this again, until it
	// lands on a text part or on the part the queue holds (the last one while
	// streaming), where the advance bails; a part arriving below that one
	// gives the queue new callbacks, and the held part moves on.
	const activeIndex = allParts.findIndex(
		(_, index) => getChunkStatus(index) === "active",
	);
	const advanceActiveSnapPart =
		activeIndex !== -1 && allParts[activeIndex].type !== "TEXT"
			? chunkCallbacks[activeIndex]
			: undefined;
	useEffect(() => {
		advanceActiveSnapPart?.();
	}, [advanceActiveSnapPart]);

	/** Rewrite Message: send the user's message once more, as a new branch. */
	const handleRewrite = async () => {
		try {
			await message.rewriteMessage();

			toast.success(t("notifications.rewriteSuccess"));
		} catch (e: unknown) {
			toast.error(getErrorMessage(e));
		}
	};

	/** Copy the response's first image to the clipboard. */
	const handleCopyImage = async () => {
		const mediaPart = message.parts.find((p) => p.type === "MEDIA");
		if (
			!mediaPart ||
			mediaPart.type !== "MEDIA" ||
			!mediaPart.mediaInfo.base64Data
		)
			return;
		try {
			const mimeType = mediaPart.mediaInfo.mimeType;
			if (!mimeType || !mimeType.startsWith("image/")) {
				toast.error(t("notifications.invalidImage"));
				return;
			}
			const arr = decodeBase64ToBytes(mediaPart.mediaInfo.base64Data);
			const blob = new Blob([arr], { type: mimeType });
			await navigator.clipboard.write([
				new ClipboardItem({ [mimeType]: blob }),
			]);
			toast.success(t("notifications.copySuccess"));
		} catch (e: unknown) {
			toast.error(getErrorMessage(e));
		}
	};

	/** Copy the response as text, its files and tool calls by name. */
	const handleCopyText = async () => {
		const text = allParts
			.map((part) => {
				if (part.type === "TEXT") {
					return part.text;
				} else if (part.type === "MEDIA") {
					return `<${part.mediaInfo.fileName}>`;
				} else if (part.type === "TOOL_CALL") {
					return `<${part.toolCall.name}>`;
				}

				return "";
			})
			.join("\n");

		if (!text) {
			toast.warning(t("notifications.noCopyContent"));
			return;
		}

		try {
			await copyTextToClipboard(text);

			toast.success(t("notifications.copySuccess"));
		} catch (e: unknown) {
			toast.error(getErrorMessage(e));
		}
	};

	const toolsById = new Map(
		resolvedTools.flatMap((tool) => (tool ? [[tool.id, tool]] : [])),
	);
	const runsByPartIdx = groupToolActivity(allParts, (toolId) =>
		toolsById.get(toolId),
	);

	const hasText = parts.some((part) => part.type === "TEXT");

	const hasImage = parts.some(
		(part) => part.type === "MEDIA" && part.mediaInfo.base64Data,
	);

	const ratings = [
		{
			rating: true,
			label: t("response.goodResponse"),
			Icon: ThumbsUpIcon,
		},
		{
			rating: false,
			label: t("response.poorResponse"),
			Icon: ThumbsDownIcon,
		},
	];

	return (
		<div className="group/message relative min-w-0">
			<div className="flex w-full min-w-0 flex-col gap-4">
				{allParts.map((p, pIdx) => {
					const key = `message-part-${pIdx}`;
					const status = getChunkStatus(pIdx);

					// Not this part's turn yet — wait for the part above to finish.
					if (status === "not_started") {
						return null;
					}

					if (p.type === "TEXT") {
						return (
							<ResponseMessageText
								key={key}
								message={message}
								part={p}
								status={status}
								onComplete={chunkCallbacks[pIdx]}
								isFirstView={isFirstView}
							/>
						);
					} else if (p.type === "MEDIA") {
						return (
							<ResponseMessageMedia
								key={`${message.id}-part-${pIdx}`}
								room={room}
								mediaInfo={p.mediaInfo}
							/>
						);
					} else if (p.type === "THINKING") {
						if (!p.thinking && inputMessage && !isInputVisible) {
							return null;
						}
						return (
							<ChatReasoning
								key={key}
								thinking={p.thinking}
								isStreaming={status === "active"}
							/>
						);
					} else if (p.type === "TOOL_CALL") {
						const tools = runsByPartIdx.get(pIdx);
						return tools ? (
							<ResponseMessageToolGroup
								key={p.toolCall.id}
								tools={tools}
							/>
						) : null;
					} else if (p.type === "SUBAGENT") {
						return (
							<ResponseMessageSubagent
								key={key}
								message={message}
								part={p}
							/>
						);
					}

					return null;
				})}
				{!hasVisibleContent && id !== STREAMING_PLACEHOLDER_ID && (
					<p className="text-muted-foreground text-sm italic">
						{t("response.emptyResponse")}
					</p>
				)}
			</div>

			{inputMessage && (
				<ResponseBranchNav
					room={room}
					inputMessage={inputMessage}
					disabled={isMessageThinking}
				/>
			)}

			<MessageActions
				isDialogOpen={
					isDownloadDialogOpen || feedback.pendingRating !== null
				}
			>
				{theme.featureFlags?.enableRewrite && hasParentContent && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={isMessageThinking || !canRewrite}
								variant="ghost"
								size="icon-sm"
								aria-label={t("response.rewriteMessage")}
								onClick={() => {
									handleRewrite();
								}}
							>
								<RefreshCwIcon aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.rewriteMessage")}
						</TooltipContent>
					</Tooltip>
				)}

				{ratings.map(({ rating, label, Icon }) => (
					<Tooltip key={label}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={label}
								aria-pressed={feedbackRating === rating}
								disabled={isMessageThinking}
								onClick={(event) => {
									actionTriggerRef.current =
										event.currentTarget;
									feedback.rate(rating);
								}}
							>
								<Icon
									aria-hidden="true"
									fill={
										feedbackRating === rating
											? "currentColor"
											: "none"
									}
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">{label}</TooltipContent>
					</Tooltip>
				))}

				{hasImage && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("response.copyImage")}
								disabled={isMessageThinking}
								onClick={handleCopyImage}
							>
								<CopyIcon aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("response.copyImage")}
						</TooltipContent>
					</Tooltip>
				)}

				{hasText && (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("response.copyResponse")}
									disabled={
										isMessageThinking || parts.length === 0
									}
									onClick={handleCopyText}
								>
									<CopyIcon aria-hidden="true" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("response.copyResponse")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("download.title")}
									disabled={
										isMessageThinking || parts.length === 0
									}
									onClick={(event) => {
										actionTriggerRef.current =
											event.currentTarget;
										setIsDownloadDialogOpen(true);
									}}
								>
									<DownloadIcon aria-hidden="true" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("download.title")}
							</TooltipContent>
						</Tooltip>
					</>
				)}
			</MessageActions>

			{feedback.pendingRating !== null && (
				<ResponseFeedbackDialog
					rating={feedback.pendingRating}
					feedbackText={feedback.feedbackText}
					onFeedbackTextChange={feedback.setFeedbackText}
					onSubmit={feedback.submit}
					onCancel={feedback.cancel}
					returnFocusRef={actionTriggerRef}
				/>
			)}

			<ResponseDownloadDialog
				message={message}
				open={isDownloadDialogOpen}
				onOpenChange={setIsDownloadDialogOpen}
				returnFocusRef={actionTriggerRef}
			/>
		</div>
	);
};
