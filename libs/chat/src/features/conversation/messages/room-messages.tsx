import { MoveDownIcon, MoveUpIcon, TriangleAlertIcon } from "lucide-react";
import { Fragment, type ReactNode, useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { ChatGeneratingIndicator } from "@semoss/shared";
import {
	Button,
	Muted,
	P,
	ScrollArea,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRoomOrContext } from "../../room/scope/room.context";
import type { InputMessageStore } from "../../room/store/input-message.store";
import { ResponseMessageStore } from "../../room/store/response-message.store";
import type { RoomStore } from "../../room/store/room.store";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { useGracefulErrors } from "../composer/use-graceful-errors";
import { ConversationScrollContext } from "../conversation-scroll.context";
import { RoomSuggestions } from "../suggestions/room-suggestions";
import { InputMessage } from "./input-message";
import { ModelRouterAttribution } from "./model-router-attribution";
import { ResponseMessage } from "./response-message";
import { RoomCompactionIndicator } from "./room-compaction-indicator";
import { RoomGreeting } from "./room-greeting";
import { readRoomTurnState } from "./room-turn-state";
import { useStickToBottomScroll } from "./use-stick-to-bottom-scroll";
import { useToolViewMessageBridge } from "./use-tool-view-message-bridge";

/** A message in the room's history. */
type RoomMessage = InputMessageStore | ResponseMessageStore;

/** A shown message, with the tool-only responses folded up into it. */
interface RoomHistoryEntry {
	/** The message. */
	message: RoomMessage;
	/** The tool-only responses after it, drawn as part of it. */
	subsequentTools: ResponseMessageStore[];
	/** Whether the model's name shows above it. */
	shouldShowModelName: boolean;
}

/** How many values {@link selectHistoryRows} gives each shown message. */
const ROW_STRIDE = 4;

/**
 * A response that's actively generating with nothing to show yet — no text,
 * tool calls, media, or even real thinking content — renders as no entry at
 * all; ChatGeneratingIndicator covers that window instead, so it never mounts
 * as its own block only to fold away again the moment it gets its first tool
 * call. The instant any real content exists (including thinking) it gets its
 * own entry immediately.
 *
 * @param m - The message.
 * @returns Whether it is still pending.
 */
const isPendingResponse = (m: RoomMessage): boolean =>
	m.type === "OUTPUT" &&
	m.isThinking &&
	!m.hasVisibleContent &&
	!m.parts.some(
		(part) => part.type === "THINKING" && part.thinking.length > 0,
	);

/**
 * The conversation's rows, flat so the room selector compares each value by
 * identity and a streamed token renders only the message it lands in: per
 * shown message, the message, whether it folds up into the response before
 * it, whether its model's name shows, and its ornaments.
 *
 * The history is one chain from the root, so a message's ancestors are the
 * root and the messages before it: the nearest visible one and the nearest
 * with a model are kept as the loop goes, rather than walked up to from every
 * message, which made each read grow with the square of the conversation.
 *
 * @param room - The room.
 * @returns {@link ROW_STRIDE} values per shown message.
 */
const selectHistoryRows = (room: RoomStore): unknown[] => {
	const rows: unknown[] = [];
	let hasAnchor = false;
	const root = room.root;
	// the nearest ancestor that is visible, and the nearest with a model
	let visibleAncestor: RoomMessage | null = null;
	let modelAncestorId: string | null = root?.modelId || null;
	for (const m of room.history) {
		const nearestVisible = visibleAncestor;
		const nearestModelId = modelAncestorId;
		if (m.visible) {
			visibleAncestor = m;
		}
		if (m.modelId) {
			modelAncestorId = m.modelId;
		}

		if (!m.visible || isPendingResponse(m)) {
			continue;
		}

		// A settled empty response is only meaningful as a direct reply to a
		// user turn. When its nearest non-hidden ancestor is another response —
		// e.g. the empty assistant message the backend commits after a stopped
		// tool phase — it's just noise, so skip it. (Still-thinking
		// placeholders are left alone so a streaming post-tool reply isn't
		// hidden.)
		if (
			m.type === "OUTPUT" &&
			!m.hasVisibleContent &&
			!m.isThinking &&
			nearestVisible?.type === "OUTPUT"
		) {
			continue;
		}

		const isFoldedUp = m.type === "OUTPUT" && m.shouldFoldUp && hasAnchor;
		if (!isFoldedUp) {
			hasAnchor = m.type === "OUTPUT";
		}

		// find the most recent ancestor that actually has a model; with none,
		// show this message's, else only a different one, to reduce clutter
		const shouldShowModelName =
			nearestModelId === null || m.modelId !== nearestModelId;

		rows.push(m, isFoldedUp, shouldShowModelName, m.ornaments);
	}
	return rows;
};

/**
 * Fold each run of tool-only responses up into the response preceding them.
 *
 * @param rows - The rows {@link selectHistoryRows} gave.
 * @returns The entries to render.
 */
const toHistoryEntries = (rows: readonly unknown[]): RoomHistoryEntry[] => {
	const entries: RoomHistoryEntry[] = [];
	let anchor: RoomHistoryEntry | null = null;
	for (let index = 0; index < rows.length; index += ROW_STRIDE) {
		const message = rows[index] as RoomMessage;
		if (rows[index + 1] && anchor && message.type === "OUTPUT") {
			anchor.subsequentTools.push(message);
			continue;
		}
		const entry: RoomHistoryEntry = {
			message,
			subsequentTools: [],
			shouldShowModelName: rows[index + 2] as boolean,
		};
		anchor = message.type === "OUTPUT" ? entry : null;
		entries.push(entry);
	}
	return entries;
};

/** Props for {@link RoomMessages}. */
interface RoomMessagesProps {
	/** The room whose conversation to show; defaults to the room in context. */
	room?: RoomStore;
	/**
	 * What follows the last response, such as follow-up prompts.
	 * Default: `RoomSuggestions`; null shows nothing.
	 */
	suggestions?: ReactNode;
}

/**
 * A room's conversation: its greeting, messages, progress, suggestions, and
 * error, in a scroll area that follows a streaming reply. Also runs the tool
 * results that tool views post to the window.
 */
export const RoomMessages = ({
	room: roomProp,
	suggestions,
}: RoomMessagesProps) => {
	const room = useRoomOrContext(roomProp);
	const { t } = useTranslation("room");
	const { t: tChat } = useTranslation("chat");
	const { getGracefulErrorMessage } = useGracefulErrors();
	const { isBusy, isStreamingContent, waitingAskToolCount } = useRoomSelector(
		room,
		readRoomTurnState,
	);
	const { agentGreeting, error, isAnyMessageStreaming } = useRoomSelector(
		room,
		(current) => ({
			agentGreeting: current.agentGreeting,
			error: current.error,
			isAnyMessageStreaming: current.history.some(
				(msg) => msg instanceof ResponseMessageStore && msg.isThinking,
			),
		}),
	);
	const historyRows = useRoomSelector(room, selectHistoryRows);

	// the room header floats over the conversation and blurs once it scrolls
	const reportConversationScrolled = useContext(ConversationScrollContext);
	const {
		viewportRef,
		contentRef,
		isScrollUpShown,
		isAwayFromBottom,
		scrollToTop,
		scrollToBottom,
	} = useStickToBottomScroll(
		isAnyMessageStreaming,
		reportConversationScrolled,
	);
	useToolViewMessageBridge(room);

	const roomHistoryEntries = toHistoryEntries(historyRows);

	return (
		<div className="relative w-full flex-1 overflow-hidden">
			<ScrollArea
				// Force Radix's table-display viewport wrapper to block so wide content can't push the column past the viewport width
				className="[&_[data-slot=scroll-area-viewport]>div]:block! h-full w-full overflow-hidden"
				viewportRef={viewportRef}
			>
				<div ref={contentRef}>
					<div className="mx-auto box-content flex max-w-3xl flex-col gap-4 @md:px-6 px-4 pt-20 pb-6 md:pt-17">
						{agentGreeting && (
							<RoomGreeting
								room={room}
								greeting={agentGreeting}
							/>
						)}
						{roomHistoryEntries.map(
							({
								message: m,
								subsequentTools,
								shouldShowModelName,
							}) => {
								return (
									<Fragment key={m.key}>
										{shouldShowModelName && (
											<div className="relative mb-4 flex flex-col items-center justify-center">
												<Muted className="z-10 bg-background px-2 text-xs leading-normal">
													{m.ornaments.modelName}
												</Muted>
												<Separator className="absolute top-1/2" />
											</div>
										)}
										{m.type === "INPUT" && (
											<InputMessage
												room={room}
												message={m}
											/>
										)}
										{m.type === "OUTPUT" && (
											<ResponseMessage
												room={room}
												message={m}
												subsequentTools={
													subsequentTools
												}
											/>
										)}

										{m.type === "OUTPUT" && (
											<ModelRouterAttribution
												routing={m.ornaments.routing}
											/>
										)}
										{subsequentTools.map((toolMessage) => (
											<ModelRouterAttribution
												key={toolMessage.key}
												routing={
													toolMessage.ornaments
														.routing
												}
											/>
										))}

										{m.type === "OUTPUT" && (
											<RoomCompactionIndicator
												message={m}
											/>
										)}
									</Fragment>
								);
							},
						)}
						<div className="-mt-4">
							<ChatGeneratingIndicator
								active={
									(isBusy && !isStreamingContent) ||
									waitingAskToolCount > 0
								}
								overrideMessage={
									waitingAskToolCount > 0
										? tChat("response.completeToolsAsk", {
												count: waitingAskToolCount,
											})
										: undefined
								}
							/>
						</div>
						{suggestions === undefined ? (
							<RoomSuggestions room={room} />
						) : (
							suggestions
						)}
					</div>
					{error ? (
						<div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
							<div className="flex h-10 w-10 items-center justify-center rounded-full">
								<TriangleAlertIcon
									aria-hidden="true"
									className="size-6"
								/>
							</div>
							<P>{getGracefulErrorMessage(error)}</P>
						</div>
					) : null}
				</div>
			</ScrollArea>

			{isScrollUpShown && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="absolute end-4 top-16 z-50 md:top-14">
							<Button
								size="icon-sm"
								variant={"outline"}
								onClick={scrollToTop}
								aria-label={t("content.scrollToTop")}
								className="shadow-lg"
							>
								<MoveUpIcon aria-hidden="true" />
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>{t("content.scrollToTop")}</TooltipContent>
				</Tooltip>
			)}

			{isAwayFromBottom && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="absolute end-4 bottom-4 z-50">
							<Button
								size="icon-sm"
								variant={"outline"}
								onClick={scrollToBottom}
								aria-label={t("content.scrollToBottom")}
								className="shadow-lg"
							>
								<MoveDownIcon aria-hidden="true" />
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>
						{t("content.scrollToBottom")}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};
