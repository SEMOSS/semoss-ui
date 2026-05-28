import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import { Box, Button, Card, Stack, TextField, Typography } from "@semoss/ui";
import {
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";
import { RecordingPanel } from "./components/RecordingPanel";
import { WelcomeState } from "./components/WelcomeState";

type PanelMode = "execution" | "recording";

interface ChromeMessage {
	type: string;
	timestamp?: number;
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
}

const PanelApp: React.FC = () => {
	const [mode, setMode] = useState<PanelMode>("execution");
	const [isLoading, setIsLoading] = useState(true);
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
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
		console.log("[PANEL] ✅ Panel mounted, announcing presence");

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
		console.log("[PANEL] 🎧 Setting up message listener");

		const messageListener = (
			message: ChromeMessage,
			sender: chrome.runtime.MessageSender,
			sendResponse: (response?: { alive?: boolean }) => void,
		) => {
			console.log("[PANEL] 📨 Received message:", message.type, message);

			// Respond to panel ping checks IMMEDIATELY (even if listener not fully ready)
			// This prevents "Extension Required" popup from showing
			if (message.type === "PANEL_PING_CHECK") {
				console.log("[PANEL] 📨 Received ping check, responding...");
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
				console.log(
					"[PANEL] ⏭️ Ignoring direct message from content script",
				);
				return;
			}

			// CRITICAL: Block script execution if already running (use ref to avoid stale closure)
			if (
				(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
					message.type === "EXECUTE_PLAYWRIGHT_SCRIPT") &&
				isRunningRef.current
			) {
				console.log(
					"[PANEL] ⏸️ Already running, ignoring duplicate execution",
				);
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

				console.log("[PANEL] 📨 Portal execution request:", {
					fileName,
					projectID,
					title,
				});

				// Set ref IMMEDIATELY to block duplicate messages
				isRunningRef.current = true;
				setIsRunning(true);

				setActionHistory([
					`🎬 Received script from Portal: ${title || fileName}`,
				]);
				setMode("script");

				// Check if script content is provided (new format)
				if (scriptContent) {
					console.log(
						"[PANEL] ✅ Script content received, executing directly",
					);

					// Parse and set the script
					let content = scriptContent;

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
					console.log(
						"[PANEL] ⚠️ No script content in payload, fetching from backend",
					);

					setActionHistory((prev) => [
						...prev,
						`🔄 Fetching script from backend: ${fileName}`,
					]);

					// Use async IIFE to handle async operations
					(async () => {
						try {
							// Get the SEMOSS module path (usually /Monolith)
							const MODULE = "/Monolith";
							const SEMOSS_URL = window.location.origin + MODULE;

							// First get a session ID
							const sessionResponse = await fetch(
								`${SEMOSS_URL}/api/engine/runPixel`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									credentials: "include",
									body: JSON.stringify({
										expression: "Session();",
									}),
								},
							);

							if (!sessionResponse.ok) {
								throw new Error("Failed to get session ID");
							}

							const sessionData = await sessionResponse.json();
							const sessionId =
								sessionData.pixelReturn?.[0]?.output;

							if (!sessionId) {
								throw new Error("No session ID returned");
							}

							console.log("[PANEL] 📋 Session ID:", sessionId);

							// Now fetch the script using GetAllSteps
							const scriptResponse = await fetch(
								`${SEMOSS_URL}/api/engine/runPixel`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									credentials: "include",
									body: JSON.stringify({
										expression: `GetAllSteps(project=["${projectID}"], sessionId=["${sessionId}"], fileName=["${fileName}"]);`,
									}),
								},
							);

							if (!scriptResponse.ok) {
								throw new Error(
									"Failed to fetch script content",
								);
							}

							const scriptData = await scriptResponse.json();
							const scriptContent =
								scriptData.pixelReturn?.[0]?.output;

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

							console.log(
								"[PANEL] ✅ Script fetched successfully",
							);

							// Parse and set the script
							let content = scriptContent;
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

				console.log("[PANEL] 📨 Playground execution request:", script);

				setActionHistory([
					`🎬 Received script from Playground: ${script.fileName}`,
				]);
				setMode("script");

				// Set ref IMMEDIATELY to block duplicate messages
				isRunningRef.current = true;
				setIsRunning(true);

				// Always fetch script content from backend (no longer accepting scriptContent)
				setActionHistory((prev) => [
					...prev,
					`🔄 Fetching script from backend: ${script.fileName}`,
				]);

				// Use async IIFE to handle async operations
				(async () => {
					try {
						// Get the SEMOSS module path (usually /Monolith)
						const MODULE = "/Monolith";
						const SEMOSS_URL = window.location.origin + MODULE;

						// First get a session ID
						const sessionResponse = await fetch(
							`${SEMOSS_URL}/api/engine/runPixel`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								credentials: "include",
								body: JSON.stringify({
									expression: "Session();",
								}),
							},
						);

						if (!sessionResponse.ok) {
							throw new Error("Failed to get session ID");
						}

						const sessionData = await sessionResponse.json();
						const sessionId = sessionData.pixelReturn?.[0]?.output;

						if (!sessionId) {
							throw new Error("No session ID returned");
						}

						console.log("[PANEL] 📋 Session ID:", sessionId);

						// Now fetch the script using GetAllSteps
						const scriptResponse = await fetch(
							`${SEMOSS_URL}/api/engine/runPixel`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								credentials: "include",
								body: JSON.stringify({
									expression: `GetAllSteps(project=["${script.projectId}"], sessionId=["${sessionId}"], fileName=["${script.fileName}"]);`,
								}),
							},
						);

						if (!scriptResponse.ok) {
							throw new Error("Failed to fetch script content");
						}

						const scriptData = await scriptResponse.json();
						const scriptContent =
							scriptData.pixelReturn?.[0]?.output;

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

						console.log("[PANEL] ✅ Script fetched successfully");

						// Parse and set the script
						let content = scriptContent;
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

						if (
							content &&
							typeof (content as unknown as { steps?: unknown })
								.steps === "string"
						) {
							try {
								(
									content as unknown as { steps: unknown }
								).steps = JSON.parse(
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
				// If we're waiting for user input, auto-submit with the detected value
				if (waitingForUserInput && userInputCallbackRef.current) {
					const valueToUse = message.isPassword
						? "••••••••"
						: message.value || "";
					userInputCallbackRef.current(valueToUse);
				}
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);
		console.log("[PANEL] ✅ Message listener registered");

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
				console.log(
					"[PANEL] ▶️ Processing queued message:",
					queuedMessage.type,
				);
				messageListener(
					queuedMessage,
					{} as chrome.runtime.MessageSender,
					() => {},
				);
			}
		}

		return () => {
			console.log("[PANEL] 🔇 Removing message listener");
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
				addToHistory("✓ Creating new tab for script execution...");
				const newTab = await chrome.tabs.create({
					active: true, // Make it active so user can see it
					url: initialUrl,
				});

				if (!newTab.id) {
					throw new Error("Failed to create new tab");
				}

				addToHistory("✓ New tab created");
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
						console.log("[PANEL] ⚠️ Execution tab closed abruptly");
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
							console.log(
								"[PANEL] ▶️ Execution resumed - returned to tab",
							);
							setIsPaused(false);
							isPausedRef.current = false;
							addToHistory(
								"▶️ Execution resumed - returned to tab",
							);
						}
					} else {
						// User switched away from the execution tab
						if (!isPausedRef.current) {
							console.log(
								"[PANEL] ⏸️ Execution paused - switched away from tab",
							);
							setIsPaused(true);
							isPausedRef.current = true;
							addToHistory(
								"⏸️ Execution paused - switched away from tab",
							);
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
				addToHistory("✓ Using current tab for script execution");
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
						setUserInputPrompt(
							`${isPassword ? "🔒 " : ""}${label}`,
						);
						setIsPasswordInput(isPassword);
						setWaitingForUserInput(true);

						// Store selector and tabId for real-time mirroring
						setCurrentSelector(selector || null);
						setCurrentTabId(targetTabId || null);

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
							setUserInputPrompt("");
							setUserInputValue("");
							setIsPasswordInput(false);
							setUserInputCallback(null);
							addToHistory("✓ User provided input");
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
							addToHistory("✓ Debugger attached to new tab");
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
								addToHistory("✓ New tab page loaded");
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
		<div className="panel-container">
			<div className="panel-header">
				<Typography variant="h1">Browser Automation</Typography>
			</div>

			{/* Mode Switcher */}
			<Box sx={{ display: "flex", gap: 1.5, p: 2.5, pt: 1.5 }}>
				<Button
					variant={mode === "execution" ? "contained" : "outlined"}
					onClick={() => setMode("execution")}
					fullWidth
					sx={{
						textTransform: "none",
						fontWeight: 600,
						py: 1.25,
						borderRadius: "10px",
						transition: "all 0.3s ease",
						...(mode === "execution"
							? {
									background:
										"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
									boxShadow:
										"0 4px 12px rgba(99, 102, 241, 0.3)",
									"&:hover": {
										background:
											"linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
										boxShadow:
											"0 6px 20px rgba(99, 102, 241, 0.4)",
										transform: "translateY(-1px)",
									},
								}
							: {
									borderWidth: "2px",
									borderColor: "rgba(0,0,0,0.12)",
									color: "text.secondary",
									"&:hover": {
										borderWidth: "2px",
										borderColor: "#6366f1",
										backgroundColor:
											"rgba(99, 102, 241, 0.04)",
										transform: "translateY(-1px)",
										boxShadow:
											"0 4px 12px rgba(99, 102, 241, 0.15)",
									},
								}),
					}}
				>
					⚡ Execute Scripts
				</Button>
				<Button
					variant={mode === "recording" ? "contained" : "outlined"}
					onClick={() => setMode("recording")}
					fullWidth
					sx={{
						textTransform: "none",
						fontWeight: 600,
						py: 1.25,
						borderRadius: "10px",
						transition: "all 0.3s ease",
						...(mode === "recording"
							? {
									background:
										"linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
									boxShadow:
										"0 4px 12px rgba(37, 99, 235, 0.3)",
									"&:hover": {
										background:
											"linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
										boxShadow:
											"0 6px 20px rgba(37, 99, 235, 0.4)",
										transform: "translateY(-1px)",
									},
								}
							: {
									borderWidth: "2px",
									borderColor: "rgba(0,0,0,0.12)",
									color: "text.secondary",
									"&:hover": {
										borderWidth: "2px",
										borderColor: "#2563eb",
										backgroundColor:
											"rgba(37, 99, 235, 0.04)",
										transform: "translateY(-1px)",
										boxShadow:
											"0 4px 12px rgba(37, 99, 235, 0.15)",
									},
								}),
					}}
				>
					🎬 Record Script
				</Button>
			</Box>

			{isPaused && mode === "execution" && (
				<Box
					sx={{
						ml: 2,
						px: 2,
						py: 0.75,
						borderRadius: 2,
						bgColor: "rgba(255, 152, 0, 0.15)",
						border: "1.5px solid rgba(255, 152, 0, 0.8)",
						color: "#ffffff",
						display: "inline-flex",
						alignItems: "center",
						gap: 0.75,
						boxShadow: "0 2px 8px rgba(255, 152, 0, 0.3)",
					}}
				>
					<Typography
						variant="body2"
						sx={{
							fontWeight: 700,
							fontSize: "0.8125rem",
							letterSpacing: "0.5px",
						}}
					>
						⏸️ PAUSED
					</Typography>
				</Box>
			)}

			<div className="panel-content">
				{mode === "recording" ? (
					<RecordingPanel />
				) : (
					<>
						{/* Welcome State - shown when no script is running */}
						{!isRunning && actionHistory.length === 0 && (
							<WelcomeState />
						)}

						{/* Action History */}
						{actionHistory.length > 0 && (
							<Box sx={{ width: "100%" }}>
								<Card
									sx={{
										width: "100%",
										p: 2.5,
										border: "1px solid",
										borderColor: "divider",
										minHeight: "calc(100vh - 180px)",
										maxHeight: "calc(100vh - 180px)",
										overflowY: "auto",
										backgroundColor: "background.paper",
										boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
									}}
								>
									<Typography
										variant="h4"
										sx={{
											mb: 2,
											fontWeight: 600,
											fontSize: "0.9375rem",
											color: "text.secondary",
											textTransform: "uppercase",
											letterSpacing: "0.5px",
										}}
									>
										Execution Log
									</Typography>
									<Stack spacing={0.75}>
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
												<Box
													key={`action-${index}-${action.substring(0, 20)}`}
													sx={{
														py: 1,
														px: 1.5,
														borderRadius: 1.5,
														border: "1px solid",
														borderColor: isError
															? "error.light"
															: isSuccess
																? "success.light"
																: isCheckmark
																	? "rgba(76, 175, 80, 0.3)"
																	: "divider",
														backgroundColor: isError
															? "rgba(211, 47, 47, 0.04)"
															: isSuccess
																? "rgba(46, 125, 50, 0.04)"
																: isCheckmark
																	? "rgba(76, 175, 80, 0.04)"
																	: isUserInput
																		? "rgba(25, 118, 210, 0.04)"
																		: "background.default",
														transition:
															"all 0.2s ease",
														"&:hover": {
															backgroundColor:
																isError
																	? "rgba(211, 47, 47, 0.08)"
																	: isSuccess
																		? "rgba(46, 125, 50, 0.08)"
																		: isCheckmark
																			? "rgba(76, 175, 80, 0.08)"
																			: isUserInput
																				? "rgba(25, 118, 210, 0.08)"
																				: "action.hover",
															borderColor: isError
																? "error.main"
																: isSuccess
																	? "success.main"
																	: isCheckmark
																		? "rgba(76, 175, 80, 0.5)"
																		: isUserInput
																			? "primary.light"
																			: "divider",
															transform:
																"translateX(2px)",
														},
													}}
												>
													<Typography
														variant="body2"
														sx={{
															fontSize:
																"0.8125rem",
															lineHeight: 1.6,
															color: isError
																? "error.dark"
																: isSuccess
																	? "success.dark"
																	: isCheckmark
																		? "success.main"
																		: "text.primary",
															fontWeight:
																isNumbered ||
																isError ||
																isSuccess
																	? 500
																	: 400,
															fontFamily:
																isNumbered
																	? "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui"
																	: "inherit",
															letterSpacing:
																"0.01em",
														}}
													>
														{action}
													</Typography>
												</Box>
											);
										})}
										<div ref={historyEndRef} />
									</Stack>
								</Card>
							</Box>
						)}

						{/* User Input Dialog */}
						{waitingForUserInput && (
							<div className="user-input-overlay">
								<div className="user-input-dialog">
									<Typography variant="h3">
										Input Required
									</Typography>
									<Typography variant="body1">
										{userInputPrompt}
									</Typography>
									<TextField
										type={
											isPasswordInput
												? "password"
												: "text"
										}
										value={userInputValue}
										disabled={isPaused}
										onChange={(e) => {
											const newValue = e.target.value;
											setUserInputValue(newValue);
											if (
												currentSelector &&
												currentTabId
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
												if (userInputCallback) {
													userInputCallback(
														userInputValue,
													);
												}
											}
										}}
									/>
									<div className="user-input-buttons">
										<Button
											variant="contained"
											onClick={() => {
												if (
													userInputCallback &&
													userInputValue.trim()
												) {
													userInputCallback(
														userInputValue,
													);
												}
											}}
											disabled={
												!userInputValue.trim() ||
												isPaused
											}
											className="submit-btn"
										>
											Submit
										</Button>
									</div>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default PanelApp;
