import { MoveDownIcon, MoveUpIcon, TriangleAlertIcon } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPToolResponse } from "@semoss/sdk";
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
import { decideAgentToolAction } from "../messages/agent-harness";
import { InputMessage } from "../messages/input-message";
import type { InputMessageStore } from "../messages/input-message.store";
import { ResponseMessage } from "../messages/response-message";
import { ResponseMessageStore } from "../messages/response-message.store";
import { useRoomOrContext } from "../room/room.context";
import type { RoomStore } from "../room/room.store";
import { useRoomSelector } from "../room/use-room-selector";
import { ConversationScrollContext } from "./conversation-scroll.context";
import { ModelRouterAttribution } from "./model-router-attribution";
import { RoomCompactionIndicator } from "./room-compaction-indicator";
import { RoomGreeting } from "./room-greeting";
import { RoomSuggestions } from "./room-suggestions";
import { readRoomTurnState } from "./room-turn-state";
import { useGracefulErrors } from "./use-graceful-errors";

const SCROLL_THRESHOLD = 150;

type RoomMessage = InputMessageStore | ResponseMessageStore;

/** A shown message, with the tool-only responses folded up into it. */
interface RoomHistoryEntry {
	message: RoomMessage;
	subsequentTools: ResponseMessageStore[];
	/** Whether the model's name shows above it. */
	showModelName: boolean;
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
 * @param room - The room.
 * @returns {@link ROW_STRIDE} values per shown message.
 */
const selectHistoryRows = (room: RoomStore): unknown[] => {
	const rows: unknown[] = [];
	let hasAnchor = false;
	for (const m of room.history) {
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
			m.findAncestor((a) => a.visible)?.type === "OUTPUT"
		) {
			continue;
		}

		const isFoldedUp = m.type === "OUTPUT" && m.shouldFoldUp && hasAnchor;
		if (!isFoldedUp) {
			hasAnchor = m.type === "OUTPUT";
		}

		// find the most recent ancestor that actually has a model; with none,
		// show this message's, else only a different one, to reduce clutter
		const ancestor = m.findAncestor((a) => !!a.modelId);
		const showModelName = !ancestor || m.modelId !== ancestor.modelId;

		rows.push(m, isFoldedUp, showModelName, m.ornaments);
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
			showModelName: rows[index + 2] as boolean,
		};
		anchor = message.type === "OUTPUT" ? entry : null;
		entries.push(entry);
	}
	return entries;
};

interface RoomMessagesProps {
	/** The room whose conversation to show. */
	room?: RoomStore;
}

/**
 * A room's conversation: its greeting, messages, progress, suggestions, and
 * error, in a scroll area that follows a streaming reply. Also runs the tool
 * results that tool views post to the window.
 */
export const RoomMessages = ({ room: roomProp }: RoomMessagesProps) => {
	const room = useRoomOrContext(roomProp);
	const { t } = useTranslation("room");
	const { t: tChat } = useTranslation("chat");
	const { getGracefulErrorMessage } = useGracefulErrors();
	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [contentEle, setContentEle] = useState<HTMLDivElement | null>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [showScrollup, setShowScrollup] = useState(false);
	const [showScrolldown, setShowScrolldown] = useState(false);
	const [isScrollLocked, setIsScrollLocked] = useState(false);
	const { isBusy, isStreamingContent, waitingAskToolCount } = useRoomSelector(
		room,
		readRoomTurnState,
	);
	const { agentGreeting, isSuggesting, error, isAnyMessageStreaming } =
		useRoomSelector(room, (current) => ({
			agentGreeting: current.agentGreeting,
			isSuggesting: !!current.theme.featureFlags?.enableSuggestions,
			error: current.error,
			isAnyMessageStreaming: current.history.some(
				(msg) => msg instanceof ResponseMessageStore && msg.isThinking,
			),
		}));
	const historyRows = useRoomSelector(room, selectHistoryRows);

	// the room header floats over the conversation and blurs once it scrolls
	const reportConversationScrolled = useContext(ConversationScrollContext);

	/**
	 * Handle scroll events to detect user scrolling
	 */
	const handleScroll = useCallback(() => {
		// the effect that calls this only does so once the element exists
		if (!scrollEle) return;

		reportConversationScrolled?.(scrollEle.scrollTop > 0);

		// show scroll up if near the top
		if (scrollEle.scrollTop > SCROLL_THRESHOLD) {
			setShowScrollup(true);
		} else {
			setShowScrollup(false);
		}

		// Check if user is at the bottom
		const isAtBottom =
			scrollEle.scrollHeight -
				scrollEle.scrollTop -
				scrollEle.clientHeight <=
			SCROLL_THRESHOLD;

		// show scroll down if not at bottom
		if (isAtBottom) {
			setShowScrolldown(false);
			// Unlock scroll when user scrolls back to bottom
			setIsScrollLocked(false);
		} else {
			setShowScrolldown(true);
			// Lock scroll when user scrolls away from bottom
			setIsScrollLocked(true);
		}
	}, [scrollEle, reportConversationScrolled]);

	/**
	 * Scroll to target position based on direction
	 */
	const scrollToTarget = useCallback(
		(target: number = 0) => {
			if (!scrollEle) {
				return;
			}

			scrollEle.scrollTo({
				top: target,
				behavior: "smooth",
			});
		},
		[scrollEle],
	);

	/**
	 * Effects
	 */

	// create a listener to process messages from the room
	useEffect(() => {
		const handleMessage = async (
			event: MessageEvent<{
				type: "SMSS_EXEC_TOOL";
				tool: MCPToolResponse;
			}>,
		) => {
			try {
				if (!event.data || event.data.type !== "SMSS_EXEC_TOOL") {
					return;
				}

				const tool = event.data.tool;

				// An agent-run tool paused on a decision must resume through
				// the AGENT_RUN_ACTION row, not room.processTool's legacy
				// room-write path — see decideAgentToolAction.
				const liveTool = room.getTool(tool.id);
				if (liveTool?.pendingAction) {
					const isCancelled =
						tool.tool_status === "cancelled" ||
						tool.tool_status === "paused";
					await decideAgentToolAction(
						liveTool,
						isCancelled ? "reject" : "submit",
						tool.executedParameters ?? {},
					);
					return;
				}

				room.processTool(
					tool.message,
					tool.id,
					tool.response,
					// "paused" is retired — fold any legacy iframe status into cancelled
					tool.tool_status === "paused"
						? "cancelled"
						: tool.tool_status,
					tool.executedParameters ?? {},
				);
			} catch {
				// noop
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [room]);

	// Initial scroll to bottom when scroll element is first available
	useEffect(() => {
		if (!scrollEle) {
			return;
		}

		setIsScrollLocked(false);
		requestAnimationFrame(() => {
			scrollEle.scrollTop = scrollEle.scrollHeight;
		});
	}, [scrollEle]);

	// Scroll once when an active stream settles. Scheduling from the transition
	// itself prevents a stale completion request from being consumed by a later,
	// unrelated resize such as the user opening a grouped tool.
	const wasMessageStreamingRef = React.useRef(false);
	useEffect(() => {
		const wasMessageStreaming = wasMessageStreamingRef.current;
		wasMessageStreamingRef.current = isAnyMessageStreaming;

		if (isAnyMessageStreaming || !wasMessageStreaming || !scrollEle) {
			return;
		}

		setIsScrollLocked(false);
		const frame = requestAnimationFrame(() => {
			scrollEle.scrollTo({
				top: scrollEle.scrollHeight,
				behavior: "smooth",
			});
		});

		return () => cancelAnimationFrame(frame);
	}, [isAnyMessageStreaming, scrollEle]);

	// Auto-scroll to bottom when content grows (streaming), unless user has scrolled away intentionally
	// biome-ignore lint/correctness/useExhaustiveDependencies: contentHeight is used as a trigger
	useEffect(() => {
		if (!scrollEle || isScrollLocked) {
			return;
		}

		// Only auto-scroll if actively streaming to avoid jumping after completion
		if (!isAnyMessageStreaming) {
			return;
		}

		requestAnimationFrame(() => {
			scrollEle.scrollTop = scrollEle.scrollHeight;
		});
	}, [scrollEle, isScrollLocked, contentHeight, isAnyMessageStreaming]);

	/**
	 * Set up scroll event listener
	 */
	useEffect(() => {
		if (!scrollEle) {
			return;
		}

		// Throttle scroll events for better performance
		let ticking = false;

		const throttledHandleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		};

		scrollEle.addEventListener("scroll", throttledHandleScroll, {
			passive: true,
		});

		// Initial check
		handleScroll();

		return () => {
			scrollEle.removeEventListener("scroll", throttledHandleScroll);
		};
	}, [scrollEle, handleScroll]);

	/**
	 * Set up content listener
	 */
	useEffect(() => {
		if (!contentEle) {
			return;
		}

		// observe content height changes
		const observer = new ResizeObserver(() => {
			if (contentEle) {
				setContentHeight(contentEle.clientHeight);
			}
		});

		observer.observe(contentEle);

		return () => {
			observer.disconnect();
		};
	}, [contentEle]);

	const roomHistoryEntries = toHistoryEntries(historyRows);

	return (
		<div className="relative w-full flex-1 overflow-hidden">
			<ScrollArea
				// Force Radix's table-display viewport wrapper to block so wide content can't push the column past the viewport width
				className="[&_[data-slot=scroll-area-viewport]>div]:block! h-full w-full overflow-hidden"
				viewportRef={(ele) => {
					setScrollEle(ele);
				}}
			>
				<div
					ref={(ele) => {
						setContentEle(ele);
					}}
				>
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
								showModelName,
							}) => {
								return (
									<React.Fragment key={m.key}>
										{showModelName && (
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
									</React.Fragment>
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
						{isSuggesting && <RoomSuggestions room={room} />}
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

			{showScrollup && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="absolute end-4 top-16 z-50 md:top-14">
							<Button
								size="icon-sm"
								variant={"outline"}
								onClick={() => scrollToTarget(0)}
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

			{showScrolldown && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="absolute end-4 bottom-4 z-50">
							<Button
								size="icon-sm"
								variant={"outline"}
								onClick={() => {
									scrollToTarget(contentHeight);
								}}
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
