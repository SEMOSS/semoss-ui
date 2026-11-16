import { MoveDownIcon, MoveUpIcon, TriangleAlertIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
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
import type { RoomStore } from "../room/room.store";
import { ConversationScrollContext } from "./conversation-scroll.context";
import { ModelRouterAttribution } from "./model-router-attribution";
import { RoomCompactionIndicator } from "./room-compaction-indicator";
import { RoomGreeting } from "./room-greeting";
import { RoomSuggestions } from "./room-suggestions";
import { readRoomTurnState } from "./room-turn-state";
import { useGracefulErrors } from "./use-graceful-errors";

const SCROLL_THRESHOLD = 150;

interface RoomMessagesProps {
	/** The room whose conversation to show. */
	room: RoomStore;
}

/**
 * A room's conversation: its greeting, messages, progress, suggestions, and
 * error, in a scroll area that follows a streaming reply. Also runs the tool
 * results that tool views post to the window.
 */
export const RoomMessages = observer(({ room }: RoomMessagesProps) => {
	const { t } = useTranslation("room");
	const { t: tChat } = useTranslation("chat");
	const { getGracefulErrorMessage } = useGracefulErrors();
	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [contentEle, setContentEle] = useState<HTMLDivElement | null>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [showScrollup, setShowScrollup] = useState(false);
	const [showScrolldown, setShowScrolldown] = useState(false);
	const [isScrollLocked, setIsScrollLocked] = useState(false);
	const { isBusy, isStreamingContent, waitingAskToolCount } =
		readRoomTurnState(room);

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

	const isAnyMessageStreaming = room.history.some(
		(msg) => msg instanceof ResponseMessageStore && msg.isThinking,
	);

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

	// A response that's actively generating with nothing to show yet — no
	// text, tool calls, media, or even real thinking content — renders as
	// no entry at all; ChatGeneratingIndicator covers that window instead,
	// so it never mounts as its own block only to fold away again the
	// moment it gets its first tool call. The instant any real content
	// exists (including thinking) it gets its own entry immediately.
	const isPendingResponse = (
		m: InputMessageStore | ResponseMessageStore,
	): boolean =>
		m.type === "OUTPUT" &&
		m.isThinking &&
		!m.hasVisibleContent &&
		!m.parts.some(
			(part) => part.type === "THINKING" && part.thinking.length > 0,
		);

	// Folds a run of tool-only responses up into the response preceding them.
	const roomHistoryEntries = (() => {
		interface Entry {
			message: InputMessageStore | ResponseMessageStore;
			subsequentTools: ResponseMessageStore[];
		}
		let anchor: Entry | null = null;

		return room.history.reduce<Entry[]>((entries, m) => {
			if (!m.visible) {
				return entries;
			}

			if (isPendingResponse(m)) {
				return entries;
			}

			// A settled empty response is only meaningful as a direct reply
			// to a user turn. When its nearest non-hidden ancestor is
			// another response — e.g. the empty assistant message the
			// backend commits after a stopped tool phase — it's just
			// noise, so skip it. (Still-thinking placeholders are left
			// alone so a streaming post-tool reply isn't hidden.)
			if (
				m.type === "OUTPUT" &&
				!m.hasVisibleContent &&
				!m.isThinking &&
				m.findAncestor((a) => a.visible)?.type === "OUTPUT"
			) {
				return entries;
			}

			if (m.type === "OUTPUT" && m.shouldFoldUp && anchor) {
				anchor.subsequentTools.push(m);
				return entries;
			}

			const entry: Entry = { message: m, subsequentTools: [] };
			anchor = m.type === "OUTPUT" ? entry : null;
			entries.push(entry);
			return entries;
		}, []);
	})();

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
						{room.agentGreeting && (
							<RoomGreeting
								room={room}
								greeting={room.agentGreeting}
							/>
						)}
						{roomHistoryEntries.map(
							({ message: m, subsequentTools }) => {
								const showModelName = (() => {
									// find the most recent ancestor that actually has a model
									const ancestor = m.findAncestor(
										(a) => !!a.modelId,
									);
									// If no ancestor has a model, show the model name for this message
									if (!ancestor) return true;
									// Only show the model name if it's different from the ancestor's model to reduce clutter
									return m.modelId !== ancestor.modelId;
								})();

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
						{room.theme.featureFlags?.enableSuggestions && (
							<RoomSuggestions room={room} />
						)}
					</div>
					{room.error ? (
						<div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
							<div className="flex h-10 w-10 items-center justify-center rounded-full">
								<TriangleAlertIcon
									aria-hidden="true"
									className="size-6"
								/>
							</div>
							<P>{getGracefulErrorMessage(room.error)}</P>
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
});
