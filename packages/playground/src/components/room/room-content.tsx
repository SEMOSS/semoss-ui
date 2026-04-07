import {
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
	ScrollArea,
	Separator,
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
	const [lastGoogleRecorderJSON, setLastGoogleRecorderJSON] =
		useState<any>(null);

	/**
	 * Functions
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		console.log("[PLAYGROUND] handlePrompt called with:", {
			prompt,
			fileCount: files.length,
			fileNames: files.map((f) => f.name),
		});

		// Check if prompt contains Google Recorder JSON
		const jsonMatch = prompt.match(
			/```json\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```|({[\s\S]*})/,
		);
		if (jsonMatch) {
			console.log("[PLAYGROUND] JSON code block detected in prompt");
			try {
				const jsonText = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
				const parsed = JSON.parse(jsonText);
				console.log("[PLAYGROUND] Parsed JSON from prompt:", {
					hasTitle: !!parsed.title,
					hasSteps: !!parsed.steps,
				});
				// Check if it's a Google Recorder script (has title and steps)
				if (parsed.title && Array.isArray(parsed.steps)) {
					setLastGoogleRecorderJSON(parsed);
					console.log(
						"[PLAYGROUND] ✅ Google Recorder JSON detected and stored:",
						{
							title: parsed.title,
							stepCount: parsed.steps.length,
						},
					);
				}
			} catch (e) {
				console.log(
					"[PLAYGROUND] ❌ Failed to parse JSON from prompt:",
					e,
				);
			}
		}

		// Check for attached JSON files
		let scriptFromFile: any = null;
		console.log("[PLAYGROUND] Checking for attached JSON files...");
		for (const file of files) {
			console.log(
				"[PLAYGROUND] Examining file:",
				file.name,
				"type:",
				file.type,
			);
			if (file.name.endsWith(".json")) {
				console.log("[PLAYGROUND] Reading JSON file:", file.name);
				try {
					const fileContent = await file.text();
					console.log(
						"[PLAYGROUND] File content length:",
						fileContent.length,
					);
					const parsed = JSON.parse(fileContent);
					console.log("[PLAYGROUND] Parsed file JSON:", {
						hasTitle: !!parsed.title,
						hasMeta: !!parsed.meta,
						hasSteps: !!parsed.steps,
						stepsIsArray: Array.isArray(parsed.steps),
					});
					// Check if it's a Google Recorder script (has title and steps)
					if (parsed.title && Array.isArray(parsed.steps)) {
						scriptFromFile = parsed;
						setLastGoogleRecorderJSON(parsed);
						console.log(
							"[PLAYGROUND] ✅ Google Recorder JSON file detected:",
							{
								fileName: file.name,
								title: parsed.title,
								stepCount: parsed.steps.length,
							},
						);
						break;
					}
					// Check if it's a Playwright script (has meta and steps)
					else if (parsed.meta && parsed.steps) {
						scriptFromFile = parsed;
						console.log(
							"[PLAYGROUND] ✅ Playwright JSON file detected:",
							{
								fileName: file.name,
								title: parsed.meta?.title,
								stepKeys: Object.keys(parsed.steps),
							},
						);
						// Store as last script for potential execution
						setLastGoogleRecorderJSON(parsed);
						break;
					} else {
						console.log(
							"[PLAYGROUND] ⚠️ JSON file is not a recognized script format:",
							file.name,
						);
					}
				} catch (e) {
					console.error(
						"[PLAYGROUND] ❌ Failed to parse JSON file:",
						file.name,
						e,
					);
				}
			}
		}

		// Check if user is asking to execute/follow the steps
		// More flexible pattern matching for execution requests
		const normalizedPrompt = prompt.toLowerCase().trim();

		// Check for execution keywords
		const hasExecuteKeyword =
			/\b(execute|run|play|perform|start|launch|trigger|replay)\b/.test(
				normalizedPrompt,
			);

		// Check if the prompt mentions what to execute (script, file, recording, steps, etc.)
		// or if it's just a single execute command with a script available
		const hasScriptReference =
			/\b(this|that|it|the|script|file|recording|steps?|instructions?|automation|test|flow|sequence)\b/.test(
				normalizedPrompt,
			);

		// Consider it an execute request if:
		// 1. User says execute/run/etc AND references something to execute
		// 2. OR user just says execute/run with a script available (scriptFromFile or lastGoogleRecorderJSON)
		// 3. OR prompt contains phrases like "execute this file", "run the script", "play recording", etc.
		const isExecuteRequest =
			(hasExecuteKeyword &&
				(hasScriptReference ||
					scriptFromFile ||
					lastGoogleRecorderJSON)) ||
			/\b(execute|run|play|perform|start|launch)\s+(this|that|the|it|my)?\s*(script|file|recording|steps?|instructions?|automation|test|flow)?\b/.test(
				normalizedPrompt,
			);

		// Determine which script to execute (prefer current file over previous state)
		const availableScript = scriptFromFile || lastGoogleRecorderJSON;

		console.log("[PLAYGROUND] Execution check:", {
			normalizedPrompt: normalizedPrompt.substring(0, 50),
			hasExecuteKeyword,
			hasScriptReference,
			hasScriptFromFile: !!scriptFromFile,
			hasLastScript: !!lastGoogleRecorderJSON,
			hasAvailableScript: !!availableScript,
			isExecuteRequest,
		});

		// Execute script if conditions are met
		// Use availableScript (local variable) instead of state to avoid timing issues
		if (isExecuteRequest && availableScript) {
			// Determine script type
			const isPlaywright =
				availableScript.meta &&
				availableScript.steps &&
				!Array.isArray(availableScript.steps);
			const messageType = isPlaywright
				? "SMSS_EXEC_PLAYWRIGHT_SCRIPT"
				: "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT";

			console.log("[PLAYGROUND] 🚀 Sending script to Chrome extension:", {
				scriptType: isPlaywright ? "Playwright" : "Google Recorder",
				messageType,
				scriptName:
					availableScript.title ||
					availableScript.meta?.title ||
					"Playground Script",
				hasScriptContent: !!availableScript,
				origin: window.location.origin,
			});

			// Use setTimeout to ensure message is sent after current call stack completes
			// This helps with timing issues on first execution
			setTimeout(() => {
				window.postMessage(
					{
						type: messageType,
						script: {
							name:
								availableScript.title ||
								availableScript.meta?.title ||
								"Playground Script",
							autoExecute: true,
							scriptContent: availableScript,
						},
					},
					window.location.origin,
				);
				console.log(
					`[PLAYGROUND] ✅ ${isPlaywright ? "Playwright" : "Google Recorder"} script sent via window.postMessage`,
				);
			}, 0);

			// Don't send to backend when executing via extension
			console.log(
				"[PLAYGROUND] ℹ️ Skipping backend message - script execution handled by extension",
			);
			return true;
		} else {
			console.log(
				"[PLAYGROUND] ℹ️ Not executing script - conditions not met",
			);
		}

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
				type: string;
				success?: boolean;
				message?: string;
				tool?: MCPToolResponse;
			}>,
		) => {
			try {
				// Handle script execution completion from chrome extension
				if (
					event.data &&
					event.data.type === "SMSS_SCRIPT_EXECUTION_COMPLETE"
				) {
					console.log(
						"[PLAYGROUND] 📥 Received script execution complete:",
						event.data,
					);

					// Get the last response message to append the completion status
					const lastMessage = room.history[room.history.length - 1];
					if (lastMessage && lastMessage.type === "RESPONSE") {
						// Add execution result as a new message
						const statusEmoji = event.data.success ? "✅" : "❌";
						const statusMessage = `${statusEmoji} ${event.data.message || "Script execution completed"}`;

						// Process as a tool result
						room.processTool(
							lastMessage.id,
							"chrome-extension-script",
							"Chrome Extension Script Execution",
							statusMessage,
							event.data.success ? "success" : "error",
						);
					}
					return;
				}

				if (!event.data || event.data.type !== "SMSS_EXEC_TOOL") {
					return;
				}

				const tool = event.data.tool;

				if (!tool) {
					return;
				}
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
