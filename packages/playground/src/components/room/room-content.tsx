import {
	MoveDownIcon,
	MoveUpIcon,
	ScrollTextIcon,
	Settings2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { MCPToolResponse } from "@semoss/sdk";
import { EngineSelect } from "@semoss/shared";
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
import type { RoomStore } from "@/stores";
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

	/** State for the out-of-tokens model-switch dialog */
	const [tokenLimitDialog, setTokenLimitDialog] = useState<{
		open: boolean;
		/** The pending prompt + files to retry after model switch */
		pending: { prompt: string; files: File[] } | null;
	}>({ open: false, pending: null });

	/**
	 * Returns true if the error looks like a quota / token-limit rejection.
	 * Checks common provider error messages and HTTP status codes.
	 */
	const isTokenLimitError = (err: unknown): boolean => {
		const msg = (
			err instanceof Error ? err.message : String(err)
		).toLowerCase();
		return (
			msg.includes("quota") ||
			msg.includes("rate limit") ||
			msg.includes("token limit") ||
			msg.includes("insufficient_quota") ||
			msg.includes("429") ||
			msg.includes("out of tokens") ||
			msg.includes("context length exceeded") ||
			msg.includes("max tokens")
		);
	};

	/**
	 * Functions
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		// update the options
		await room.updateRoomOptions(room.options);

		// ask the room
		try {
			await room.askMessage(prompt, files);
		} catch (err) {
			if (isTokenLimitError(err)) {
				// Open the model-switch dialog and surface the pending message
				setTokenLimitDialog({ open: true, pending: { prompt, files } });
				return true;
			}
			// Re-throw so the existing error display picks it up
			throw err;
		}

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

	return (
		<>
			<div className="flex h-full w-full flex-col bg-background transition-all duration-200 ease-in-out">
				<div className="relative w-full flex-1 overflow-hidden">
					<ScrollArea
						// Force Radix's table-display viewport wrapper to block so wide content can't push the column past the viewport width
						className="[&_[data-slot=scroll-area-viewport]>div]:!block h-full w-full overflow-hidden"
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
									{room.theme.featureFlags
										?.showActivityLog !== false && (
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
						onCompact={handleCompactMessages}
						onOpenSettings={handleOpenSettings}
						excludeCommandIds={["agent", "workspace"]}
					/>
				</div>
			</div>

			{/* Out-of-tokens: model switch dialog */}
			<Dialog
				open={tokenLimitDialog.open}
				onOpenChange={(open) => {
					if (!open) {
						setTokenLimitDialog({ open: false, pending: null });
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Model limit reached</DialogTitle>
						<DialogDescription>
							The selected model has reached its token or quota
							limit. Switch to a different model to continue your
							conversation.
						</DialogDescription>
					</DialogHeader>

					<div className="rounded-md border border-input bg-transparent px-1 py-1 shadow-xs dark:bg-input/30">
						<EngineSelect
							className="w-full max-w-none"
							name={
								room.model?.engine_display_name ||
								room.model?.engine_name ||
								""
							}
							value={room.model?.engine_id || ""}
							engineTypes={["MODEL"]}
							metaFilters={[{ tag: "text-generation" }]}
							onChange={(model) => {
								room.setModel(model);
								chat.setSelectedModel(model);
							}}
							popoverContentProps={{ align: "start" }}
						/>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() =>
								setTokenLimitDialog({
									open: false,
									pending: null,
								})
							}
						>
							Cancel
						</Button>
						<Button
							disabled={!room.model}
							onClick={async () => {
								const pending = tokenLimitDialog.pending;
								setTokenLimitDialog({
									open: false,
									pending: null,
								});
								if (!pending) return;
								try {
									await room.updateRoomOptions(room.options);
									await room.askMessage(
										pending.prompt,
										pending.files,
									);
								} catch (err) {
									toast.error(
										err instanceof Error
											? err.message
											: "Failed to send message",
									);
								}
							}}
						>
							Retry with new model
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
