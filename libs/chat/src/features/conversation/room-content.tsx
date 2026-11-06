import { MoveDownIcon, MoveUpIcon, TriangleAlertIcon } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	decideAgentToolAction,
	type InputMessageStore,
	isAskExecutionMode,
	type MCPToolResponse,
	ResponseMessageStore,
} from "@semoss/sdk";
import { useRoomSelector } from "@semoss/sdk/react";
import { ChatGeneratingIndicator } from "@semoss/shared";
import {
	Button,
	cn,
	Muted,
	P,
	ScrollArea,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { InputMessage } from "../../components/message/input-message";
import { ResponseMessage } from "../../components/message/response-message";
import { useFileDrag } from "../../contexts/file-drag.context";
import { useGracefulErrors } from "../../hooks/use-graceful-errors";
import { useChat } from "../../host/chat.context";
import { RoomCompactionIndicator } from "../composer/room-compaction-indicator";
import { RoomComposer, type SendButtonState } from "../composer/room-composer";
import { RoomSuggestions } from "../suggestions/room-suggestions";
import type { RoomUiStore } from "../workbench/room-ui.store";
import { ConversationScrollContext } from "./conversation-scroll.context";
import { ModelRouterAttribution } from "./model-router-attribution";
import { RoomGreeting } from "./room-greeting";

const SCROLL_THRESHOLD = 150;

/** One entry of the conversation: a message, and tool-only replies folded into it. */
interface HistoryEntry {
	message: InputMessageStore | ResponseMessageStore;
	subsequentTools: ResponseMessageStore[];
}

/**
 * Whether the latest response has tool calls running on their own.
 *
 * @param room - The room.
 * @returns True while one is queued or running.
 */
const hasAutoExecutingTools = (room: RoomUiStore): boolean =>
	Boolean(
		room.latestResponseMessage?.parts.some((part) => {
			if (part.type !== "TOOL_CALL") {
				return false;
			}
			const tool = room.getTool(part.toolCall.id);
			return (
				!!tool &&
				tool.json._meta?.SMSS_MCP_EXECUTION === "auto" &&
				(tool.status === "INITIAL" || tool.status === "LOADING")
			);
		}),
	);

/**
 * How many ask-mode tools on the latest response genuinely wait on the user
 * to click into them — not auto tools, and not ask tools that already
 * resolved or are running after being clicked.
 *
 * @param room - The room.
 * @returns The count.
 */
const countWaitingAskTools = (room: RoomUiStore): number =>
	room.latestResponseMessage?.parts.filter((part) => {
		if (part.type !== "TOOL_CALL") {
			return false;
		}
		const tool = room.getTool(part.toolCall.id);
		return (
			!!tool &&
			tool.status === "INITIAL" &&
			isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION)
		);
	}).length ?? 0;

/**
 * Whether the turn's newest response is visibly streaming: its last part is
 * text or reasoning, or a tool call still coming in (which shows its own
 * spinner). The content is its own sign of progress, so the generating
 * indicator only covers the waits with nothing arriving on screen. Read off
 * the tail rather than isThinking, which an agent run turns off as soon as
 * its first item arrives.
 *
 * @param room - The room.
 * @returns True while content streams.
 */
const isTailStreamingContent = (room: RoomUiStore): boolean => {
	const tail = room.tail;
	if (!(tail instanceof ResponseMessageStore)) {
		return false;
	}
	const lastPart = tail.parts[tail.parts.length - 1];
	if (lastPart?.type === "TEXT") {
		return lastPart.text.trim().length > 0;
	}
	if (lastPart?.type === "THINKING") {
		return lastPart.thinking.length > 0;
	}
	if (lastPart?.type === "TOOL_CALL") {
		return !!room.getTool(lastPart.toolCall.id)?.isStreamingPlaceholder;
	}
	return false;
};

/**
 * A response that's actively generating with nothing to show yet — no text,
 * tool calls, media, or even real thinking content — renders as no entry at
 * all; ChatGeneratingIndicator covers that window instead, so it never mounts
 * as its own block only to fold away again the moment it gets its first tool
 * call. The instant any real content exists (including thinking) it gets its
 * own entry immediately.
 *
 * @param m - A message of the history.
 * @returns True for a pending response.
 */
const isPendingResponse = (
	m: InputMessageStore | ResponseMessageStore,
): boolean =>
	m.type === "OUTPUT" &&
	m.isThinking &&
	!m.hasVisibleContent &&
	!m.parts.some(
		(part) => part.type === "THINKING" && part.thinking.length > 0,
	);

/**
 * The conversation's entries: visible messages, with a run of tool-only
 * responses folded up into the response preceding them.
 *
 * @param room - The room.
 * @returns The entries.
 */
const buildHistoryEntries = (room: RoomUiStore): HistoryEntry[] => {
	let anchor: HistoryEntry | null = null;

	return room.history.reduce<HistoryEntry[]>((entries, m) => {
		if (!m.visible) {
			return entries;
		}

		if (isPendingResponse(m)) {
			return entries;
		}

		// A settled empty response is only meaningful as a direct reply to a
		// user turn. When its nearest non-hidden ancestor is another response
		// — e.g. the empty assistant message the backend commits after a
		// stopped tool phase — it's just noise, so skip it. (Still-thinking
		// placeholders are left alone so a streaming post-tool reply isn't
		// hidden.)
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

		const entry: HistoryEntry = { message: m, subsequentTools: [] };
		anchor = m.type === "OUTPUT" ? entry : null;
		entries.push(entry);
		return entries;
	}, []);
};

/**
 * The conversation's entries, the same list until its structure changes —
 * which messages show and which fold together — so a streamed chunk renders
 * only the message it fills, not the whole conversation.
 *
 * @param room - The room.
 * @returns The entries.
 */
const useHistoryEntries = (room: RoomUiStore): HistoryEntry[] => {
	const [cache] = useState(() => ({
		key: "",
		entries: [] as HistoryEntry[],
	}));
	return useRoomSelector(room, (r) => {
		const entries = buildHistoryEntries(r);
		const key = entries
			.map(
				({ message, subsequentTools }) =>
					`${message.key}:${message.id}[${subsequentTools
						.map((tool) => `${tool.key}:${tool.id}`)
						.join(",")}]`,
			)
			.join("|");
		if (key !== cache.key) {
			cache.key = key;
			cache.entries = entries;
		}
		return cache.entries;
	});
};

/** Props for {@link RoomContent}. */
export interface RoomContentProps {
	/** Room to load */
	room: RoomUiStore;
}

/**
 * A room's conversation and its composer
 */
export const RoomContent = ({ room }: RoomContentProps) => {
	const { chat, config } = useChat();
	const { t } = useTranslation("room");
	const { t: tChat } = useTranslation("chat");
	const { getGracefulErrorMessage } = useGracefulErrors();
	const { isDragging } = useFileDrag();
	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [contentEle, setContentEle] = useState<HTMLDivElement | null>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [showScrollup, setShowScrollup] = useState(false);
	const [showScrolldown, setShowScrolldown] = useState(false);
	const [isScrollLocked, setIsScrollLocked] = useState(false);

	/**
	 * Functions
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		// ask the room, which saves its options first — let errors propagate
		// so room-input can restore files
		await room.askMessage(prompt, files);

		// An agent run can change the room's tools on the server and only
		// resolves once the run is over, so re-sync the options then,
		// preserving workspace MCPs that are only held in memory. A chat turn
		// re-syncs when its last tool result is saved instead. Skipped when the
		// turn just errored (e.g. a cancel that failed to persist) — a
		// successful sync clears the room's error state, which would otherwise
		// wipe the message the user just needs to see.
		if (room.mode === "agent" && !room.error) {
			await room.syncRoomOptions();
		}

		return true;
	};

	/**
	 * Compact messages in the room
	 */
	const handleCompactMessages = async (
		strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO",
	) => {
		try {
			const result = await room.compactMessages(strategy);
			if (result === "skipped") {
				toast.info(t("settings.compactSkipped"));
			} else {
				toast.success(t("settings.compactSuccess"));
			}
		} catch {
			toast.error(t("settings.compactError"));
		}
	};

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

	const isAnyMessageStreaming = useRoomSelector(room, (r) =>
		r.history.some(
			(msg) => msg instanceof ResponseMessageStore && msg.isThinking,
		),
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

	/**
	 * Constants
	 */
	const {
		isAutoExecutingTools,
		waitingAskToolCount,
		isStreamingContent,
		isLoading,
		isThinking,
		isCancelling,
		canCancel,
		mode,
		agentGreeting,
		error,
		predefinedPrompts,
		model,
		options,
		hasOutstandingTools,
	} = useRoomSelector(room, (r) => ({
		isAutoExecutingTools: hasAutoExecutingTools(r),
		waitingAskToolCount: countWaitingAskTools(r),
		isStreamingContent: isTailStreamingContent(r),
		isLoading: r.isLoading,
		isThinking: Boolean(r.latestResponseMessage?.isThinking),
		isCancelling: r.isCancelling,
		canCancel: r.canCancel,
		mode: r.mode,
		agentGreeting: r.agentGreeting,
		error: r.error,
		predefinedPrompts: r.options.predefinedPrompts,
		model: r.model,
		options: r.options,
		hasOutstandingTools: Boolean(
			r.latestResponseMessage?.hasUnfinishedTools,
		),
	}));
	const roomHistoryEntries = useHistoryEntries(room);

	const showLoadingState = isLoading || isThinking || isAutoExecutingTools;

	// Agent-run turns can't actually be interrupted server-side yet, so show a
	// plain spinner instead of a Stop button that would look actionable but do
	// nothing.
	const sendState: SendButtonState = isCancelling
		? "loading"
		: mode === "agent" && showLoadingState
			? "loading"
			: canCancel || showLoadingState
				? "stop"
				: "send";

	return (
		<div
			className={cn(
				"@container flex h-full w-full min-w-0 flex-col border-2 border-transparent bg-background",
				isDragging && "border-primary",
			)}
		>
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
													routing={
														m.ornaments.routing
													}
												/>
											)}
											{subsequentTools.map(
												(toolMessage) => (
													<ModelRouterAttribution
														key={toolMessage.key}
														routing={
															toolMessage
																.ornaments
																.routing
														}
													/>
												),
											)}

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
										(showLoadingState &&
											!isStreamingContent) ||
										waitingAskToolCount > 0
									}
									overrideMessage={
										waitingAskToolCount > 0
											? tChat(
													"response.completeToolsAsk",
													{
														count: waitingAskToolCount,
													},
												)
											: undefined
									}
								/>
							</div>
							{config.featureFlags.enableSuggestions && (
								<RoomSuggestions room={room} />
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
						<TooltipContent>
							{t("content.scrollToTop")}
						</TooltipContent>
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
			<div className="flex w-full shrink-0 flex-col @md:px-6 px-4 py-4">
				<div className="mx-auto flex w-full max-w-3xl flex-col">
					<RoomComposer
						predefinedPrompts={predefinedPrompts}
						className="max-h-72 min-h-24"
						isLoading={showLoadingState}
						model={model}
						room={room}
						setModel={(model) => {
							room.setModel(model);
							chat.setSelectedModel(model);
						}}
						options={options}
						onMcpChange={(mcp) =>
							room.setOptions({
								...room.options,
								mcp,
							})
						}
						onPrompt={handlePrompt}
						hasOutstandingTools={hasOutstandingTools}
						sendState={sendState}
						onStop={room.cancelActiveJob}
						onCompact={handleCompactMessages}
						excludeCommandIds={[
							// A room's mode is fixed at creation — never let an
							// existing room switch into agent-harness mid-chat.
							"agent-harness",
						]}
					/>
				</div>
			</div>
		</div>
	);
};
