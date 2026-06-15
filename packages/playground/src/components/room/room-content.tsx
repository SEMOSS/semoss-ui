import {
	ArchiveIcon,
	InfoIcon,
	MoveDownIcon,
	MoveUpIcon,
	Settings2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPToolResponse } from "@semoss/sdk";
import {
	Button,
	DropdownMenuItem,
	DropdownMenuSeparator,
	Popover,
	PopoverContent,
	PopoverTrigger,
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

const CompactionInfoPopover = ({
	t,
}: {
	t: ReturnType<typeof useTranslation<"room">>["t"];
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<Button
				type="button"
				size="icon-sm"
				variant="ghost"
				className="shrink-0 opacity-60 hover:opacity-100"
				aria-label={t("autoCompaction.infoTitle")}
			>
				<InfoIcon className="h-4 w-4" />
			</Button>
		</PopoverTrigger>
		<PopoverContent className="w-80 text-sm" side="top" align="end">
			<p className="mb-2 font-semibold">
				{t("autoCompaction.infoTitle")}
			</p>
			<p className="mb-3 text-muted-foreground">
				{t("autoCompaction.infoBody")}
			</p>
			<p className="mb-0.5 font-medium">
				{t("autoCompaction.infoKeepTitle")}
			</p>
			<p className="mb-3 text-muted-foreground">
				{t("autoCompaction.infoKeepBody")}
			</p>
			<p className="mb-0.5 font-medium">
				{t("autoCompaction.infoLoseTitle")}
			</p>
			<p className="mb-3 text-muted-foreground">
				{t("autoCompaction.infoLoseBody")}
			</p>
			<p className="text-muted-foreground italic">
				{t("autoCompaction.infoMarker")}
			</p>
		</PopoverContent>
	</Popover>
);

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

	// ── Step 1: Compute interpolated message budget ───────────────────────────
	// Piecewise-linear interpolation across the anchor points in
	// messageThresholdByContextUsage. With two anchors (e.g. 5%→25 msgs,
	// 75%→5 msgs) this is a straight line. More anchors = piecewise segments.
	// Below the lowest anchor: no budget (floor handles that range).
	// Above the highest anchor: clamp to the last anchor's message count.
	const activeTierLimit = (() => {
		const tiers =
			room.theme.defaultRoomSettings?.autoCompaction
				?.messageThresholdByContextUsage;
		if (!tiers?.length || !chat.models.contextWindow) return null;
		const ctxUsage = room.tokensUsed / chat.models.contextWindow;
		const sorted = [...tiers].sort(
			(a, b) => a.contextPercent - b.contextPercent,
		);
		if (ctxUsage < sorted[0].contextPercent) return null;
		if (ctxUsage >= sorted[sorted.length - 1].contextPercent)
			return sorted[sorted.length - 1].messages;
		for (let i = 0; i < sorted.length - 1; i++) {
			const lo = sorted[i];
			const hi = sorted[i + 1];
			if (ctxUsage >= lo.contextPercent && ctxUsage < hi.contextPercent) {
				const t =
					(ctxUsage - lo.contextPercent) /
					(hi.contextPercent - lo.contextPercent);
				return Math.floor(
					lo.messages + t * (hi.messages - lo.messages),
				);
			}
		}
		return null;
	})();

	// With a continuous budget there are no discrete tiers to enter/exit, so the
	// counter just shows messages since last compaction against the current budget.
	const messagesInCurrentTier =
		activeTierLimit !== null ? room.messagesSinceCompaction : null;

	// ── Step 2: Cumulative token counter (input + output, all-time) ──────────
	const totalOutputTokens = room.history.reduce((sum, msg) => {
		return msg.type === "OUTPUT" ? sum + msg.tokens : sum;
	}, 0);
	const totalTokensUsed = room.totalRoomTokens + totalOutputTokens;

	// ── Step 3: Compaction status ──────────────────────────────────────────────
	// Runs inside observer so MobX tracks all observable accesses automatically.
	const { status: compactionStatus, messagesUntilCompact } = (() => {
		const none = {
			status: null as "warn" | "trigger" | null,
			messagesUntilCompact: null as number | null,
		};

		const config = room.theme.defaultRoomSettings?.autoCompaction;
		if (!config || config.enabled === false || !room.isInitialized)
			return none;

		// Absolute token floor: never fire while the conversation is short enough
		// to be unproblematic regardless of model size.
		if (
			config.tokenFloor !== undefined &&
			room.tokensUsed <= config.tokenFloor
		) {
			return none;
		}

		// Require at least one real user message since last compaction — tool
		// cycles alone should never trigger compaction before the user has spoken.
		if (room.messagesSinceCompaction === 0) return none;

		const {
			contextWindowPercent,
			messagesSinceCompaction: msgThreshold,
			accumulatedInputTokensSinceCompaction: tokenThreshold,
			toolCycleWeight = 0,
			mode = "any",
			warningThreshold = 0.75,
			warningMessageBuffer = 3,
		} = config;

		// Effective message count: real user turns + weighted tool cycles.
		const effectiveMessages =
			room.messagesSinceCompaction +
			room.toolCyclesSinceCompaction * toolCycleWeight;

		// Each threshold produces a { triggered, warned } pair.
		const results: { triggered: boolean; warned: boolean }[] = [];

		if (contextWindowPercent !== undefined && chat.models.contextWindow) {
			const ratio =
				room.tokensUsed /
				(chat.models.contextWindow * contextWindowPercent);
			results.push({
				triggered: ratio >= 1,
				warned: ratio >= warningThreshold,
			});
		}
		if (msgThreshold !== undefined) {
			results.push({
				triggered: effectiveMessages >= msgThreshold,
				warned:
					effectiveMessages >=
					Math.max(1, msgThreshold - warningMessageBuffer),
			});
		}
		if (tokenThreshold !== undefined) {
			const ratio = room.accumulatedInputTokens / tokenThreshold;
			results.push({
				triggered: ratio >= 1,
				warned: ratio >= warningThreshold,
			});
		}

		// Tier threshold: fires based on messages-in-tier (since crossing the
		// threshold), so the trigger and the footer counter always agree.
		let tierMessagesUntil: number | null = null;
		if (activeTierLimit !== null && messagesInCurrentTier !== null) {
			results.push({
				triggered: messagesInCurrentTier >= activeTierLimit,
				warned:
					messagesInCurrentTier >=
					Math.max(1, activeTierLimit - warningMessageBuffer),
			});
			tierMessagesUntil = Math.max(
				0,
				activeTierLimit - messagesInCurrentTier,
			);
		}

		if (results.length === 0) return none;

		const triggered =
			mode === "all"
				? results.every((r) => r.triggered)
				: results.some((r) => r.triggered);
		const warned =
			mode === "all"
				? results.every((r) => r.warned)
				: results.some((r) => r.warned);

		// Prefer the tier countdown when available; fall back to flat threshold.
		const flatUntil =
			msgThreshold !== undefined
				? Math.max(0, msgThreshold - room.messagesSinceCompaction)
				: null;
		const messagesUntilCompact =
			tierMessagesUntil !== null && flatUntil !== null
				? Math.min(tierMessagesUntil, flatUntil)
				: (tierMessagesUntil ?? flatUntil);

		if (triggered)
			return { status: "trigger" as const, messagesUntilCompact };
		if (warned) return { status: "warn" as const, messagesUntilCompact };
		return { ...none, messagesUntilCompact };
	})();

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
				{compactionStatus === "warn" && (
					<div className="mb-3 flex items-center gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/8 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
						<ArchiveIcon className="h-4 w-4 shrink-0" />
						<div className="flex-1">
							<span className="font-medium">
								{t("autoCompaction.warnTitle")}
							</span>
							<span className="ml-1.5 opacity-80">
								{t("autoCompaction.warnDescription")}
							</span>
							{messagesUntilCompact !== null && (
								<span className="ml-1.5 font-medium opacity-80">
									{t("autoCompaction.warnCountdown", {
										count: messagesUntilCompact,
									})}
								</span>
							)}
						</div>
						<CompactionInfoPopover t={t} />
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={showLoadingState}
							onClick={handleCompactMessages}
						>
							{t("autoCompaction.compactNow")}
						</Button>
					</div>
				)}
				{compactionStatus === "trigger" && (
					<div className="mb-3 flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 text-sm dark:text-amber-400">
						<ArchiveIcon className="h-4 w-4 shrink-0" />
						<div className="flex-1">
							<span className="font-medium">
								{t("autoCompaction.triggerTitle")}
							</span>
							<span className="ml-1.5 opacity-80">
								{t("autoCompaction.triggerDescription")}
							</span>
						</div>
						<CompactionInfoPopover t={t} />
						<Button
							type="button"
							size="sm"
							variant="default"
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
					isLoading={
						showLoadingState || compactionStatus === "trigger"
					}
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
					footer={
						(activeTierLimit !== null &&
							room.messagesSinceCompaction > 0) ||
						totalTokensUsed > 0 ? (
							<div className="flex items-center gap-3">
								{activeTierLimit !== null &&
									room.messagesSinceCompaction > 0 && (
										<span className="text-muted-foreground/40 text-xs tabular-nums">
											{Math.max(
												0,
												activeTierLimit -
													room.messagesSinceCompaction,
											)}
											m left
										</span>
									)}
								{totalTokensUsed > 0 && (
									<span className="text-muted-foreground/40 text-xs tabular-nums">
										{totalTokensUsed >= 1_000_000
											? `${(totalTokensUsed / 1_000_000).toFixed(1)}M`
											: totalTokensUsed >= 1_000
												? `${Math.round(totalTokensUsed / 1_000)}K`
												: `${totalTokensUsed}`}{" "}
										tokens
									</span>
								)}
							</div>
						) : null
					}
				/>
			</div>
		</div>
	);
});
