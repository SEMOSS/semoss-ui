import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import { Button, Card, cn, Input } from "@semoss/ui/next";
import {
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";
import { WelcomeState } from "./components/WelcomeState";

type PanelRuntimeMessage = {
	type: string;
	timestamp?: number;
	sourceTabId?: number;
	script?: {
		name?: string;
		scriptContent?: unknown;
	};
	value?: string;
	isPassword?: boolean;
};

type FloatingPanelExternalStatus = {
	isLoading?: boolean;
	isRunning?: boolean;
	needsInput?: boolean;
	message?: string;
	recordingName?: string;
	currentStep?: string;
	stepIndex?: number;
	stepCount?: number;
};

type AutomationRunState = {
	active: boolean;
	status:
		| "idle"
		| "loading"
		| "running"
		| "needs-input"
		| "complete"
		| "failed";
	recordingName?: string;
	message?: string;
	currentStep?: string;
	stepIndex?: number;
	stepCount?: number;
	history: string[];
	tabIds: number[];
	updatedAt: number;
};

type AutomationRunStatePatch = Partial<AutomationRunState>;

const PanelApp: React.FC = () => {
	const searchParams = new URLSearchParams(window.location.search);
	const isFloatingPanel = searchParams.get("floating") === "1";
	const hostTabId = Number(searchParams.get("tabId"));
	const hasHostTabId = Number.isFinite(hostTabId);

	const [isLoading, setIsLoading] = useState(true);
	const [isScriptLoading, setIsScriptLoading] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(isFloatingPanel);
	const [externalStatus, setExternalStatus] =
		useState<FloatingPanelExternalStatus | null>(null);
	const [sharedRunState, setSharedRunState] =
		useState<AutomationRunState | null>(null);
	const [actionHistory, setActionHistory] = useState<string[]>([]);
	const [waitingForUserInput, setWaitingForUserInput] = useState(false);
	const [userInputPrompt, setUserInputPrompt] = useState("");
	const [userInputValue, setUserInputValue] = useState("");
	const [isPasswordInput, setIsPasswordInput] = useState(false);
	const [userInputCallback, setUserInputCallback] = useState<
		((value: string) => void) | null
	>(null);
	const [, setMode] = useState<"script">("script");
	const [scriptJson, setScriptJson] = useState("");
	const [jsonFormat, setJsonFormat] = useState<"playwright">("playwright");
	const [_historyCounter, setHistoryCounter] = React.useState(0);

	const historyEndRef = React.useRef<HTMLDivElement>(null);
	const actionHistoryCount = actionHistory.length;

	// Real-time input mirroring state
	const [currentSelector, setCurrentSelector] = useState<string | null>(null);
	const [currentTabId, setCurrentTabId] = useState<number | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const activeStatusTabIdRef = useRef<number | null>(null);
	const activeRunTabIdsRef = useRef<Set<number>>(new Set());
	const activeRunContextRef = useRef<{
		recordingName?: string;
		stepCount?: number;
	}>({});
	const dragStateRef = useRef<{
		pointerId: number;
		lastX: number;
		lastY: number;
		hasMoved: boolean;
	} | null>(null);
	const suppressNextClickRef = useRef(false);

	const getAutomationStatus = (
		status: FloatingPanelExternalStatus,
	): AutomationRunState["status"] => {
		if (status.needsInput) return "needs-input";
		if (status.isLoading) return "loading";
		if (status.isRunning) return "running";
		if (status.message?.toLowerCase().includes("failed")) return "failed";
		if (status.message?.toLowerCase().includes("complete"))
			return "complete";
		return "idle";
	};

	const publishAutomationRunState = (
		status: FloatingPanelExternalStatus,
		tabId?: number | null,
		appendHistory?: string,
		state?: AutomationRunStatePatch,
	) => {
		const automationStatus = getAutomationStatus(status);
		const hasStatusUpdate = Object.keys(status).length > 0;
		const statePatch: AutomationRunStatePatch = {
			...(hasStatusUpdate
				? {
						active:
							automationStatus === "loading" ||
							automationStatus === "running" ||
							automationStatus === "needs-input",
						status: automationStatus,
						recordingName:
							status.recordingName ||
							activeRunContextRef.current.recordingName,
						message: status.message,
						currentStep: status.currentStep,
						stepIndex: status.stepIndex,
						stepCount:
							status.stepCount ||
							activeRunContextRef.current.stepCount,
					}
				: {}),
			...state,
		};

		chrome.runtime
			.sendMessage({
				type: "UPDATE_AUTOMATION_RUN_STATE",
				state: statePatch,
				appendHistory,
				tabId,
			})
			.catch(() => {
				// Shared state is best effort; execution should continue without it.
			});
	};

	const publishFloatingStatus = (
		tabId: number | null | undefined,
		status: FloatingPanelExternalStatus,
	) => {
		if (!tabId) return;

		activeStatusTabIdRef.current = tabId;
		activeRunTabIdsRef.current.add(tabId);
		const statusWithContext = {
			...activeRunContextRef.current,
			...status,
		};
		publishAutomationRunState(statusWithContext, tabId);
		chrome.runtime
			.sendMessage({
				type: "UPDATE_FLOATING_PANEL_STATUS",
				tabId,
				status: statusWithContext,
			})
			.catch(() => {
				// Target tabs may not have the content script available yet.
			});
	};

	const publishFloatingStatusToRunTabs = (
		status: FloatingPanelExternalStatus,
	) => {
		activeRunTabIdsRef.current.forEach((tabId) => {
			publishFloatingStatus(tabId, status);
		});
	};

	const formatActionStatus = (
		action: { type: string; label?: string; url?: string },
		stepIndex: number,
		stepCount: number,
	): FloatingPanelExternalStatus => {
		const actionLabel = action.label || action.url || action.type;

		return {
			isRunning: true,
			needsInput: false,
			currentStep: `${action.type.toUpperCase()}${actionLabel ? `: ${actionLabel}` : ""}`,
			stepIndex,
			stepCount,
			message: `Step ${stepIndex} of ${stepCount}`,
		};
	};

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
			{
				type: "SMSS_FLOATING_PANEL_DRAG",
				deltaX,
				deltaY,
			},
			"*",
		);
	};

	const finishFloatingDrag = (event: React.PointerEvent<HTMLElement>) => {
		const dragState = dragStateRef.current;
		if (!dragState || dragState.pointerId !== event.pointerId) return;

		if (dragState.hasMoved) {
			suppressNextClickRef.current = true;
		}

		dragStateRef.current = null;
		event.currentTarget.releasePointerCapture(event.pointerId);

		window.parent.postMessage(
			{
				type: "SMSS_FLOATING_PANEL_DRAG_END",
			},
			"*",
		);
	};

	const closeFloatingPanel = () => {
		if (!isFloatingPanel) return;

		window.parent.postMessage(
			{
				type: "SMSS_FLOATING_PANEL_CLOSE",
			},
			"*",
		);
	};

	const resetRecordingStatus = () => {
		if (isScriptLoading || isRunning || waitingForUserInput) return;

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		setIsScriptLoading(false);
		setIsRunning(false);
		setWaitingForUserInput(false);
		setUserInputPrompt("");
		setUserInputValue("");
		setIsPasswordInput(false);
		setUserInputCallback(null);
		setCurrentSelector(null);
		setCurrentTabId(null);
		setExternalStatus(null);
		setSharedRunState(null);
		setActionHistory([]);
		setScriptJson("");
		setJsonFormat("playwright");
		setMode("script");
		setHistoryCounter(0);
		activeStatusTabIdRef.current = null;
		activeRunTabIdsRef.current = new Set();
		activeRunContextRef.current = {};

		chrome.runtime
			.sendMessage({ type: "RESET_AUTOMATION_RUN_STATE" })
			.catch(() => {
				// Resetting shared state is best effort.
			});
	};

	// Auto-scroll to bottom when action history updates
	React.useEffect(() => {
		if (actionHistoryCount > 0 && historyEndRef.current) {
			historyEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [actionHistoryCount]);

	useEffect(() => {
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (!isFloatingPanel) return;

		window.parent.postMessage(
			{
				type: "SMSS_FLOATING_PANEL_RESIZE",
				expanded: !isCollapsed,
			},
			"*",
		);
	}, [isCollapsed, isFloatingPanel]);

	useEffect(() => {
		if (!isFloatingPanel) return;

		const handleFloatingMessage = (event: MessageEvent) => {
			if (event.source !== window.parent) return;

			if (event.data?.type === "SMSS_FLOATING_PANEL_TOGGLE") {
				setIsCollapsed((prev) => !prev);
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

			if (event.data?.type === "SMSS_FLOATING_PANEL_EXTERNAL_STATUS") {
				setExternalStatus(event.data.status || null);
			}
		};

		window.addEventListener("message", handleFloatingMessage);

		return () => {
			window.removeEventListener("message", handleFloatingMessage);
		};
	}, [isCollapsed, isFloatingPanel]);

	useEffect(() => {
		if (!externalStatus) return;
		if (
			externalStatus.isLoading ||
			externalStatus.isRunning ||
			externalStatus.needsInput
		) {
			return;
		}

		const clearTimer = window.setTimeout(() => {
			setExternalStatus(null);
		}, 4000);

		return () => {
			window.clearTimeout(clearTimer);
		};
	}, [externalStatus]);

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

	useEffect(() => {
		chrome.runtime
			.sendMessage({ type: "GET_AUTOMATION_RUN_STATE" })
			.then((response) => {
				if (response?.state?.updatedAt) {
					setSharedRunState(response.state);
				}
			})
			.catch(() => {
				// The panel can still run without a shared state snapshot.
			});

		const handleSharedRunState = (message: {
			type?: string;
			state?: AutomationRunState;
		}) => {
			if (
				message.type === "AUTOMATION_RUN_STATE_UPDATED" &&
				message.state
			) {
				setSharedRunState(message.state);
			}
		};

		chrome.runtime.onMessage.addListener(handleSharedRunState);

		return () => {
			chrome.runtime.onMessage.removeListener(handleSharedRunState);
		};
	}, []);

	// Listen for playground chat events from content script
	useEffect(() => {
		const messageListener = (
			message: PanelRuntimeMessage,
			sender: chrome.runtime.MessageSender,
			_sendResponse: (response?: unknown) => void,
		) => {
			// CRITICAL: Only process messages forwarded by background script (sender.tab will be undefined)
			// Ignore direct messages from content scripts to prevent duplicate execution
			if (sender.tab && message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				return;
			}

			// CRITICAL: Block script execution if already running
			if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" && isRunning) {
				return;
			}

			if (
				message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" &&
				hasHostTabId &&
				message.sourceTabId &&
				message.sourceTabId !== hostTabId
			) {
				return;
			}

			// Handle ping request from Playground to validate extension is alive
			if (message.type === "SMSS_EXTENSION_PING") {
				console.log("[PANEL] 🏓 Received PING - sending PONG");
				chrome.runtime
					.sendMessage({
						type: "SMSS_EXTENSION_PONG",
						timestamp: Date.now(),
					})
					.catch((error) => {
						console.error("[PANEL] ❌ Failed to send PONG:", error);
					});
				return;
			}

			if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				// Handle Playwright script execution request from Playground
				const script = message.script;
				const sourceTabId =
					message.sourceTabId || (hasHostTabId ? hostTabId : null);
				activeRunTabIdsRef.current = new Set();
				activeRunContextRef.current = {
					recordingName: script?.name || "Playwright recording",
				};
				publishAutomationRunState(
					{
						isLoading: true,
						message: "Loading recorded steps",
					},
					sourceTabId,
					undefined,
					{
						history: [
							`🎬 Received script from Playground: ${script.name}`,
						],
					},
				);

				setIsScriptLoading(true);
				setIsCollapsed(false);
				publishFloatingStatus(sourceTabId, {
					isLoading: true,
					message: "Loading recorded steps",
				});
				setActionHistory([
					`🎬 Received script from Playground: ${script.name}`,
				]);
				setMode("script");

				// Check if script content was provided
				if (script.scriptContent) {
					let content = script.scriptContent as
						| Record<string, unknown>
						| string;

					// If scriptContent is a string, parse it first
					if (typeof content === "string") {
						try {
							content = JSON.parse(content);
						} catch (e) {
							console.error(
								"[PANEL] ❌ Failed to parse scriptContent string:",
								e,
							);
						}
					}

					// If steps is a string, parse it too (handle nested stringification)
					if (
						content &&
						typeof content === "object" &&
						typeof content.steps === "string"
					) {
						try {
							content.steps = JSON.parse(content.steps);
						} catch (e) {
							console.error(
								"[PANEL] ❌ Failed to parse steps string:",
								e,
							);
						}
					}

					// Use the provided script content directly
					const scriptContent = JSON.stringify(content, null, 2);
					setScriptJson(scriptContent);
					setJsonFormat("playwright");
					setActionHistory((prev) => [
						...prev,
						`✅ Script loaded: ${script.name}`,
					]);
					publishAutomationRunState(
						{
							isLoading: true,
							message: "Loading recorded steps",
						},
						sourceTabId,
						`✅ Script loaded: ${script.name}`,
					);

					// Auto-execute the script
					setActionHistory((prev) => [
						...prev,
						`▶️ Waiting for page to load before executing script...`,
					]);
					publishAutomationRunState(
						{
							isLoading: true,
							message: "Waiting for page load",
						},
						sourceTabId,
						`▶️ Waiting for page to load before executing script...`,
					);

					// Wait longer and check if page is loaded before executing
					setTimeout(async () => {
						try {
							// Wait for current tab to be in complete state
							const messageTabId = sourceTabId || undefined;
							const currentTab = messageTabId
								? await chrome.tabs.get(messageTabId)
								: (
										await chrome.tabs.query({
											active: true,
											currentWindow: true,
										})
									)[0];
							if (currentTab?.id) {
								// Wait for tab to be fully loaded
								let retries = 20; // 10 seconds total
								while (retries > 0) {
									const tabs = await chrome.tabs.query({});
									const tab = tabs.find(
										(t) => t.id === currentTab.id,
									);
									if (tab?.status === "complete") {
										break;
									}
									await new Promise((resolve) =>
										setTimeout(resolve, 500),
									);
									retries--;
								}
								// Additional buffer time after page load
								await new Promise((resolve) =>
									setTimeout(resolve, 1500),
								);
							}
							setActionHistory((prev) => [
								...prev,
								`▶️ Page loaded, executing script...`,
							]);
							publishAutomationRunState(
								{
									isRunning: true,
									message: "Running automation",
								},
								sourceTabId,
								`▶️ Page loaded, executing script...`,
							);
							setIsScriptLoading(false);
							publishFloatingStatus(sourceTabId, {
								isLoading: false,
								isRunning: true,
								message: "Running automation",
							});
							await executeScriptWithContent(
								scriptContent,
								"playwright",
							);
						} catch (error) {
							const errorMessage =
								error instanceof Error
									? error.message
									: String(error);
							setIsScriptLoading(false);
							publishFloatingStatus(sourceTabId, {
								isLoading: false,
								isRunning: false,
								needsInput: false,
								message: "Automation failed",
							});
							publishAutomationRunState(
								{
									isRunning: false,
									needsInput: false,
									message: "Automation failed",
								},
								sourceTabId,
								`❌ Error: ${errorMessage}`,
							);
							setActionHistory((prev) => [
								...prev,
								`❌ Error: ${errorMessage}`,
							]);
							chrome.runtime
								.sendMessage({
									type: "SCRIPT_EXECUTION_COMPLETE",
									success: false,
									message: `Script execution failed: ${errorMessage}`,
								})
								.catch((err) => {
									console.error(
										"[PANEL] ❌ Failed to send error message:",
										err,
									);
								});
						}
					}, 1000);
				} else {
					setIsScriptLoading(false);
					publishFloatingStatus(sourceTabId, {
						isLoading: false,
						isRunning: false,
						needsInput: false,
					});
				}
			}

			// Handle field input detected from webpage
			if (message.type === "FIELD_INPUT_DETECTED") {
				// If we're waiting for user input, auto-submit with the detected value
				if (waitingForUserInput && userInputCallback) {
					const valueToUse = message.isPassword
						? "••••••••"
						: message.value || "";
					userInputCallback(valueToUse);
				}
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		return () => {
			chrome.runtime.onMessage.removeListener(messageListener);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRunning, waitingForUserInput, userInputCallback]);

	// Close dropdown when clicking outside

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
			// Use provided format or fall back to state
			const scriptFormat = format || jsonFormat;

			// Parse script based on format
			let script: PlaywrightScript;
			if (scriptFormat === "playwright") {
				script = ScriptExecutor.parseScript(content);
			}

			// Get current tab
			let tab: chrome.tabs.Tab | undefined;
			if (chrome.devtools?.inspectedWindow) {
				const tabId = chrome.devtools.inspectedWindow.tabId;
				const tabs = await chrome.tabs.query({});
				tab = tabs.find((t) => t.id === tabId);
			} else if (hasHostTabId) {
				tab = await chrome.tabs.get(hostTabId);
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
			let actions: Array<{
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
			}>;
			if (scriptFormat === "playwright") {
				actions = await ScriptExecutor.convertToActions(
					script as PlaywrightScript,
				);
			}
			activeRunContextRef.current = {
				...activeRunContextRef.current,
				stepCount: actions.length,
			};
			addToHistory(`✓ Found ${actions.length} actions to execute`);

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
				addToHistory(`✓ Creating new tab for script execution...`);
				const newTab = await chrome.tabs.create({
					active: true, // Make it active so user can see it
					url: initialUrl,
				});

				if (!newTab.id) {
					throw new Error("Failed to create new tab");
				}

				addToHistory(`✓ New tab created`);
				targetTab = newTab;
				createdNewTab = true; // Mark that we created a tab - prevents additional tabs later

				// Wait for tab to be ready and page to load
				let loadTimeout = 15;
				while (loadTimeout > 0) {
					const tabs = await chrome.tabs.query({});
					const loadedTab = tabs.find((t) => t.id === newTab.id);
					if (loadedTab && loadedTab.status === "complete") {
						await new Promise((resolve) =>
							setTimeout(resolve, 500),
						);
						break;
					}
					await new Promise((resolve) => setTimeout(resolve, 500));
					loadTimeout--;
				}
			} else {
				// Use the current tab if no navigate action at start
				if (!tab || !tab.id) {
					throw new Error("No active tab available");
				}
				targetTab = tab;
				addToHistory(`✓ Using current tab for script execution`);
			}

			// Track tabs: maps tabId (tab-1, tab-2) to Chrome tab ID
			const tabMap = new Map<string, number>();
			const targetTabId = targetTab.id;
			if (!targetTabId) {
				throw new Error("No target tab found");
			}
			publishFloatingStatus(targetTabId, {
				isLoading: false,
				isRunning: true,
				needsInput: false,
				message: "Running automation",
				stepCount: actions.length,
			});
			tabMap.set("tab-1", targetTabId); // First tab is the target tab
			let currentTabId = targetTabId;

			// Track which navigate URL we already executed during tab creation
			const preExecutedNavigateUrl = createdNewTab ? initialUrl : null;

			// Execute each action
			let actionCounter = 0; // Track actual displayed action numbers
			for (let i = 0; i < actions.length; i++) {
				const action = actions[i];

				// Skip navigate action if we already executed it during tab creation
				if (
					action.type === "navigate" &&
					action.url === preExecutedNavigateUrl
				) {
					addToHistory(
						`✓ Skipping navigate (already executed): ${action.url}`,
					);
					continue;
				}

				// Handle tab switching (case-insensitive)
				if (action.type.toLowerCase() === "switchtab") {
					if (!action.tabId) {
						throw new Error("switchTab action requires tabId");
					}

					const targetTabId = tabMap.get(action.tabId);

					if (!targetTabId) {
						addToHistory(
							`⚠️ Waiting for new tab: ${action.tabId}...`,
						);
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

							addToHistory(
								`✓ Switched to new tab: ${action.tabId}`,
							);
							publishFloatingStatus(currentTabId, {
								isRunning: true,
								needsInput: false,
								message: "Running automation",
								stepCount: actions.length,
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
						addToHistory(`✓ Switched to tab: ${action.tabId}`);
						publishFloatingStatus(currentTabId, {
							isRunning: true,
							needsInput: false,
							message: "Running automation",
							stepCount: actions.length,
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
				publishFloatingStatus(
					currentTabId,
					formatActionStatus(action, actionCounter, actions.length),
				);

				// Handle ask user for TYPE actions
				const onAskUser = async (
					label: string,
					isPassword: boolean,
					selector?: string,
					targetTabId?: number,
				): Promise<string> => {
					return new Promise<string>((resolve) => {
						setUserInputPrompt(
							`${isPassword ? "🔒 " : ""}${label}`,
						);
						setIsPasswordInput(isPassword);
						setWaitingForUserInput(true);

						// Store selector and tabId for real-time mirroring
						setCurrentSelector(selector || null);
						setCurrentTabId(targetTabId || null);
						publishFloatingStatus(targetTabId, {
							isRunning: true,
							needsInput: true,
							message: "Input required",
							currentStep: label,
						});

						// Highlight the field on the webpage while the dialog is open
						if (selector && targetTabId) {
							chrome.runtime
								.sendMessage({
									type: "HIGHLIGHT_FIELD",
									tabId: targetTabId,
									selector: selector,
								})
								.catch((err) => {
									console.log(
										"[PANEL] ⚠️ Highlight unavailable:",
										err.message,
									);
								});
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
									console.log(
										"[PANEL] ℹ️ Field monitoring unavailable:",
										err.message,
									);
								});
						}

						setUserInputCallback(() => (value: string) => {
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
										console.log(
											"[PANEL] ℹ️ Could not remove highlight:",
											err.message,
										);
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
										console.log(
											"[PANEL] ℹ️ Could not stop field monitoring:",
											err.message,
										);
									});
							}

							setWaitingForUserInput(false);
							publishFloatingStatus(targetTabId, {
								isRunning: true,
								needsInput: false,
								message: "Running automation",
							});
							setUserInputPrompt("");
							setUserInputValue("");
							setIsPasswordInput(false);
							setUserInputCallback(null);
							addToHistory(`✓ User provided input`);
							resolve(value);
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
					addToHistory(
						`⏳ Waiting for new tab: ${action.isTriggerNewTab.tabId}...`,
					);
					// Wait for new tab to be created
					await new Promise((resolve) => setTimeout(resolve, 1500));

					// Find the new tab
					const allTabs = await chrome.tabs.query({});
					const newestTab = allTabs[allTabs.length - 1];
					if (newestTab?.id) {
						tabMap.set(action.isTriggerNewTab.tabId, newestTab.id);
						currentTabId = newestTab.id;
						addToHistory(
							`✓ New tab created: ${action.isTriggerNewTab.tabId}`,
						);
						publishFloatingStatus(currentTabId, {
							isRunning: true,
							needsInput: false,
							message: "Running automation",
							stepIndex: actionCounter,
							stepCount: actions.length,
						});

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
							addToHistory(`✓ Debugger attached to new tab`);
						} catch (error) {
							console.log("Debugger attach error:", error);
						}

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
								addToHistory(`✓ New tab page loaded`);
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
			setIsScriptLoading(false);
			publishFloatingStatusToRunTabs({
				isLoading: false,
				isRunning: false,
				needsInput: false,
				message: "Automation complete",
			});
			activeStatusTabIdRef.current = null;
			activeRunTabIdsRef.current = new Set();
			activeRunContextRef.current = {};
		}
	};

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
			publishAutomationRunState(
				{},
				activeStatusTabIdRef.current,
				message,
			);
		} else {
			setHistoryCounter((prev) => {
				const newCount = prev + 1;
				const numberedMessage = `${newCount}. ${message}`;
				setActionHistory((history) => [...history, numberedMessage]);
				publishAutomationRunState(
					{},
					activeStatusTabIdRef.current,
					numberedMessage,
				);
				return newCount;
			});
		}
	};

	const hasLocalRunState =
		isScriptLoading ||
		isRunning ||
		waitingForUserInput ||
		actionHistory.length > 0;
	const sharedStatus =
		!hasLocalRunState && sharedRunState?.updatedAt
			? {
					isLoading: sharedRunState.status === "loading",
					isRunning: sharedRunState.status === "running",
					needsInput: sharedRunState.status === "needs-input",
					message: sharedRunState.message,
					recordingName: sharedRunState.recordingName,
					currentStep: sharedRunState.currentStep,
					stepIndex: sharedRunState.stepIndex,
					stepCount: sharedRunState.stepCount,
				}
			: null;
	const effectiveExternalStatus = externalStatus || sharedStatus;
	const displayActionHistory =
		actionHistory.length > 0
			? actionHistory
			: sharedRunState?.history || [];
	const needsInputStatus =
		waitingForUserInput || effectiveExternalStatus?.needsInput === true;
	const loadingStatus =
		isScriptLoading || effectiveExternalStatus?.isLoading === true;
	const runningStatus =
		isRunning || effectiveExternalStatus?.isRunning === true;
	const canResetRecordingStatus =
		!loadingStatus &&
		!runningStatus &&
		!needsInputStatus &&
		(scriptJson.trim().length > 0 ||
			actionHistory.length > 0 ||
			!!externalStatus ||
			!!sharedRunState?.updatedAt);
	const launcherStatus = needsInputStatus
		? "Input required"
		: loadingStatus
			? "Loading steps"
			: runningStatus
				? "Running automation"
				: "Browser Automation";

	if (isFloatingPanel && isCollapsed) {
		return (
			<button
				type="button"
				className={cn(
					"floating-launcher",
					(loadingStatus || runningStatus) &&
						"floating-launcher--busy",
					needsInputStatus && "floating-launcher--needs-input",
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
				{(loadingStatus || runningStatus) && (
					<span
						className="floating-launcher-spinner"
						aria-hidden="true"
					/>
				)}
				{needsInputStatus && (
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
				<h1 className="panel-title">Browser Automation</h1>
				{isFloatingPanel && (
					<div className="panel-header-actions">
						<Button
							type="button"
							className="panel-reset-btn"
							onPointerDown={(event) => event.stopPropagation()}
							onClick={resetRecordingStatus}
							disabled={!canResetRecordingStatus}
							aria-label="Reset recording status"
							title="Reset recording status"
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

			<div className="panel-content">
				{isScriptLoading && (
					<output className="steps-loading-banner">
						<span
							className="steps-loading-spinner"
							aria-hidden="true"
						/>
						<span>Loading recorded steps...</span>
					</output>
				)}

				{effectiveExternalStatus &&
					!isScriptLoading &&
					!isRunning &&
					displayActionHistory.length === 0 && (
						<div className="external-status-banner">
							{effectiveExternalStatus.recordingName && (
								<strong>
									{effectiveExternalStatus.recordingName}
								</strong>
							)}
							<span>
								{effectiveExternalStatus.message ||
									launcherStatus}
							</span>
							{effectiveExternalStatus.currentStep && (
								<span className="external-status-step">
									{effectiveExternalStatus.currentStep}
								</span>
							)}
						</div>
					)}

				{/* Welcome State - shown when no script is running */}
				{!isRunning &&
					displayActionHistory.length === 0 &&
					!effectiveExternalStatus && <WelcomeState />}

				{/* Action History */}
				{displayActionHistory.length > 0 && (
					<div className="execution-log-wrapper">
						<Card className="execution-log-card">
							<h2 className="execution-log-title">
								Execution Log
							</h2>
							<div className="execution-log-list">
								{displayActionHistory.map((action, index) => {
									const isError = action.startsWith("❌");
									const isSuccess = action.startsWith("✅");
									const isCheckmark = action.startsWith("✓");
									const isNumbered = action.match(/^\d+\./);
									const isUserInput = action.includes(
										"User provided input",
									);

									return (
										<div
											key={`action-${index}-${action.substring(0, 20)}`}
											className={cn(
												"execution-log-item",
												isError &&
													"execution-log-item--error",
												isSuccess &&
													"execution-log-item--success",
												!isSuccess &&
													!isError &&
													isCheckmark &&
													"execution-log-item--check",
												!isSuccess &&
													!isError &&
													!isCheckmark &&
													isUserInput &&
													"execution-log-item--input",
											)}
										>
											<p
												className={cn(
													"execution-log-line",
													(isNumbered ||
														isError ||
														isSuccess) &&
														"execution-log-line--strong",
												)}
											>
												{action}
											</p>
										</div>
									);
								})}
								<div ref={historyEndRef} />
							</div>
						</Card>
					</div>
				)}

				{/* User Input Dialog */}
				{waitingForUserInput && (
					<div className="user-input-overlay">
						<div className="user-input-dialog">
							<h3>Input Required</h3>
							<p>{userInputPrompt}</p>
							<Input
								type={isPasswordInput ? "password" : "text"}
								value={userInputValue}
								onChange={(e) => {
									const newValue = e.target.value;
									setUserInputValue(newValue);

									// Real-time mirroring to webpage (password fields show as dots automatically)
									if (currentSelector && currentTabId) {
										// Clear existing debounce timer
										if (debounceTimerRef.current) {
											clearTimeout(
												debounceTimerRef.current,
											);
										}

										// Debounce the update to avoid excessive messages
										debounceTimerRef.current = setTimeout(
											() => {
												chrome.runtime
													.sendMessage({
														type: "UPDATE_FIELD_VALUE",
														tabId: currentTabId,
														selector:
															currentSelector,
														value: newValue,
													})
													.catch((err) => {
														console.log(
															"[PANEL] ⚠️ Mirroring unavailable:",
															err.message,
														);
													});
											},
											75,
										); // 75ms debounce for responsive feel
									}
								}}
								placeholder="Enter value..."
								className="user-input-field"
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										userInputValue.trim()
									) {
										e.preventDefault();
										if (userInputCallback) {
											userInputCallback(userInputValue);
										}
									}
								}}
							/>
							<div className="user-input-buttons">
								<Button
									type="button"
									onClick={() => {
										if (
											userInputCallback &&
											userInputValue.trim()
										) {
											userInputCallback(userInputValue);
										}
									}}
									disabled={!userInputValue.trim()}
									className="submit-btn"
								>
									Submit
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PanelApp;
