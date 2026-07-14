import {
	MoveDownIcon,
	MoveUpIcon,
	ScrollTextIcon,
	Settings2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPToolResponse } from "@semoss/sdk";
import {
	Button,
	DropdownMenuItem,
	DropdownMenuSeparator,
	ScrollArea,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import {
	InputMessage,
	ResponseMessage,
	RoomInput,
	RoomInputMenuFileExplorer,
	RoomInputMenuMCP,
	RoomInputMenuUpload,
} from "@/components";
import { useChat, useGracefulErrors } from "@/hooks";
import { ResponseMessageStore, type RoomStore } from "@/stores";
import { RoomCompactionIndicator } from "./room-compaction-indicator";
import { RoomSuggestions } from "./room-suggestions";

const ROOM_CONFIGURATION_ID = "CONFIGURATION";
const SCROLL_THRESHOLD = 150;

interface RoomContentProps {
	/** Room to load */
	room: RoomStore;
}

/**
 * The page for a room
 */
export const RoomContent: React.FC<RoomContentProps> = observer(({ room }) => {
	const { chat } = useChat();
	const { t } = useTranslation("room");
	const { getGracefulErrorMessage } = useGracefulErrors();
	const [scrollEle, setScrollEle] = useState<HTMLDivElement | null>(null);
	const [contentEle, setContentEle] = useState<HTMLDivElement | null>(null);
	const [contentHeight, setContentHeight] = useState(0);
	const [showScrollup, setShowScrollup] = useState(false);
	const [showScrolldown, setShowScrolldown] = useState(false);
	const [isScrollLocked, setIsScrollLocked] = useState(false);

	/** Engine IDs whose monthly token quota is exhausted for the current user */
	const [quotaExhaustedIds, setQuotaExhaustedIds] = useState<string[]>([]);

	/**
	 * Re-check every model's monthly quota and refresh quotaExhaustedIds.
	 * Called on mount and after each assistant response so the dropdown stays
	 * up to date as the user consumes tokens.
	 */
	const refreshQuotaExhaustedIds = useCallback(async () => {
		try {
			const exhausted = await chat.getQuotaExhaustedIds();
			setQuotaExhaustedIds(exhausted);
		} catch {
			// ignore — dropdown just won't show greys
		}
	}, [chat]);

	/**
	 * Auto-switch model when the current model's monthly quota is exceeded.
	 *
	 * Watches room.error: when an error appears and it originates from the
	 * currently selected model having its quota exhausted, we look for the
	 * first model that still has quota, switch to it, persist it as the user's
	 * profile default, and notify via toast.
	 *
	 * We track the exact error *object* we already handled (not the model ID).
	 * This prevents an infinite loop: switching models changes chat.models.selected
	 * which re-triggers the effect, but room.error is still the same object
	 * instance so the guard catches it immediately.
	 */
	const lastHandledQuotaErrorRef = useRef<Error | null>(null);

	useEffect(() => {
		const currentError = room.error;
		const selectedModel = chat.models.selected;

		if (!currentError || !selectedModel) {
			lastHandledQuotaErrorRef.current = null;
			return;
		}

		// Only act on quota-style errors (the backend returns these keywords)
		const msg = currentError.message || "";
		const isQuotaError =
			msg.toLowerCase().includes("usage restriction") ||
			msg.toLowerCase().includes("quota") ||
			msg.toLowerCase().includes("monthly limit") ||
			msg.toLowerCase().includes("token limit exceeded");

		if (!isQuotaError) return;

		// Already handled this exact error instance — guards against the effect
		// re-firing when chat.models.selected changes after the switch
		if (lastHandledQuotaErrorRef.current === currentError) return;

		lastHandledQuotaErrorRef.current = currentError;

		chat.findFirstAvailableModelByQuota().then((nextModel) => {
			if (!nextModel) return;

			const fromName =
				selectedModel.engine_display_name ||
				selectedModel.engine_name ||
				selectedModel.engine_id;
			const toName =
				nextModel.engine_display_name ||
				nextModel.engine_name ||
				nextModel.engine_id;

			room.setModel(nextModel);
			chat.setSelectedModel(nextModel);
			chat.setProfileDefaultModel(
				nextModel.engine_id || nextModel.app_id || "",
			);

			toast.info(
				`"${fromName}" has reached its monthly usage limit. Switched to "${toName}" and updated your default model.`,
			);

			// Refresh the disabled model list now that we've switched
			refreshQuotaExhaustedIds();
		});
	}, [
		room.error,
		chat.models.selected,
		room,
		chat,
		refreshQuotaExhaustedIds,
	]);

	// Check quotas on mount so the model dropdown is accurate from the start
	// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
	useEffect(() => {
		refreshQuotaExhaustedIds();
	}, []);

	// Re-check quotas after each message completes (history grows)
	// biome-ignore lint/correctness/useExhaustiveDependencies: room.history.length is the trigger
	useEffect(() => {
		if (room.history.length > 0 && !room.isLoading) {
			refreshQuotaExhaustedIds();
		}
	}, [room.history.length, room.isLoading]);

	/**
	 * Functions
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		// update the options
		await room.updateRoomOptions(room.options);

		// ask the room
		await room.askMessage(prompt, files);

		// re-sync room options from backend after message completes,
		// preserving workspace MCPs that are only held in memory
		await room.syncRoomOptions();

		return true;
	};

	/**
	 * Open the room configuration sidebar tab
	 */
	const handleOpenSettings = useCallback(() => {
		room.addSidebarNode(ROOM_CONFIGURATION_ID, {
			type: "tab",
			name: "Configuration",
			component: "room-configuration",
			config: {},
			enableClose: true,
		});
	}, [room]);

	/**
	 * Open the audit logs dashboard for this room in the right side panel.
	 */
	const handleOpenActivityLog = useCallback(() => {
		room.addSidebarNode("room-activity-log", {
			type: "tab",
			name: "Activity Log",
			component: "audit-log-report",
			config: {},
			enableClose: true,
		});
	}, [room]);

	/**
	 * Compact messages in the room
	 */
	const handleCompactMessages = async () => {
		try {
			const result = await room.compactMessages();
			if (result === "skipped") {
				toast.info(t("settings.compactSkipped"));
			} else {
				toast.success(t("settings.compactSuccess"));
			}
		} catch {
			toast.error(t("settings.compactError"));
		}
	};

	/**
	 * Handle scroll events to detect user scrolling
	 */
	const handleScroll = useCallback(() => {
		if (!scrollEle) {
			setShowScrolldown(false);
			setShowScrollup(false);
			return;
		}

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
	}, [scrollEle]);

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

				room.processTool(
					tool.message,
					tool.id,
					tool.response,
					tool.tool_status,
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

	// Track whether streaming has ever been active this session so the
	// completion smooth-scroll doesn't fire on initial room open (where
	// isAnyMessageStreaming starts false and never transitions true → false).
	const hasStreamedRef = React.useRef(false);
	if (isAnyMessageStreaming) {
		hasStreamedRef.current = true;
	}

	// Track whether we need to smooth-scroll to bottom after the typewriter
	// dumps its remaining content when streaming ends.
	// Set to true the moment streaming ends; cleared once the smooth scroll fires.
	const pendingScrollToBottomRef = React.useRef(false);

	useEffect(() => {
		if (!isAnyMessageStreaming && hasStreamedRef.current) {
			pendingScrollToBottomRef.current = true;
		}
	}, [isAnyMessageStreaming]);

	// Auto-scroll to bottom when content grows (streaming), unless user has scrolled away intentionally
	// biome-ignore lint/correctness/useExhaustiveDependencies: contentHeight is used as a trigger
	useEffect(() => {
		if (!scrollEle || isScrollLocked) {
			return;
		}

		// If a smooth-scroll-to-bottom is pending (streaming just ended and the
		// typewriter is still dumping content), let the smooth-scroll effect below
		// handle it — don't clobber it with an instant jump.
		if (pendingScrollToBottomRef.current) {
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

	// Whenever contentHeight changes and a smooth-scroll is pending, fire it.
	// This fires after the ResizeObserver detects the post-dump layout change,
	// so scrollHeight is accurate and the instant-jump path above is gated off.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (pendingScrollToBottomRef.current && scrollEle) {
			pendingScrollToBottomRef.current = false;
			setIsScrollLocked(false);
			scrollEle.scrollTo({
				top: scrollEle.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [contentHeight, scrollEle]);
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
	const isAutoExecutingTools = ((): boolean => {
		// Check the latest response message for auto-executing tools
		if (!room.latestResponseMessage) {
			return false;
		}

		for (const part of room.latestResponseMessage.parts) {
			if (
				part.type === "TOOL_CALL" &&
				part.toolCall._meta?.SMSS_MCP_EXECUTION === "auto"
			) {
				const tool = room.getTool(part.toolCall.id);
				if (
					tool &&
					(tool.status === "INITIAL" || tool.status === "LOADING")
				) {
					return true;
				}
			}
		}
		return false;
	})();

	const showLoadingState =
		room.isLoading ||
		room.latestResponseMessage.isThinking ||
		isAutoExecutingTools;

	return (
		<div className="flex h-full w-full flex-col bg-background transition-all duration-200 ease-in-out">
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
						<div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-6 sm:px-8 lg:px-16">
							{room.history.map((m) => {
								if (!m.visible) {
									return null;
								}

								const showModelName = (() => {
									// find the most recent ancestor that actually has a model
									let ancestor = m.parent;
									while (ancestor) {
										if (ancestor.modelId) break;
										ancestor = ancestor.parent;
									}
									// If no ancestor has a model, show the model name for this message
									if (!ancestor) return true;
									// Only show the model name if it's different from the ancestor's model to reduce clutter
									return m.modelId !== ancestor.modelId;
								})();

								return (
									<React.Fragment key={m.key}>
										{showModelName && (
											<div className="relative mb-4 flex flex-col items-center justify-center">
												<div className="z-10 bg-background px-2 text-muted-foreground text-xs leading-normal">
													{m.ornaments.modelName}
												</div>
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
											/>
										)}

										{m.type === "OUTPUT" && (
											<RoomCompactionIndicator
												message={m}
											/>
										)}
									</React.Fragment>
								);
							})}
							{room.theme.featureFlags?.enableSuggestions && (
								<RoomSuggestions room={room} />
							)}
						</div>
						{room.error ? (
							<div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
								<div className="flex h-10 w-10 items-center justify-center rounded-full">
									<TriangleAlertIcon className="h-6 w-6" />
								</div>
								<span>
									{getGracefulErrorMessage(room.error)}
								</span>
							</div>
						) : null}
					</div>
				</ScrollArea>

				{showScrollup && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="absolute end-4 top-4 z-50">
								<Button
									size="icon-sm"
									variant={"outline"}
									onClick={() => scrollToTarget(0)}
									aria-label={t("content.scrollToTop")}
									className="shadow-lg"
								>
									<MoveUpIcon />
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
									<MoveDownIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>
							{t("content.scrollToBottom")}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="mx-auto flex w-full max-w-[1120px] shrink-0 flex-col px-4 py-4 sm:px-8 lg:px-16">
				<RoomInput
					predefinedPrompts={room.options.predefinedPrompts}
					className="max-h-56 min-h-24"
					isLoading={showLoadingState}
					hidePauseButton={!room.numberOfTools}
					model={room.model}
					room={room}
					setModel={(model) => {
						room.setModel(model);
						chat.setSelectedModel(model);
					}}
					options={room.options}
					onMcpChange={(mcp) =>
						room.setOptions({
							...room.options,
							mcp,
						})
					}
					MenuComponent={observer(
						({ onOpenChange, onOpenMcpOverlay }) => (
							<>
								<RoomInputMenuUpload
									onSelect={() => onOpenChange(false)}
								/>
								<DropdownMenuSeparator />
								<RoomInputMenuMCP
									type="KNOWLEDGE"
									options={room.options}
									onSelect={() => {
										onOpenMcpOverlay("KNOWLEDGE");
										onOpenChange(false);
									}}
								/>
								<RoomInputMenuMCP
									type="TOOLBOX"
									options={room.options}
									onSelect={() => {
										onOpenMcpOverlay("TOOLBOX");
										onOpenChange(false);
									}}
								/>
								<DropdownMenuSeparator />
								<RoomInputMenuFileExplorer
									room={room}
									onSelect={() => onOpenChange(false)}
								/>
								{room.theme.featureFlags?.showActivityLog !==
									false && (
									<DropdownMenuItem
										onSelect={(e) => {
											e.preventDefault();
											handleOpenActivityLog();
											onOpenChange(false);
										}}
									>
										<ScrollTextIcon />
										<span className="flex-1">
											Activity Log
										</span>
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleOpenSettings();
										onOpenChange(false);
									}}
								>
									<Settings2Icon />
									<span className="flex-1">
										{t("settings.edit")}
									</span>
								</DropdownMenuItem>
							</>
						),
					)}
					onPrompt={handlePrompt}
					hasOutstandingTools={
						room.latestResponseMessage.hasUnfinishedTools
					}
					hasToolsPaused={room.latestResponseMessage.isPaused}
					toggleToolsPaused={
						room.latestResponseMessage.toggleIsPaused
					}
					tokensUsed={room.tokensUsed}
					tokensMax={chat.models.contextWindow}
					totalTokens={room.totalTokensConsumed}
					onCompact={handleCompactMessages}
					onOpenSettings={handleOpenSettings}
					excludeCommandIds={["agent", "workspace"]}
					disabledModelIds={quotaExhaustedIds}
				/>
			</div>
		</div>
	);
});
