import {
	Minimize2Icon,
	MoveDownIcon,
	MoveUpIcon,
	Settings2Icon,
	TriangleAlertIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPToolResponse } from "@semoss/sdk";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenuItem,
	DropdownMenuSeparator,
	Popover,
	PopoverAnchor,
	PopoverContent,
	ScrollArea,
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomContextChart,
	RoomInput,
	RoomInputMenuFileExplorer,
	RoomInputMenuKnowledge,
	RoomInputMenuToolbox,
	RoomInputMenuUpload,
} from "@/components";
import { useChat, useGracefulErrors } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";
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
	const [showCompactConfirm, setShowCompactConfirm] = useState(false);
	const [compactSuggestionDismissed, setCompactSuggestionDismissed] =
		useState(false);

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
	 * Handle tool selection
	 * @param tool - selected tool
	 */
	const handleToolSelect = (tool: MCPConfig) => {
		// Toggle tool in options
		const tools = room.options.mcp.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, typeof tool>,
		);

		if (Object.hasOwn(tools, tool.id)) {
			delete tools[tool.id];
		} else {
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
				part.toolCall._meta.SMSS_MCP_EXECUTION === "auto"
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
		room.isCompacting ||
		room.latestResponseMessage.isThinking ||
		isAutoExecutingTools;

	return (
		<div className="flex h-full w-full flex-col bg-secondary-background transition-all duration-200 ease-in-out">
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
						<div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6">
							{room.wasCompacted && (
								<>
									<div>
										{room.preCompactionHistory.map((m) => {
											if (!m.visible) return null;
											return (
												<React.Fragment key={m.key}>
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
															isLast={false}
														/>
													)}
												</React.Fragment>
											);
										})}
									</div>
									<div className="relative flex flex-col items-center justify-center py-2">
										<div className="z-10 bg-background px-3 text-muted-foreground text-xs leading-normal">
											{t("compaction.dividerLabel")}
										</div>
										<Separator className="absolute top-1/2" />
									</div>
								</>
							)}
							{room.history.map((m, mIdx) => {
								if (!m.visible) {
									return null;
								}

								return (
									<React.Fragment key={m.key}>
										{(m.parent.modelId !== m.modelId ||
											m.parent.parent === null) && (
											<div className="relative flex flex-col items-center justify-center">
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
									</React.Fragment>
								);
							})}
							{room.theme.featureFlags?.enableSuggestions && (
								<RoomSuggestions room={room} />
							)}
						</div>
						{/* DEV: token usage counter — remove before shipping */}
						<div className="mx-auto flex w-full max-w-4xl items-center justify-end gap-2 px-1 text-muted-foreground text-xs opacity-40">
							<span>{room.tokensUsed.toLocaleString()}</span>
							{room.theme.featureFlags?.enableCompaction &&
								room.compactionThreshold > 0 && (
									<Tooltip>
										<Popover
											open={
												room.tokensUsed >
													room.compactionThreshold *
														0.5 &&
												room.inputMessagesSinceCompaction >=
													10 &&
												!compactSuggestionDismissed &&
												!room.isCompacting
													? true
													: undefined
											}
										>
											<PopoverAnchor>
												<TooltipTrigger asChild>
													<button
														type="button"
														disabled={
															showLoadingState
														}
														className="rounded border border-current p-0.5 hover:opacity-70 disabled:cursor-not-allowed"
														onClick={() =>
															setShowCompactConfirm(
																true,
															)
														}
													>
														<Minimize2Icon className="h-3 w-3" />
													</button>
												</TooltipTrigger>
											</PopoverAnchor>
											<PopoverContent
												side="top"
												align="end"
												className="w-72 p-3"
											>
												<div className="flex items-start justify-between gap-2">
													<p className="font-medium text-sm">
														{t(
															"compaction.suggestionTitle",
														)}
													</p>
													<button
														type="button"
														className="rounded p-0.5 hover:opacity-70"
														aria-label={t(
															"compaction.dismissAriaLabel",
														)}
														onClick={() =>
															setCompactSuggestionDismissed(
																true,
															)
														}
													>
														<XIcon className="h-3.5 w-3.5" />
													</button>
												</div>
												<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
													{t(
														"compaction.suggestionDescription",
													)}
												</p>
												<Button
													size="sm"
													className="mt-3 w-full"
													onClick={() => {
														setCompactSuggestionDismissed(
															true,
														);
														setShowCompactConfirm(
															true,
														);
													}}
												>
													<Minimize2Icon className="mr-1.5 h-3.5 w-3.5" />
													{t(
														"compaction.suggestionButton",
													)}
												</Button>
											</PopoverContent>
										</Popover>
										<TooltipContent className="max-w-72">
											<p className="font-medium">
												{t("compaction.tooltipTitle")}
											</p>
											<p className="mt-1.5 text-xs leading-relaxed">
												{t(
													"compaction.tooltipDescription",
												)}
											</p>
											<div className="mt-2 border-current border-t pt-2 text-xs opacity-70">
												<div className="flex justify-between gap-4">
													<span>
														{t(
															"compaction.tooltipTokensUsed",
														)}
													</span>
													<span>
														{room.tokensUsed.toLocaleString()}
													</span>
												</div>
												<div className="flex justify-between gap-4">
													<span>
														{t(
															"compaction.tooltipUntilCompaction",
														)}
													</span>
													<span>
														{Math.max(
															0,
															Math.round(
																room.compactionThreshold -
																	room.tokensUsed,
															),
														).toLocaleString()}
													</span>
												</div>
												<div className="flex justify-between gap-4">
													<span>
														{t(
															"compaction.tooltipMessagesSince",
														)}
													</span>
													<span>
														{
															room.inputMessagesSinceCompaction
														}
													</span>
												</div>
											</div>
										</TooltipContent>
									</Tooltip>
								)}
						</div>
						<Dialog
							open={showCompactConfirm}
							onOpenChange={setShowCompactConfirm}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										{t("compaction.confirmTitle")}
									</DialogTitle>
									<DialogDescription>
										{t("compaction.confirmDescription")}
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() =>
											setShowCompactConfirm(false)
										}
									>
										{t("compaction.confirmCancel")}
									</Button>
									<Button
										onClick={() => {
											setShowCompactConfirm(false);
											room.compactContext(
												room.compactionThreshold,
											);
										}}
									>
										{t("compaction.confirmCompact")}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						{room.isCompacting ? (
							<div className="mx-auto flex w-screen max-w-4xl items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 text-muted-foreground text-sm shadow-sm">
								<Spinner size="sm" />
								<span>{t("compaction.compactingLabel")}</span>
							</div>
						) : null}
						{room.error ? (
							<div className="mx-auto flex w-screen max-w-4xl items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
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
							<span className="absolute top-4 right-4 z-50">
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
							<span className="absolute right-4 bottom-4 z-50">
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
			<div className="mx-auto w-full max-w-4xl shrink-0 p-4">
				<RoomInput
					className="max-h-56 min-h-24"
					isLoading={showLoadingState}
					hidePauseButton={!room.numberOfTools}
					model={room.model}
					setModel={(model) => {
						room.setModel(model);
						chat.setSelectedModel(model);
					}}
					MenuComponent={observer(
						({ addToken, onOpenChange, fileRef }) => (
							<>
								<RoomInputMenuUpload
									fileRef={fileRef}
									onSelect={() => onOpenChange(false)}
								/>
								<RoomInputMenuFileExplorer
									room={room}
									onSelect={() => onOpenChange(false)}
								/>
								<DropdownMenuSeparator />
								<RoomInputMenuKnowledge
									options={room.options}
									onSelect={(tool) => {
										handleToolSelect(tool);
										addToken(`<${tool.name}>`);
									}}
								/>
								<RoomInputMenuToolbox
									options={room.options}
									onSelect={(tool) => {
										handleToolSelect(tool);
										addToken(`<${tool.name}>`);
									}}
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
					footer={
						<RoomContextChart
							tokensUsed={room.tokensUsed}
							tokensMax={chat.models.contextWindow}
						/>
					}
				/>
			</div>
		</div>
	);
});
