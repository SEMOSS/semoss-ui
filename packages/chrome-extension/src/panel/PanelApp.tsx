/**
 * PanelApp Component
 *
 * Main UI for the browser automation extension panel.
 * Handles both script execution mode (running Playwright scripts from playground)
 * and recording mode (capturing user interactions for new scripts).
 *
 * Features:
 * - Dual mode: execution and recording
 * - Floating panel support with drag/resize
 * - Real-time script execution monitoring
 * - User input collection during script execution
 * - Field value mirroring for script debugging
 * - Tab lifecycle tracking
 */

import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import { Button, Card, cn, H1, H3, H4, Input, P } from "@semoss/ui/next";
import {
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";
import { escapePixelString, SemossClient } from "../services/semossClient";
import { RecordingPanel } from "./components/RecordingPanel";
import { WelcomeState } from "./components/WelcomeState";

// ============================================================================
// Type Definitions
// ============================================================================

type PanelMode = "execution" | "recording";

type AutomationInputRequest = {
	id: string;
	prompt: string;
	isPassword: boolean;
	selector?: string;
	targetTabId: number;
};

type AutomationInputState = {
	pendingInput?: AutomationInputRequest;
	updatedAt: number;
};

interface ChromeMessage {
	type: string;
	timestamp?: number;
	sourceTabId?: number;
	script?: {
		fileName: string;
		projectId: string;
	};
	payload?: {
		fileName: string;
		projectID: string;
		title?: string;
		scriptContent?: string;
	};
	value?: string;
	isPassword?: boolean;
	requestId?: string;
}

// ============================================================================
// PanelApp Component
// ============================================================================

const PanelApp: React.FC = () => {
	const searchParams = new URLSearchParams(window.location.search);
	const isFloatingPanel = searchParams.get("floating") === "1";
	const hostTabId = Number(searchParams.get("tabId"));
	const hasHostTabId =
		searchParams.has("tabId") && Number.isFinite(hostTabId);

	const [mode, setMode] = useState<PanelMode>("execution");
	const [isLoading, setIsLoading] = useState(true);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(isFloatingPanel);
	const [sharedInputState, setSharedInputState] =
		useState<AutomationInputState | null>(null);
	const [actionHistory, setActionHistory] = useState<string[]>([]);
	const [waitingForUserInput, setWaitingForUserInput] = useState(false);
	const [userInputPrompt, setUserInputPrompt] = useState("");
	const [userInputValue, setUserInputValue] = useState("");
	const [isPasswordInput, setIsPasswordInput] = useState(false);
	const [userInputCallback, setUserInputCallback] = useState<
		((value: string) => void) | null
	>(null);

	const historyEndRef = React.useRef<HTMLDivElement>(null);

	// Ref to track isRunning without causing useEffect re-runs
	const isRunningRef = useRef<boolean>(false);
	// Ref to track isPaused without causing useEffect re-runs
	const isPausedRef = useRef<boolean>(false);
	// Ref to track userInputCallback without causing useEffect re-runs
	const userInputCallbackRef = useRef(userInputCallback);
	const pendingInputRequestIdRef = useRef<string | null>(null);
	// Ref to track execution tab for cleanup detection
	const executionTabIdRef = useRef<number | null>(null);
	const tabRemovalListenerRef = useRef<((tabId: number) => void) | null>(
		null,
	);
	const tabActivatedListenerRef = useRef<
		((activeInfo: chrome.tabs.TabActiveInfo) => void) | null
	>(null);
	// Message queue for messages received before panel is ready
	const messageQueueRef = useRef<ChromeMessage[]>([]);
	const listenerReadyRef = useRef<boolean>(false);

	// Real-time input mirroring state
	const [currentSelector, setCurrentSelector] = useState<string | null>(null);
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dragStateRef = useRef<{
		pointerId: number;
		lastX: number;
		lastY: number;
		hasMoved: boolean;
	} | null>(null);
	const suppressNextClickRef = useRef(false);

	const startFloatingDrag = (event: React.PointerEvent<HTMLElement>) => {
		if (!isFloatingPanel || event.button !== 0) return;

		dragStateRef.current = {
			pointerId: event.pointerId,
			lastX: event.screenX,
			lastY: event.screenY,
			hasMoved: false,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const moveFloatingPanel = (event: React.PointerEvent<HTMLElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) return;

		const deltaX = event.screenX - dragState.lastX;
		const deltaY = event.screenY - dragState.lastY;
		if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

		dragState.hasMoved = true;
		dragState.lastX = event.screenX;
		dragState.lastY = event.screenY;
		window.parent.postMessage(
			{ type: "SMSS_FLOATING_PANEL_DRAG", deltaX, deltaY },
			"*",
		);
	};

	const finishFloatingDrag = (event: React.PointerEvent<HTMLElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) return;

		if (dragState.hasMoved) suppressNextClickRef.current = true;
		dragStateRef.current = null;
		event.currentTarget.releasePointerCapture(event.pointerId);
		window.parent.postMessage(
			{ type: "SMSS_FLOATING_PANEL_DRAG_END" },
			"*",
		);
	};

	const closeFloatingPanel = () => {
		if (!isFloatingPanel) return;
		window.parent.postMessage({ type: "SMSS_FLOATING_PANEL_CLOSE" }, "*");
	};

	const resetAutomationStatus = () => {
		if (isRunning || waitingForUserInput) return;
		setMode("execution");
		setIsPaused(false);
		setWaitingForUserInput(false);
		setUserInputPrompt("");
		setUserInputValue("");
		setIsPasswordInput(false);
		setUserInputCallback(null);
		setCurrentSelector(null);
		setCurrentTabId(null);
		setActionHistory([]);
	};

	// Auto-scroll to bottom when action history updates
	React.useEffect(() => {
		if (historyEndRef.current) {
			historyEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!isFloatingPanel) return;
		window.parent.postMessage(
			{ type: "SMSS_FLOATING_PANEL_RESIZE", expanded: !isCollapsed },
			"*",
		);
	}, [isCollapsed, isFloatingPanel]);

	useEffect(() => {
		chrome.runtime
			.sendMessage({ type: "GET_AUTOMATION_RUN_STATE" })
			.then((response) => {
				if (response?.state?.updatedAt)
					setSharedInputState(response.state);
			})
			.catch(() => {
				// The panel remains functional without a shared state snapshot.
			});

		const handleSharedRunState = (message: {
			type?: string;
			state?: AutomationInputState;
		}) => {
			if (
				message.type === "AUTOMATION_RUN_STATE_UPDATED" &&
				message.state
			) {
				setSharedInputState(message.state);
			}
		};

		chrome.runtime.onMessage.addListener(handleSharedRunState);
		return () =>
			chrome.runtime.onMessage.removeListener(handleSharedRunState);
	}, []);

	const sharedInputRequest = sharedInputState?.pendingInput;
	const remoteInputRequest =
		isFloatingPanel &&
		hasHostTabId &&
		sharedInputRequest?.targetTabId === hostTabId &&
		sharedInputRequest.id !== pendingInputRequestIdRef.current
			? sharedInputRequest
			: null;
	const remoteInputRequestId = remoteInputRequest?.id;

	useEffect(() => {
		if (!remoteInputRequestId) return;

		setMode("execution");
		setIsCollapsed(false);
		setUserInputValue("");
	}, [remoteInputRequestId]);

	useEffect(() => {
		if (!isFloatingPanel) return;

		const handleFloatingMessage = (event: MessageEvent) => {
			if (event.source !== window.parent) return;
			if (event.data?.type === "SMSS_FLOATING_PANEL_TOGGLE") {
				setIsCollapsed((previous) => !previous);
			}
			if (event.data?.type === "SMSS_FLOATING_PANEL_REQUEST_STATE") {
				window.parent.postMessage(
					{
						type: "SMSS_FLOATING_PANEL_RESIZE",
						expanded: !isCollapsed,
					},
					"*",
				);
			}
		};

		window.addEventListener("message", handleFloatingMessage);
		return () =>
			window.removeEventListener("message", handleFloatingMessage);
	}, [isCollapsed, isFloatingPanel]);

	useEffect(() => {
		chrome.runtime
			.sendMessage({
				type: "SMSS_EXTENSION_PANEL_OPENED",
				timestamp: Date.now(),
			})
			.catch((error) => {
				console.error("[PANEL] ❌ Failed to send open message:", error);
			});

		return () => {
			chrome.runtime
				.sendMessage({
					type: "SMSS_EXTENSION_PANEL_CLOSED",
					timestamp: Date.now(),
				})
				.catch((error) => {
					console.error(
						"[PANEL] ❌ Failed to send close message:",
						error,
					);
				});
		};
	}, []);

	// Listen for playground chat events from content script
	// biome-ignore lint/correctness/useExhaustiveDependencies: executeScriptWithContent and waitingForUserInput are intentionally excluded to prevent infinite loops
	useEffect(() => {
		const messageListener = (
			message: ChromeMessage,
			sender: chrome.runtime.MessageSender,
			sendResponse: (response?: { alive?: boolean }) => void,
		) => {
			if (message.type === "AUTOMATION_INPUT_SUBMITTED") {
				// Never log credential-bearing messages.
				if (
					message.requestId === pendingInputRequestIdRef.current &&
					typeof message.value === "string"
				) {
					userInputCallbackRef.current?.(message.value);
				}
				return;
			}

			const isExecutionMessage =
				message.type === "EXECUTE_PLAYWRIGHT_SCRIPT" ||
				message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT";
			const sourceTabId = message.sourceTabId ?? sender.tab?.id;

			if (
				isExecutionMessage &&
				((isFloatingPanel &&
					(!hasHostTabId || sourceTabId !== hostTabId)) ||
					(!isFloatingPanel && typeof sourceTabId === "number"))
			) {
				return;
			}

			// Respond to panel ping checks IMMEDIATELY (even if listener not fully ready)
			// This prevents "Extension Required" popup from showing
			if (message.type === "PANEL_PING_CHECK") {
				sendResponse({ alive: true });
				return true;
			}

			// If listener isn't ready yet, queue execution messages
			if (
				!listenerReadyRef.current &&
				(message.type === "EXECUTE_PLAYWRIGHT_SCRIPT" ||
					message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT")
			) {
				console.log(
					"[PANEL] 📥 Queuing message (listener not ready):",
					message.type,
				);
				messageQueueRef.current.push(message);
				return;
			}

			// CRITICAL: Only process messages forwarded by background script (sender.tab will be undefined)
			// Ignore direct messages from content scripts to prevent duplicate execution
			if (sender.tab && message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				return;
			}

			// CRITICAL: Block script execution if already running (use ref to avoid stale closure)
			if (
				(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
					message.type === "EXECUTE_PLAYWRIGHT_SCRIPT") &&
				isRunningRef.current
			) {
				return;
			}

			// Handle portal message format
			if (message.type === "EXECUTE_PLAYWRIGHT_SCRIPT") {
				const { fileName, projectID, title, scriptContent } =
					message.payload || {};

				if (!fileName || !projectID) {
					console.error(
						"[PANEL] ❌ Missing fileName or projectID in portal message",
					);
					return;
				}

				setIsCollapsed(false);

				// Set ref IMMEDIATELY to block duplicate messages
				isRunningRef.current = true;
				setIsRunning(true);

				setActionHistory([
					`🎬 Received script from Portal: ${title || fileName}`,
				]);
				setMode("execution");

				// Check if script content is provided (new format)
				if (scriptContent) {
					// Parse and set the script
					let content = scriptContent as {
						steps?: string | unknown[];
					};
					// Parse if it's a string
					if (typeof content === "string") {
						try {
							content = JSON.parse(content);
						} catch (e) {
							console.error(
								"[PANEL] ❌ Failed to parse script:",
								e,
							);
						}
					}

					// Parse nested steps if needed
					if (
						content &&
						typeof (content as unknown as { steps?: unknown })
							.steps === "string"
					) {
						try {
							(content as unknown as { steps: unknown }).steps =
								JSON.parse(
									(content as unknown as { steps: string })
										.steps,
								);
						} catch (e) {
							console.error(
								"[PANEL] ❌ Failed to parse steps:",
								e,
							);
						}
					}

					const finalScriptContent = JSON.stringify(content, null, 2);

					setActionHistory((prev) => [
						...prev,
						`✅ Script loaded: ${fileName}`,
						"▶️ Executing script in new tab...",
					]);

					// Execute immediately
					executeScriptWithContent(
						finalScriptContent,
						"playwright",
					).catch((error) => {
						console.error(
							"[PANEL] ❌ Error executing script:",
							error,
						);
						setActionHistory((prev) => [
							...prev,
							`❌ Failed to execute script: ${error instanceof Error ? error.message : String(error)}`,
						]);
					});
				} else {
					// Fallback: fetch script content from backend (for backwards compatibility)

					setActionHistory((prev) => [
						...prev,
						`🔄 Fetching script from backend: ${fileName}`,
					]);

					// Use async IIFE to handle async operations
					(async () => {
						try {
							// First get a session ID
							const sessionId =
								await SemossClient.runPixel<string>(
									"Session();",
								);

							if (!sessionId) {
								throw new Error("No session ID returned");
							}

							// Now fetch the script using GetAllSteps
							const scriptContent = await SemossClient.runPixel(
								`GetAllSteps(project=["${escapePixelString(projectID)}"], sessionId=["${escapePixelString(sessionId)}"], fileName=["${escapePixelString(fileName)}"]);`,
							);

							if (!scriptContent) {
								throw new Error("No script content returned");
							}

							// Check if response is an error message instead of valid JSON
							if (
								typeof scriptContent === "string" &&
								scriptContent.startsWith("Failed to")
							) {
								console.error(
									"[PANEL] ⚠️ Backend error:",
									scriptContent,
								);
								throw new Error(
									`Backend error: ${scriptContent}`,
								);
							}

							// Parse and set the script
							let content = scriptContent as {
								steps?: string | unknown[];
							};
							if (typeof content === "string") {
								try {
									content = JSON.parse(content);
								} catch (e) {
									console.error(
										"[PANEL] ❌ Failed to parse script:",
										e,
									);
									throw new Error(
										`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
									);
								}
							}

							if (content && typeof content.steps === "string") {
								try {
									content.steps = JSON.parse(content.steps);
								} catch (e) {
									console.error(
										"[PANEL] ❌ Failed to parse steps:",
										e,
									);
								}
							}

							const finalScriptContent = JSON.stringify(
								content,
								null,
								2,
							);

							setActionHistory((prev) => [
								...prev,
								`✅ Script loaded: ${fileName}`,
								"▶️ Executing script in new tab...",
							]);

							// Execute immediately
							await executeScriptWithContent(
								finalScriptContent,
								"playwright",
							);
						} catch (error) {
							console.error(
								"[PANEL] ❌ Error fetching/executing script:",
								error,
							);
							setActionHistory((prev) => [
								...prev,
								`❌ Failed to fetch script: ${error instanceof Error ? error.message : String(error)}`,
							]);
						}
					})();
				}
			}

			if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				// Handle Playwright script execution request from Playground
				const script = message.script;

				if (!script.fileName || !script.projectId) {
					console.error(
						"[PANEL] ❌ Missing fileName or projectId in playground message",
					);
					return;
				}

				setIsCollapsed(false);

				setActionHistory([
					`🎬 Received script from Playground: ${script.fileName}`,
				]);
				setMode("execution");
				setIsRunning(true);

				// Always fetch script content from backend (no longer accepting scriptContent)
				setActionHistory((prev) => [
					...prev,
					`🔄 Fetching script from backend: ${script.fileName}`,
				]);

				// Use async IIFE to handle async operations
				(async () => {
					try {
						// First get a session ID
						const sessionId =
							await SemossClient.runPixel<string>("Session();");

						if (!sessionId) {
							throw new Error("No session ID returned");
						}

						// Now fetch the script using GetAllSteps
						const scriptContent = await SemossClient.runPixel(
							`GetAllSteps(project=["${escapePixelString(script.projectId)}"], sessionId=["${escapePixelString(sessionId)}"], fileName=["${escapePixelString(script.fileName)}"]);`,
						);

						if (!scriptContent) {
							throw new Error("No script content returned");
						}

						// Check if response is an error message instead of valid JSON
						if (
							typeof scriptContent === "string" &&
							scriptContent.startsWith("Failed to")
						) {
							console.error(
								"[PANEL] ⚠️ Backend error:",
								scriptContent,
							);
							throw new Error(`Backend error: ${scriptContent}`);
						}

						// Parse and set the script
						let content = scriptContent as {
							steps?: string | unknown[];
						};
						if (typeof content === "string") {
							try {
								content = JSON.parse(content);
							} catch (e) {
								console.error(
									"[PANEL] ❌ Failed to parse script:",
									e,
								);
								throw new Error(
									`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
								);
							}
						}

						if (content && typeof content.steps === "string") {
							try {
								content.steps = JSON.parse(content.steps);
							} catch (e) {
								console.error(
									"[PANEL] ❌ Failed to parse steps:",
									e,
								);
							}
						}

						const finalScriptContent = JSON.stringify(
							content,
							null,
							2,
						);

						setActionHistory((prev) => [
							...prev,
							`✅ Script loaded: ${script.fileName}`,
							"▶️ Executing script in new tab...",
						]);

						// Execute immediately
						await executeScriptWithContent(
							finalScriptContent,
							"playwright",
						);
					} catch (error) {
						console.error(
							"[PANEL] ❌ Error fetching/executing script:",
							error,
						);
						setActionHistory((prev) => [
							...prev,
							`❌ Failed to fetch script: ${error instanceof Error ? error.message : String(error)}`,
						]);
					}
				})();
			}

			// Handle field input detected from webpage
			if (message.type === "FIELD_INPUT_DETECTED") {
				// SECURITY FIX: Do NOT auto-submit detected values (prevents autofill bypass)
				// Field detection is informational only - user MUST explicitly confirm input
				// This ensures test accuracy and prevents cached credentials from bypassing validation
				console.log(
					"[PANEL] ℹ️ Field input detected (not auto-submitting):",
					message.isPassword ? "[password field]" : message.value,
				);
				// Future enhancement: Show detected value as suggestion in dialog
				// For now, user must explicitly submit via dialog button/Enter key
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		// Mark listener as ready
		listenerReadyRef.current = true;

		// Process any queued messages
		if (messageQueueRef.current.length > 0) {
			console.log(
				`[PANEL] 📤 Processing ${messageQueueRef.current.length} queued message(s)`,
			);
			const queuedMessages = [...messageQueueRef.current];
			messageQueueRef.current = [];

			for (const queuedMessage of queuedMessages) {
				messageListener(
					queuedMessage,
					{} as chrome.runtime.MessageSender,
					() => {},
				);
			}
		}

		return () => {
			listenerReadyRef.current = false;
		};
	}, []); // No dependencies - listener stays stable throughout component lifecycle

	// Sync isRunning state with ref to avoid stale closures in message listener
	useEffect(() => {
		isRunningRef.current = isRunning;
	}, [isRunning]);

	// Sync isPaused state with ref to avoid stale closures
	useEffect(() => {
		isPausedRef.current = isPaused;
	}, [isPaused]);

	// Sync userInputCallback with ref to avoid stale closures in message listener
	useEffect(() => {
		userInputCallbackRef.current = userInputCallback;
	}, [userInputCallback]);

	const executeScriptWithContent = async (
		content: string,
		format?: "playwright",
	) => {
		await executeScript(content, format);
	};

	const executeScript = async (content: string, format?: "playwright") => {
		if (!content.trim()) {
			setActionHistory(["❌ Please upload a script JSON file first"]);
			return;
		}

		setIsRunning(true);
		setActionHistory([]);

		try {
			// Use provided format or fall back to default
			const scriptFormat = format || "playwright";

			// Parse script based on format
			const script: PlaywrightScript =
				ScriptExecutor.parseScript(content);
			// Get current tab
			let tab: chrome.tabs.Tab | undefined;
			if (chrome.devtools?.inspectedWindow) {
				const tabId = chrome.devtools.inspectedWindow.tabId;
				const tabs = await chrome.tabs.query({});
				tab = tabs.find((t) => t.id === tabId);
			} else {
				const [currentTab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				tab = currentTab;
			}

			if (!tab || !tab.id) {
				throw new Error("No active tab found");
			}

			// Convert script to actions based on format
			const actions: Array<{
				type: string;
				url?: string;
				selector?: string;
				coords?: { x: number; y: number };
				text?: string;
				label?: string;
				isPassword?: boolean;
				waitAfterMs?: number;
				tabId?: string;
				isTriggerNewTab?: { isTrue: boolean; tabId: string };
			}> = await ScriptExecutor.convertToActions(
				script as PlaywrightScript,
			);
			// Find the first navigate action (might not be the very first action)
			const firstNavigateAction = actions.find(
				(a) => a.type === "navigate" && a.url,
			);
			// For Playwright scripts: create a new tab if there's a navigate action
			const needsNewTab =
				scriptFormat === "playwright" && !!firstNavigateAction;
			const initialUrl = firstNavigateAction?.url || "about:blank";

			// Create ONE new tab for script execution
			let targetTab: chrome.tabs.Tab;
			let createdNewTab = false; // Track if we created a new tab
			if (needsNewTab) {
				const newTab = await chrome.tabs.create({
					active: true, // Make it active so user can see it
					url: initialUrl,
				});

				if (!newTab.id) {
					throw new Error("Failed to create new tab");
				}

				targetTab = newTab;
				createdNewTab = true; // Mark that we created a tab - prevents additional tabs later

				// Track execution tab for cleanup detection
				executionTabIdRef.current = newTab.id;

				// Listen for tab closure during execution
				const handleTabRemoved = (tabId: number) => {
					if (
						tabId === executionTabIdRef.current &&
						isRunningRef.current
					) {
						// Send cancellation message
						chrome.runtime
							.sendMessage({
								type: "SCRIPT_EXECUTION_COMPLETE",
								success: false,
								message:
									"Script execution cancelled: Tab was closed",
							})
							.catch((err) => {
								console.error(
									"[PANEL] ❌ Failed to send cancellation:",
									err,
								);
							});
						// Reset state
						setIsRunning(false);
						isRunningRef.current = false;
						setIsPaused(false);
						isPausedRef.current = false;
						executionTabIdRef.current = null;
						addToHistory("❌ Execution cancelled: Tab closed");
						// Remove listeners
						if (tabRemovalListenerRef.current) {
							chrome.tabs.onRemoved.removeListener(
								tabRemovalListenerRef.current,
							);
							tabRemovalListenerRef.current = null;
						}
						if (tabActivatedListenerRef.current) {
							chrome.tabs.onActivated.removeListener(
								tabActivatedListenerRef.current,
							);
							tabActivatedListenerRef.current = null;
						}
					}
				};

				tabRemovalListenerRef.current = handleTabRemoved;
				chrome.tabs.onRemoved.addListener(handleTabRemoved);

				// Listen for tab activation changes to pause/resume execution
				const handleTabActivated = (
					activeInfo: chrome.tabs.TabActiveInfo,
				) => {
					if (!isRunningRef.current || !executionTabIdRef.current) {
						return;
					}

					if (activeInfo.tabId === executionTabIdRef.current) {
						// User returned to the execution tab
						if (isPausedRef.current) {
							setIsPaused(false);
							isPausedRef.current = false;
						}
					} else {
						// User switched away from the execution tab
						if (!isPausedRef.current) {
							setIsPaused(true);
							isPausedRef.current = true;
						}
					}
				};

				tabActivatedListenerRef.current = handleTabActivated;
				chrome.tabs.onActivated.addListener(handleTabActivated);
			} else {
				// Use the current tab if no navigate action at start
				if (!tab || !tab.id) {
					throw new Error("No active tab available");
				}
				targetTab = tab;
			}

			// Track tabs: maps tabId (tab-1, tab-2) to Chrome tab ID
			const tabMap = new Map<string, number>();
			if (!targetTab.id) {
				throw new Error("Target tab has no ID");
			}
			tabMap.set("tab-1", targetTab.id); // First tab is the target tab
			let currentTabId = targetTab.id;

			// Track which navigate URL we already executed during tab creation
			const preExecutedNavigateUrl = createdNewTab ? initialUrl : null;

			// Execute each action
			let actionCounter = 0; // Track actual displayed action numbers
			for (let i = 0; i < actions.length; i++) {
				const action = actions[i];

				// Wait while paused
				while (isPausedRef.current) {
					await new Promise((resolve) => setTimeout(resolve, 200));
				}

				// Skip navigate action if we already executed it during tab creation
				if (
					action.type === "navigate" &&
					action.url === preExecutedNavigateUrl
				) {
					actionCounter++;
					addToHistory(`${actionCounter}. NAVIGATE`);
					continue;
				}

				// Handle tab switching (case-insensitive)
				if (action.type.toLowerCase() === "switchtab") {
					if (!action.tabId) {
						throw new Error("switchTab action requires tabId");
					}

					const targetTabId = tabMap.get(action.tabId);

					if (!targetTabId) {
						// Wait for the tab to be created (from previous action)
						await new Promise((resolve) =>
							setTimeout(resolve, 1500),
						); // Try to find the new tab
						const allTabs = await chrome.tabs.query({});
						// Assume the newest tab is the one we want
						const newestTab = allTabs[allTabs.length - 1];
						if (newestTab?.id) {
							tabMap.set(action.tabId, newestTab.id);
							currentTabId = newestTab.id;

							// Make tab active
							await chrome.tabs.update(currentTabId, {
								active: true,
							});

							// Attach debugger to the new tab
							try {
								await chrome.runtime.sendMessage({
									type: "ATTACH_DEBUGGER",
									tabId: currentTabId,
								});
								if (chrome.runtime.lastError) {
									// Ignore bfcache errors silently
								}
							} catch (error) {
								console.log(
									"Debugger attach (may already be attached):",
									error,
								);
							}

							// Wait for tab to become active and page to load
							let loadTimeout = 15; // Max 15 seconds
							while (loadTimeout > 0) {
								const tabs = await chrome.tabs.query({});
								const tab = tabs.find(
									(t) => t.id === currentTabId,
								);
								if (tab && tab.status === "complete") {
									// Give extra time for content script to initialize
									await new Promise((resolve) =>
										setTimeout(resolve, 1500),
									);
									break;
								}
								await new Promise((resolve) =>
									setTimeout(resolve, 500),
								);
								loadTimeout--;
							}
						} else {
							throw new Error(
								`Could not find tab: ${action.tabId}`,
							);
						}
					} else {
						currentTabId = targetTabId;
						await chrome.tabs.update(currentTabId, {
							active: true,
						});

						// Attach debugger to the new tab
						try {
							await chrome.runtime.sendMessage({
								type: "ATTACH_DEBUGGER",
								tabId: currentTabId,
							});
							// Check for bfcache error and ignore it
							if (chrome.runtime.lastError) {
								// Ignore bfcache errors silently
							}
						} catch (error) {
							console.log(
								"Debugger attach (may already be attached):",
								error,
							);
						}

						// Wait for tab to become active and page to load
						let loadTimeout = 15; // Max 15 seconds
						while (loadTimeout > 0) {
							const tabs = await chrome.tabs.query({});
							const tab = tabs.find((t) => t.id === currentTabId);
							if (tab && tab.status === "complete") {
								// Give extra time for content script to initialize
								await new Promise((resolve) =>
									setTimeout(resolve, 1000),
								);
								break;
							}
							await new Promise((resolve) =>
								setTimeout(resolve, 500),
							);
							loadTimeout--;
						}
					}

					continue;
				}

				actionCounter++; // Increment only for displayed actions
				addToHistory(
					`${actionCounter}. ${action.type.toUpperCase()}${action.label ? `: ${action.label}` : ""}`,
				);

				// Handle ask user for TYPE actions
				const onAskUser = async (
					label: string,
					isPassword: boolean,
					selector?: string,
					targetTabId?: number,
				): Promise<string> => {
					return new Promise<string>((resolve) => {
						const prompt = `${isPassword ? "🔒 " : ""}${label}`;
						const requestId = crypto.randomUUID();
						pendingInputRequestIdRef.current = requestId;
						setUserInputPrompt(prompt);
						setIsPasswordInput(isPassword);
						setWaitingForUserInput(true);

						// Store selector and tabId for real-time mirroring
						setCurrentSelector(selector || null);
						setCurrentTabId(targetTabId || null);

						// SECURITY FIX: Clear autofilled values BEFORE prompting to prevent confusion
						// This ensures user sees empty field and provides explicit input
						if (selector && targetTabId) {
							chrome.runtime
								.sendMessage({
									type: "CLEAR_FIELD_VALUE",
									tabId: targetTabId,
									selector: selector,
								})
								.catch((err) => {});
						}

						// Highlight the field on the webpage while the dialog is open
						if (selector && targetTabId) {
							chrome.runtime
								.sendMessage({
									type: "HIGHLIGHT_FIELD",
									tabId: targetTabId,
									selector: selector,
								})
								.catch((err) => {});
						}

						// Start monitoring the field on the webpage
						if (selector && targetTabId) {
							chrome.runtime
								.sendMessage({
									type: "START_FIELD_MONITORING",
									tabId: targetTabId,
									selector: selector,
									isPassword: isPassword,
								})
								.catch((err) => {
									// This is not critical - user can still input via extension dialog
								});
						}

						const resolveUserInput = (value: string) => {
							pendingInputRequestIdRef.current = null;
							// Remove highlight when input is received
							if (selector && targetTabId) {
								chrome.runtime
									.sendMessage({
										type: "REMOVE_HIGHLIGHT",
										tabId: targetTabId,
										selector: selector,
									})
									.catch((err) => {
										// Not critical
									});
							}

							// Stop monitoring when input is received
							if (selector && targetTabId) {
								chrome.runtime
									.sendMessage({
										type: "STOP_FIELD_MONITORING",
										tabId: targetTabId,
										selector: selector,
									})
									.catch((err) => {
										// Not critical - monitoring will cleanup on its own
									});
							}

							setWaitingForUserInput(false);
							setUserInputPrompt("");
							setUserInputValue("");
							setIsPasswordInput(false);
							setUserInputCallback(null);
							chrome.runtime
								.sendMessage({
									type: "RESOLVE_AUTOMATION_INPUT_REQUEST",
									requestId,
								})
								.catch(() => {
									// Shared request cleanup is best effort.
								});
							resolve(value);
						};
						userInputCallbackRef.current = resolveUserInput;
						setUserInputCallback(() => resolveUserInput);

						chrome.runtime
							.sendMessage({
								type: "REGISTER_AUTOMATION_INPUT_REQUEST",
								request: {
									id: requestId,
									prompt,
									isPassword,
									selector,
									targetTabId,
								},
							})
							.catch(() => {
								// The local panel remains usable if sharing fails.
							});
					});
				};

				await ScriptExecutor.executeAction(
					currentTabId,
					action,
					onAskUser,
				);

				// If this action triggers anew tab, track it (but skip if we already created initial tab)
				if (action.isTriggerNewTab?.isTrue && !createdNewTab) {
					// Wait for new tab to be created
					await new Promise((resolve) => setTimeout(resolve, 1500));

					// Find the new tab
					const allTabs = await chrome.tabs.query({});
					const newestTab = allTabs[allTabs.length - 1];
					if (newestTab?.id) {
						tabMap.set(action.isTriggerNewTab.tabId, newestTab.id);
						currentTabId = newestTab.id;

						// Make the new tab active
						await chrome.tabs.update(currentTabId, {
							active: true,
						});

						// Attach debugger to the new tab
						try {
							await chrome.runtime.sendMessage({
								type: "ATTACH_DEBUGGER",
								tabId: currentTabId,
							});
						} catch (_error) {}

						// Wait for the new tab's page to fully load
						let loadTimeout = 15; // Max 15 seconds
						while (loadTimeout > 0) {
							const tabs = await chrome.tabs.query({});
							const tab = tabs.find((t) => t.id === currentTabId);
							if (tab && tab.status === "complete") {
								// Give extra time for content script to initialize
								await new Promise((resolve) =>
									setTimeout(resolve, 1500),
								);
								break;
							}
							await new Promise((resolve) =>
								setTimeout(resolve, 500),
							);
							loadTimeout--;
						}
					}
				}
			}

			addToHistory("✅ Script execution completed!");

			// Notify playground of successful execution
			try {
				await chrome.runtime.sendMessage({
					type: "SCRIPT_EXECUTION_COMPLETE",
					success: true,
					message: "Script executed successfully",
				});
			} catch (err) {
				console.error(
					"[PANEL] ❌ Failed to send completion message:",
					err,
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addToHistory(`❌ Error: ${errorMessage}`);
			// Notify playground of failed execution
			try {
				await chrome.runtime.sendMessage({
					type: "SCRIPT_EXECUTION_COMPLETE",
					success: false,
					message: `Script execution failed: ${errorMessage}`,
				});
			} catch (err) {
				console.error("[PANEL] ❌ Failed to send error message:", err);
			}
		} finally {
			setIsRunning(false);
			isRunningRef.current = false;
			setIsPaused(false);
			isPausedRef.current = false;

			// Clean up listeners
			if (tabRemovalListenerRef.current) {
				chrome.tabs.onRemoved.removeListener(
					tabRemovalListenerRef.current,
				);
				tabRemovalListenerRef.current = null;
			}
			if (tabActivatedListenerRef.current) {
				chrome.tabs.onActivated.removeListener(
					tabActivatedListenerRef.current,
				);
				tabActivatedListenerRef.current = null;
			}
			executionTabIdRef.current = null;
		}
	};

	const [_historyCounter, setHistoryCounter] = React.useState(0);

	const addToHistory = (message: string, skipNumbering = false) => {
		// Skip adding counter for:
		// 1. Messages that explicitly request no numbering
		// 2. Step separator lines and initial messages
		// 3. Messages that already have their own format (like numbering)
		if (
			skipNumbering ||
			message.startsWith("\n---") ||
			message.startsWith("Connecting") ||
			message.startsWith("✓") || // All checkmark messages (includes Switched, New tab, User provided, etc.)
			message.startsWith("✓ Workshop") ||
			message.startsWith("✓ Found") || // Script action count
			message.match(/^\d+\./) || // Already has number like "1. NAVIGATE"
			message.startsWith("⏳ Waiting") || // Waiting messages
			message.startsWith("✅") || // Success messages
			message.startsWith("❌") // Error messages
		) {
			setActionHistory((prev) => [...prev, message]);
		} else {
			setHistoryCounter((prev) => {
				const newCount = prev + 1;
				setActionHistory((history) => [
					...history,
					`${newCount}. ${message}`,
				]);
				return newCount;
			});
		}
	};

	const effectiveNeedsInput = waitingForUserInput || !!remoteInputRequest;
	const effectiveRunning = isRunning;
	const launcherStatus = effectiveNeedsInput
		? "Input required"
		: effectiveRunning
			? "Running automation"
			: "Browser Automation";
	const canResetAutomationStatus =
		!effectiveRunning && !effectiveNeedsInput && actionHistory.length > 0;
	const displayedInputRequest = remoteInputRequest
		? remoteInputRequest
		: waitingForUserInput
			? {
					id: pendingInputRequestIdRef.current || "local",
					prompt: userInputPrompt,
					isPassword: isPasswordInput,
					selector: currentSelector || undefined,
					targetTabId: currentTabId || 0,
				}
			: null;
	const isRemoteInput = !!remoteInputRequest;
	const inputIsPaused = !isRemoteInput && isPaused;
	const submitDisplayedInput = () => {
		if (!displayedInputRequest || !userInputValue.trim()) return;

		if (isRemoteInput) {
			chrome.runtime
				.sendMessage({
					type: "SUBMIT_AUTOMATION_INPUT",
					requestId: displayedInputRequest.id,
					value: userInputValue,
				})
				.then((response) => {
					if (response?.success) setUserInputValue("");
				})
				.catch((error) => {
					console.error(
						"[PANEL] ❌ Failed to submit automation input:",
						error,
					);
				});
			return;
		}

		userInputCallback?.(userInputValue);
	};

	if (isFloatingPanel && isCollapsed) {
		return (
			<button
				type="button"
				className={cn(
					"floating-launcher",
					effectiveRunning && "floating-launcher--busy",
					effectiveNeedsInput && "floating-launcher--needs-input",
				)}
				onClick={() => {
					if (suppressNextClickRef.current) {
						suppressNextClickRef.current = false;
						return;
					}
					setIsCollapsed(false);
				}}
				onPointerDown={startFloatingDrag}
				onPointerMove={moveFloatingPanel}
				onPointerUp={finishFloatingDrag}
				onPointerCancel={finishFloatingDrag}
				aria-label={launcherStatus}
				title={launcherStatus}
			>
				<span className="floating-launcher-icon" aria-hidden="true">
					<svg viewBox="0 0 28 28">
						<title>Browser automation</title>
						<rect x="4" y="5" width="20" height="16" rx="3" />
						<path d="M4 10h20" />
						<path d="M9 8h.01" />
						<path d="M13 8h.01" />
						<path d="M12 15l4 2-3 2.5 1.5 3" />
						<path d="M17.5 17.5l2 2" />
					</svg>
				</span>
				{effectiveRunning && (
					<span
						className="floating-launcher-spinner"
						aria-hidden="true"
					/>
				)}
				{effectiveNeedsInput && (
					<span className="floating-launcher-badge">1</span>
				)}
			</button>
		);
	}

	if (isLoading) {
		return (
			<div className="panel-container">
				<div className="panel-content">
					<div
						style={{
							textAlign: "center",
							padding: "40px",
							color: "#666",
						}}
					>
						Loading...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"panel-container",
				isFloatingPanel && "panel-container--floating",
			)}
		>
			<div
				className={cn(
					"panel-header",
					isFloatingPanel && "panel-header--draggable",
				)}
				onPointerDown={startFloatingDrag}
				onPointerMove={moveFloatingPanel}
				onPointerUp={finishFloatingDrag}
				onPointerCancel={finishFloatingDrag}
			>
				<H1 className="panel-title">Browser Automation</H1>
				{isFloatingPanel && (
					<div className="panel-header-actions">
						<Button
							type="button"
							className="panel-reset-btn"
							onPointerDown={(event) => event.stopPropagation()}
							onClick={resetAutomationStatus}
							disabled={!canResetAutomationStatus}
							aria-label="Reset automation status"
							title="Reset automation status"
						>
							<svg
								className="panel-reset-icon"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path d="M3 12a9 9 0 1 0 3-6.7" />
								<path d="M3 4v5h5" />
							</svg>
						</Button>
						<Button
							type="button"
							className="panel-icon-btn panel-collapse-btn"
							onPointerDown={(event) => event.stopPropagation()}
							onClick={() => setIsCollapsed(true)}
							aria-label="Collapse Browser Automation"
							title="Collapse"
						>
							-
						</Button>
						<Button
							type="button"
							className="panel-icon-btn panel-close-btn"
							onPointerDown={(event) => event.stopPropagation()}
							onClick={closeFloatingPanel}
							aria-label="Close Browser Automation"
							title="Close"
						>
							x
						</Button>
					</div>
				)}
			</div>

			<div className="custom-tabs">
				<div className="custom-tabs-list">
					<button
						type="button"
						className={
							mode === "execution"
								? "custom-tab-trigger active"
								: "custom-tab-trigger"
						}
						onClick={() => setMode("execution")}
					>
						⚡ Execute Scripts
					</button>
					<button
						type="button"
						className={
							mode === "recording"
								? "custom-tab-trigger active"
								: "custom-tab-trigger"
						}
						onClick={() => setMode("recording")}
					>
						🎬 Record Script
					</button>
				</div>

				{isPaused && mode === "execution" && (
					<div
						style={{
							marginLeft: "32px",
							display: "inline-flex",
							alignItems: "center",
							gap: "12px",
							borderRadius: "8px",
							border: "1.5px solid rgba(255, 152, 0, 0.8)",
							background: "rgba(255, 152, 0, 0.15)",
							padding: "12px 32px",
							color: "white",
							boxShadow: "0 2px 8px rgba(255, 152, 0, 0.3)",
						}}
					>
						<P
							style={{
								fontWeight: "bold",
								fontSize: "0.8125rem",
								letterSpacing: "0.5px",
							}}
						>
							⏸️ PAUSED
						</P>
					</div>
				)}

				<div className="panel-content">
					<div
						className={
							mode === "execution"
								? "custom-tab-content active"
								: "custom-tab-content"
						}
					>
						{/* Welcome State - shown when no script is running */}
						{!isRunning && actionHistory.length === 0 && (
							<WelcomeState />
						)}

						{/* Action History */}
						{actionHistory.length > 0 && (
							<div className="w-full">
								<Card className="w-full border border-border bg-background p-10 shadow-sm">
									<H4 className="mb-8 font-semibold text-[0.9375rem] text-muted-foreground uppercase tracking-[0.5px]">
										Execution Log
									</H4>
									<div className="flex flex-col gap-3">
										{actionHistory.map((action, index) => {
											const isError =
												action.startsWith("❌");
											const isSuccess =
												action.startsWith("✅");
											const isCheckmark =
												action.startsWith("✓");
											const isNumbered =
												action.match(/^\d+\./);
											const isUserInput = action.includes(
												"User provided input",
											);

											return (
												<div
													key={`action-${index}-${action.substring(0, 20)}`}
													className={`rounded-xl border px-6 py-4 transition-all duration-200 hover:translate-x-0.5 ${
														isError
															? "border-red-300 bg-red-50 hover:border-red-500 hover:bg-red-100"
															: isSuccess
																? "border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100"
																: isCheckmark
																	? "border-[rgba(76,175,80,0.3)] bg-[rgba(76,175,80,0.04)] hover:border-[rgba(76,175,80,0.5)] hover:bg-[rgba(76,175,80,0.08)]"
																	: isUserInput
																		? "border-border bg-[rgba(25,118,210,0.04)] hover:border-blue-300 hover:bg-[rgba(25,118,210,0.08)]"
																		: "border-border bg-background hover:bg-accent"
													}`}
												>
													<P
														className={`text-[0.8125rem] leading-relaxed tracking-[0.01em] ${
															isError
																? "font-medium text-red-700"
																: isSuccess
																	? "font-medium text-green-700"
																	: isCheckmark
																		? "font-normal text-green-600"
																		: "text-foreground"
														} ${
															isNumbered ||
															isError ||
															isSuccess
																? "font-medium"
																: "font-normal"
														} ${
															isNumbered
																? "font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',system-ui]"
																: ""
														}`}
													>
														{action}
													</P>
												</div>
											);
										})}
										<div ref={historyEndRef} />
									</div>
								</Card>
							</div>
						)}

						{/* User Input Dialog */}
						{displayedInputRequest && (
							<div className="user-input-overlay">
								<div className="user-input-dialog">
									<H3>Input Required</H3>
									<P>{displayedInputRequest.prompt}</P>
									<Input
										type={
											displayedInputRequest.isPassword
												? "password"
												: "text"
										}
										value={userInputValue}
										disabled={inputIsPaused}
										onChange={(e) => {
											const newValue = e.target.value;
											setUserInputValue(newValue);
											if (
												displayedInputRequest.selector &&
												displayedInputRequest.targetTabId
											) {
												// Clear existing debounce timer
												if (debounceTimerRef.current) {
													clearTimeout(
														debounceTimerRef.current,
													);
												}

												// Debounce the update to avoid excessive messages
												debounceTimerRef.current =
													setTimeout(() => {
														chrome.runtime
															.sendMessage({
																type: "UPDATE_FIELD_VALUE",
																tabId: displayedInputRequest.targetTabId,
																selector:
																	displayedInputRequest.selector,
																value: newValue,
															})
															.catch((err) => {});
													}, 75); // 75ms debounce for responsive feel
											}
										}}
										placeholder="Enter value..."
										onKeyDown={(e) => {
											if (
												e.key === "Enter" &&
												userInputValue.trim()
											) {
												e.preventDefault();
												submitDisplayedInput();
											}
										}}
									/>
									<div className="user-input-buttons">
										<Button
											variant="default"
											onClick={submitDisplayedInput}
											disabled={
												!userInputValue.trim() ||
												inputIsPaused
											}
											className="rounded-xl bg-blue-600 px-16 py-4 font-semibold text-base text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:opacity-60"
										>
											Submit
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>

					<div
						className={
							mode === "recording"
								? "custom-tab-content active"
								: "custom-tab-content"
						}
					>
						<RecordingPanel />
					</div>
				</div>
			</div>
		</div>
	);
};

export default PanelApp;
