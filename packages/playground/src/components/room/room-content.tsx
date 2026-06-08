import {
	ArchiveIcon,
	MoveDownIcon,
	MoveUpIcon,
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
	PlanMessage,
	ResponseMessage,
	RoomInput,
	RoomInputMenuFileExplorer,
	RoomInputMenuMCP,
	RoomInputMenuUpload,
} from "@/components";
import { useChat, useGracefulErrors } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";
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
	const [autoCompactCountdown, setAutoCompactCountdown] = useState<
		number | null
	>(null);

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

	// Stable ref so the countdown timeout always calls the current handler
	const handleCompactRef = useRef(handleCompactMessages);
	handleCompactRef.current = handleCompactMessages;

	/**
	 * Handle tool add (add-only for slash menu)
	 * @param tool - selected tool
	 */
	const handleToolAdd = (tool: MCPConfig) => {
		// Add tool to options (skip if already present)
		const tools = room.options.mcp.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, typeof tool>,
		);

		// Only add if not already present
		if (!Object.hasOwn(tools, tool.id)) {
			tools[tool.id] = tool;
		}

		room.setOptions({
			...room.options,
			mcp: Object.values(tools),
		});
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

	// Auto-scroll to bottom when messages are added or content grows (streaming), unless user has scrolled away
	// biome-ignore lint/correctness/useExhaustiveDependencies: room.history.length and contentHeight are used as triggers
	useEffect(() => {
		if (!scrollEle || isScrollLocked) {
			return;
		}

		requestAnimationFrame(() => {
			scrollEle.scrollTop = scrollEle.scrollHeight;
		});
	}, [scrollEle, isScrollLocked, room.history.length, contentHeight]);

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

	// Compute compaction status from store signals + context window.
	// Runs inside observer so MobX tracks all observable accesses automatically.
	const compactionStatus = (() => {
		const config = room.theme.defaultRoomSettings?.autoCompaction;
		if (!config || !room.isInitialized) return null;

		const {
			contextWindowPercent,
			messagesSinceCompaction: msgThreshold,
			accumulatedInputTokensSinceCompaction: tokenThreshold,
			messageThresholdByContextUsage,
			mode = "any",
			warningThreshold = 0.9,
		} = config;

		// Ratios: how far along each threshold we are (1.0 = at threshold)
		const ratios: number[] = [];

		if (contextWindowPercent !== undefined && chat.models.contextWindow) {
			ratios.push(
				room.tokensUsed /
					(chat.models.contextWindow * contextWindowPercent),
			);
		}
		if (msgThreshold !== undefined) {
			ratios.push(room.messagesSinceCompaction / msgThreshold);
		}
		if (tokenThreshold !== undefined) {
			ratios.push(room.accumulatedInputTokens / tokenThreshold);
		}
		// Tiered message threshold: find the highest-matching tier by CW usage
		if (
			messageThresholdByContextUsage?.length &&
			chat.models.contextWindow
		) {
			const ctxUsage = room.tokensUsed / chat.models.contextWindow;
			const tier = [...messageThresholdByContextUsage]
				.sort((a, b) => b.contextPercent - a.contextPercent)
				.find((t) => ctxUsage >= t.contextPercent);
			if (tier) {
				ratios.push(room.messagesSinceCompaction / tier.messages);
			}
		}

		if (ratios.length === 0) return null;

		const triggered =
			mode === "all"
				? ratios.every((r) => r >= 1)
				: ratios.some((r) => r >= 1);
		const warned =
			mode === "all"
				? ratios.every((r) => r >= warningThreshold)
				: ratios.some((r) => r >= warningThreshold);

		if (triggered) return "trigger" as const;
		if (warned) return "warn" as const;
		return null;
	})();

	// Auto-compact: when trigger fires, count down 3s then compact automatically.
	// Cleans up (cancels) if the room starts loading mid-countdown or status drops.
	useEffect(() => {
		if (compactionStatus !== "trigger" || showLoadingState) {
			setAutoCompactCountdown(null);
			return;
		}

		setAutoCompactCountdown(3);

		const tick = setInterval(() => {
			setAutoCompactCountdown((prev) =>
				prev !== null && prev > 1 ? prev - 1 : prev,
			);
		}, 1000);

		const fire = setTimeout(() => {
			handleCompactRef.current();
		}, 3000);

		return () => {
			clearInterval(tick);
			clearTimeout(fire);
		};
	}, [compactionStatus, showLoadingState]);

	return (
		<div className="flex h-full w-full flex-col bg-background transition-all duration-200 ease-in-out">
			<div className="relative w-full flex-1 overflow-hidden">
				<ScrollArea
					className="h-full w-full overflow-hidden"
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
							{room.history.map((m, mIdx) => {
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
										{m.type === "PLAN" && (
											<PlanMessage
												message={m}
												isLast={
													mIdx ===
													room.history.length - 1
												}
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
							<div className="mx-auto flex w-screen max-w-[1120px] items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
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
				{compactionStatus && (
					<div
						className={`mb-3 flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
							compactionStatus === "trigger"
								? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
								: "border-yellow-500/30 bg-yellow-500/8 text-yellow-700 dark:text-yellow-400"
						}`}
					>
						<ArchiveIcon
							className={`h-4 w-4 shrink-0 ${compactionStatus === "trigger" ? "animate-pulse" : ""}`}
						/>
						<div className="flex-1">
							<span className="font-medium">
								{compactionStatus === "trigger"
									? t("autoCompaction.triggerTitle", {
											seconds: autoCompactCountdown ?? 3,
										})
									: t("autoCompaction.warnTitle")}
							</span>
							<span className="ml-1.5 opacity-80">
								{compactionStatus === "trigger"
									? t("autoCompaction.triggerDescription")
									: t("autoCompaction.warnDescription")}
							</span>
						</div>
						<Button
							type="button"
							size="sm"
							variant={
								compactionStatus === "trigger"
									? "default"
									: "outline"
							}
							disabled={showLoadingState}
							onClick={handleCompactMessages}
						>
							{t("autoCompaction.compactNow")}
						</Button>
					</div>
				)}
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
					onMcpSelect={handleToolAdd}
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
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();

										// add to the sidebar
										room.addSidebarNode(
											ROOM_CONFIGURATION_ID,
											{
												type: "tab",
												name: "Configuration",
												component: "room-configuration",
												config: {},
												enableClose: true,
											},
										);
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
					onCompact={handleCompactMessages}
				/>
			</div>
		</div>
	);
});
