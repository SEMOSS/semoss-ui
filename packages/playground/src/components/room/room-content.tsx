import {
	MoveDownIcon,
	MoveUpIcon,
	Settings2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { MCPToolResponse } from "@semoss/sdk";
import {
	Button,
	DropdownMenuItem,
	DropdownMenuSeparator,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomInput,
	RoomInputMenuFileExplorer,
	RoomInputMenuKnowledge,
	RoomInputMenuToolbox,
	RoomInputMenuUpload,
} from "@/components";
import { useChat } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { MCPConfig } from "@/types";
import { RoomSuggestions } from "./room-suggestions";

const ENABLE_SUGGESTIONS = import.meta.env.VITE_ENABLE_SUGGESTIONS === "true";

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
					tool.name,
					tool.response,
					tool.tool_status,
					tool.executedParameters,
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

	/**
	 * Auto-scroll when dependency changes (new messages added)
	 */
	useEffect(() => {
		if (!scrollEle || isScrollLocked) {
			return;
		}

		const timeout = setTimeout(() => {
			const animationFrame = requestAnimationFrame(() => {
				scrollToTarget(contentHeight);
			});

			return () => cancelAnimationFrame(animationFrame);
		}, 100); // ~100ms delay to allow for rendering

		return () => clearTimeout(timeout);
	}, [scrollEle, scrollToTarget, isScrollLocked, contentHeight]);

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

	return (
		<div className="flex h-full w-full flex-col bg-secondary-background transition-all duration-200 ease-in-out">
			<div className="relative w-full flex-1 overflow-hidden">
				<ScrollArea
					className="h-full w-full"
					viewportRef={(ele) => {
						setScrollEle(ele);
					}}
				>
					<div
						ref={(ele) => {
							setContentEle(ele);
						}}
					>
						<div className="mx-auto flex w-screen max-w-4xl flex-col gap-4 px-4 py-6">
							{room.history.map((m, mIdx) => {
								if (!m.visible) {
									return null;
								}

								if (m.type === "INPUT") {
									return (
										<InputMessage
											key={m.key}
											room={room}
											message={m}
										/>
									);
								} else if (m.type === "RESPONSE") {
									return (
										<ResponseMessage
											key={m.key}
											room={room}
											message={m}
										/>
									);
								} else if (m.type === "PLAN") {
									return (
										<PlanMessage
											key={m.key}
											message={m}
											isLast={
												mIdx === room.history.length - 1
											}
										/>
									);
								}

								return null;
							})}
							{ENABLE_SUGGESTIONS && (
								<RoomSuggestions room={room} />
							)}
						</div>
						{room.error ? (
							<div className="mx-auto flex w-screen max-w-4xl items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm shadow-sm">
								<div className="flex h-10 w-10 items-center justify-center rounded-full">
									<TriangleAlertIcon className="h-6 w-6" />
								</div>
								<span>
									{room.error.message ||
										"Unable to process request. Please check your connection, copy your message, and refresh."}
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
									aria-label="Scroll to top"
									className="shadow-lg"
								>
									<MoveUpIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>Scroll to top</TooltipContent>
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
									aria-label="Scroll to bottom"
									className="shadow-lg"
								>
									<MoveDownIcon />
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>Scroll to bottom</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="mx-auto w-full max-w-4xl shrink-0 p-4">
				<RoomInput
					className="max-h-56 min-h-24"
					isLoading={room.isLoading}
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
										Edit Settings
									</span>
								</DropdownMenuItem>
							</>
						),
					)}
					onPrompt={handlePrompt}
					tokensMax={chat.models.contextWindow}
					tokensUsed={room.tokensUsed}
					hasOutstandingTools={room.hasUnfinishedTools}
				/>
			</div>
		</div>
	);
});
