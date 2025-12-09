import React, { useEffect, useState } from "react";
import "./panel.css";
import {
	createDirectWorkshopService,
	type LLMAction,
} from "../services/directWorkshopAPI";
import {
	type GoogleRecorderScript,
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";

const PanelApp: React.FC = () => {
	const [hasSettings, setHasSettings] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [command, setCommand] = useState("");
	const [isRunning, setIsRunning] = useState(false);
	const [actionHistory, setActionHistory] = useState<string[]>([]);
	const [waitingForUserInput, setWaitingForUserInput] = useState(false);
	const [userInputPrompt, setUserInputPrompt] = useState("");
	const [userInputValue, setUserInputValue] = useState("");
	const [userInputCallback, setUserInputCallback] = useState<
		((value: string) => void) | null
	>(null);
	const [mode, setMode] = useState<"llm" | "script">("llm");
	const [scriptJson, setScriptJson] = useState("");
	const [jsonFormat, setJsonFormat] = useState<"playwright" | "google">(
		"playwright",
	);
	const commandInputRef = React.useRef<HTMLTextAreaElement>(null);
	const historyEndRef = React.useRef<HTMLDivElement>(null);
	const userInputRef = React.useRef<HTMLInputElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const fileInputId = React.useId();

	const loadSettings = React.useCallback(async () => {
		try {
			const result = await chrome.storage.local.get([
				"workshop_endpoint",
				"workshop_access_key",
				"workshop_secret_key",
			]);

			if (
				result.workshop_endpoint &&
				result.workshop_access_key &&
				result.workshop_secret_key
			) {
				setHasSettings(true);
			}
		} catch (error) {
			console.error("Error loading settings:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Auto-scroll to bottom when action history updates
	React.useEffect(() => {
		if (historyEndRef.current) {
			historyEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const openSettings = () => {
		chrome.runtime.openOptionsPage();
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			setScriptJson(content);
			setActionHistory([`📄 Loaded script: ${file.name}`]);
		};
		reader.onerror = () => {
			setActionHistory(["❌ Error reading file"]);
		};
		reader.readAsText(file);
	};

	const handleRunScript = async () => {
		if (!scriptJson.trim()) {
			setActionHistory(["❌ Please upload a script JSON file first"]);
			return;
		}

		setIsRunning(true);
		setActionHistory([]);

		try {
			// Parse script based on format
			let script: PlaywrightScript | GoogleRecorderScript;
			if (jsonFormat === "playwright") {
				script = ScriptExecutor.parseScript(scriptJson);
			} else {
				script = ScriptExecutor.parseGoogleRecorderScript(scriptJson);
			}

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
			if (jsonFormat === "playwright") {
				actions = await ScriptExecutor.convertToActions(
					script as PlaywrightScript,
				);
			} else {
				actions = await ScriptExecutor.convertGoogleRecorderToActions(
					script as GoogleRecorderScript,
				);
			}
			addToHistory(`✓ Found ${actions.length} actions to execute`);

			// Track tabs: maps tabId (tab-1, tab-2) to Chrome tab ID
			const tabMap = new Map<string, number>();
			tabMap.set("tab-1", tab.id); // First tab is the current tab
			let currentTabId = tab.id;

			// Execute each action
			for (let i = 0; i < actions.length; i++) {
				const action = actions[i];

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

				addToHistory(
					`${i + 1}. ${action.type.toUpperCase()}${action.label ? `: ${action.label}` : ""}`,
				);

				// Handle ask user for TYPE actions
				const onAskUser = async (
					label: string,
					isPassword: boolean,
				): Promise<string> => {
					return new Promise<string>((resolve) => {
						setUserInputPrompt(
							`${isPassword ? "🔒 " : ""}${label}`,
						);
						setWaitingForUserInput(true);
						setUserInputCallback(() => (value: string) => {
							setWaitingForUserInput(false);
							setUserInputPrompt("");
							setUserInputValue("");
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

				// If this action triggers a new tab, track it
				if (action.isTriggerNewTab?.isTrue) {
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
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addToHistory(`❌ Error: ${errorMessage}`);
			console.error("Script execution error:", error);
		} finally {
			setIsRunning(false);
		}
	};

	const commandId = React.useId();

	const handleRunCommand = async () => {
		if (!command.trim()) return;

		// Validate command - reject if too vague or meaningless
		const trimmedCommand = command.trim().toLowerCase();
		const invalidCommands = [
			"hey",
			"hi",
			"hello",
			"test",
			"ok",
			"yes",
			"no",
		];

		if (
			invalidCommands.includes(trimmedCommand) ||
			trimmedCommand.length < 5
		) {
			setActionHistory([
				"Error: Command too vague or meaningless.",
				"Please provide a clear action like:",
				'  • "Click on the login button"',
				'  • "Search for OpenAI"',
				'  • "Fill email with test@example.com"',
				'  • "Navigate to the pricing page"',
			]);
			return;
		}

		setIsRunning(true);
		setActionHistory([`Starting task: ${command}`]);

		try {
			// Get current tab - for DevTools panel, get the inspected window
			let tab: chrome.tabs.Tab | undefined;
			if (chrome.devtools?.inspectedWindow) {
				// Running in DevTools panel
				const tabId = chrome.devtools.inspectedWindow.tabId;
				const tabs = await chrome.tabs.query({});
				tab = tabs.find((t) => t.id === tabId);
			} else {
				// Running in popup
				const [currentTab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				tab = currentTab;
			}

			if (!tab || !tab.id) {
				throw new Error("No active tab found");
			}

			// Create Workshop service once
			addToHistory("Connecting to Workshop...");
			const workshopService = await createDirectWorkshopService();

			if (!workshopService) {
				throw new Error(
					"Failed to initialize Workshop service. Check settings.",
				);
			}
			addToHistory("✓ Workshop connected");

			// Automation loop - continue until LLM says done or we hit safety limit
			let stepCount = 0;
			const MAX_STEPS = 20; // Safety limit to prevent infinite loops
			let isDone = false;
			let previousUrl = tab.url;
			const executedActions: Array<{
				type: string;
				elementId?: number;
				value?: string;
				reason?: string;
				fieldName?: string;
				question?: string;
				url?: string;
			}> = [];

			while (!isDone && stepCount < MAX_STEPS) {
				stepCount++;
				// addToHistory(`\n--- Step ${stepCount} ---`);

				// Get updated tab info (URL might have changed)
				let currentTab: chrome.tabs.Tab | undefined;
				if (chrome.devtools?.inspectedWindow) {
					const tabId = chrome.devtools.inspectedWindow.tabId;
					const tabs = await chrome.tabs.query({});
					currentTab = tabs.find((t) => t.id === tabId);
				} else {
					const [t] = await chrome.tabs.query({
						active: true,
						currentWindow: true,
					});
					currentTab = t;
				}

				if (currentTab && currentTab.url !== previousUrl) {
					// addToHistory(`📍 URL changed to: ${currentTab.url}`);
					previousUrl = currentTab.url;

					// Wait for new page to finish loading before continuing
					console.log("Page navigated, waiting for load...");
					let loadTimeout = 10; // Max 10 seconds
					while (loadTimeout > 0) {
						const tabs = await chrome.tabs.query({});
						const tab = tabs.find(
							(t) =>
								t.id === chrome.devtools.inspectedWindow.tabId,
						);
						if (tab && tab.status === "complete") {
							console.log("Page loaded!");
							// Give content script a brief moment to initialize
							await new Promise((resolve) =>
								setTimeout(resolve, 300),
							);
							break;
						}
						await new Promise((resolve) =>
							setTimeout(resolve, 500),
						);
						loadTimeout--;
					}
				}

				// Get current DOM state
				// addToHistory('Extracting page elements...');

				let domResponse: {
					success: boolean;
					stats?: unknown;
					html?: string;
					elementMapping?: Record<string, string>;
					error?: string;
				};
				try {
					domResponse = await chrome.tabs.sendMessage(tab.id, {
						type: "GET_ANNOTATED_DOM",
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					if (errorMessage.includes("Receiving end does not exist")) {
						// Page might still be initializing content script, wait and retry
						console.log(
							"Content script not ready, waiting and retrying...",
						);

						// Try multiple times with increasing waits (5 attempts for reliability)
						const retries = 5;
						let _success = false;

						for (let i = 0; i < retries; i++) {
							const waitTime = 300 + i * 250; // 300ms, 550ms, 800ms, 1050ms, 1300ms
							console.log(
								`Retry ${i + 1}/${retries} - waiting ${waitTime}ms...`,
							);
							await new Promise((resolve) =>
								setTimeout(resolve, waitTime),
							);

							try {
								domResponse = await chrome.tabs.sendMessage(
									tab.id,
									{
										type: "GET_ANNOTATED_DOM",
									},
								);
								_success = true;
								console.log("Content script ready!");
								break;
							} catch (_retryError) {
								if (i === retries - 1) {
									throw new Error(
										"Content script not available. The page may not be fully loaded or the extension may need to be reloaded.",
									);
								}
							}
						}
					} else {
						throw error;
					}
				}

				if (!domResponse.success) {
					throw new Error("Failed to get page DOM");
				}

				const { stats, html, elementMapping } = domResponse;

				// Store element mapping globally for use in actions
				(
					window as Window & {
						__elementMapping?: Record<string, string>;
					}
				).__elementMapping = elementMapping || {};

				// addToHistory(`✓ Found ${stats.interactiveElements} interactive elements`);

				// Log simplified HTML for debugging
				console.log(`Step ${stepCount} - Simplified DOM:`, html);
				console.log(`Step ${stepCount} - DOM Stats:`, stats);

				// Build action history synchronously from executedActions
				// Format with structured <Thought> and <Action> tags
				const currentActionHistory = executedActions.map((act) => {
					let thoughtText = act.reason || "";
					let actionText = "";

					if (act.type === "click") {
						thoughtText =
							thoughtText ||
							`I should click on element ${act.elementId}`;
						actionText = `click(${act.elementId})`;
					} else if (act.type === "setValue") {
						thoughtText =
							thoughtText ||
							`I should type "${act.value}" into element ${act.elementId}`;
						actionText = `setValue(${act.elementId}, "${act.value}")`;
					} else if (act.type === "askUser") {
						thoughtText =
							thoughtText ||
							`I need to ask the user for ${act.fieldName}`;
						// Include the user's response in the action history
						actionText = `askUser("${act.fieldName}", "${act.question}") -> User provided: "${act.value}"`;
					} else if (act.type === "navigate") {
						thoughtText = thoughtText || `Navigating to ${act.url}`;
						actionText = `navigate("${act.url}")`;
					} else if (act.type === "done") {
						thoughtText = thoughtText || "The task is complete";
						actionText = "done()";
					} else {
						thoughtText = thoughtText || `Action: ${act.type}`;
						actionText = `${act.type}()`;
					}

					return `<Thought>${thoughtText}</Thought>\n<Action>${actionText}</Action>`;
				});

				// Get next action from LLM
				// addToHistory('Asking LLM for next action...');
				const action = await workshopService.getNextAction(
					command,
					html,
					currentTab?.url || "",
					currentActionHistory, // Pass synchronously built history
				);

				// Log the action
				console.log(`Step ${stepCount} - LLM Action:`, action);
				addToHistory(
					`LLM: ${action.type} - ${action.reason || action.message || ""}`,
				);

				// Handle different action types
				if (action.type === "error") {
					throw new Error(action.message || "LLM returned an error");
				}

				if (action.type === "done") {
					addToHistory("✅ Task completed successfully!");
					isDone = true;
					break;
				}

				if (action.type === "wait") {
					addToHistory(`⏳ Waiting 2 seconds: ${action.reason}`);
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue; // Skip to next iteration
				}

				// Handle navigate - change URL
				if (action.type === "navigate") {
					if (!action.url) {
						throw new Error("Navigate action requires a URL");
					}
					addToHistory(`🌐 Navigating to: ${action.url}`);
					await chrome.tabs.update(tab.id, { url: action.url });

					// Wait for page to load
					let loadTimeout = 15; // Max 15 seconds
					while (loadTimeout > 0) {
						const tabs = await chrome.tabs.query({});
						const currentTab = tabs.find((t) => t.id === tab.id);
						if (currentTab && currentTab.status === "complete") {
							addToHistory("✓ Page loaded");
							// Give content script a moment to initialize
							await new Promise((resolve) =>
								setTimeout(resolve, 500),
							);
							break;
						}
						await new Promise((resolve) =>
							setTimeout(resolve, 500),
						);
						loadTimeout--;
					}

					if (loadTimeout === 0) {
						addToHistory(
							"⚠️ Page load timeout, continuing anyway...",
						);
					}

					previousUrl = action.url;
					continue; // Skip to next iteration
				}

				// Handle askUser - prompt user for input
				if (action.type === "askUser") {
					addToHistory(
						`❓ ${action.question || "Please provide input"}`,
					);

					// Wait for user input
					const userValue = await new Promise<string>((resolve) => {
						setUserInputPrompt(
							action.question || "Please provide input",
						);
						setWaitingForUserInput(true);
						setUserInputCallback(() => (value: string) => {
							setWaitingForUserInput(false);
							setUserInputPrompt("");
							setUserInputValue("");
							setUserInputCallback(null);
							resolve(value);
						});
					});

					addToHistory(`✓ User provided: ${userValue}`);

					// Track this action
					executedActions.push({
						type: action.type,
						fieldName: action.fieldName,
						question: action.question,
						value: userValue, // Store the user's response
						reason: action.reason,
					});

					continue; // Skip to next iteration
				}

				// IMPROVED loop detection: Stop if repeating same action on same element
				// Check ALL previous actions (not just last 4) to catch patterns

				// Check for repeated setValue on same element with SAME value
				if (action.type === "setValue") {
					const previousSetValueOnSameElement =
						executedActions.filter(
							(a) =>
								a.type === "setValue" &&
								a.elementId === action.elementId &&
								a.value === action.value, // Same element AND same value
						).length;

					if (previousSetValueOnSameElement >= 1) {
						addToHistory(
							"❌ Stopped: Already typed this exact value into this element.",
						);
						addToHistory(
							"💡 Next step: Click the search/submit button, or call done() if task complete.",
						);
						isDone = true; // Mark as done to exit loop
						break;
					}

					// Warn if setting value on same element multiple times (but with different values)
					const allSetValuesOnElement = executedActions.filter(
						(a) =>
							a.type === "setValue" &&
							a.elementId === action.elementId,
					).length;

					if (allSetValuesOnElement >= 2) {
						addToHistory(
							"⚠️ Warning: Setting value on this element multiple times. This may indicate an issue.",
						);
					}
				}

				// Check for repeated clicks on same element (allow up to 2 before stopping)
				if (action.type === "click") {
					const previousClicksOnSameElement = executedActions.filter(
						(a) =>
							a.type === "click" &&
							a.elementId === action.elementId,
					).length;

					if (previousClicksOnSameElement >= 2) {
						addToHistory(
							"❌ Stopped: Clicking same element repeatedly. LLM may be confused.",
						);
						addToHistory(
							"💡 Try a different element or call done() if task is complete.",
						);
						isDone = true; // Mark as done to exit loop
						break;
					}

					if (previousClicksOnSameElement >= 1) {
						addToHistory(
							"⚠️ Warning: Clicking same element again. This may not be productive.",
						);
					}
				}

				// Execute the action
				// addToHistory(`🚀 Executing: ${action.type}`);
				if (!tab.id) {
					throw new Error("Tab ID not available");
				}
				await executeAction(tab.id, action);
				// addToHistory(`✓ Action completed`);

				// Track this action for loop detection AND action history
				// Store the full action object so we can build history synchronously
				executedActions.push({
					type: action.type,
					elementId: action.elementId,
					value:
						action.type === "setValue" ? action.value : undefined,
					url: "url" in action ? action.url : undefined,
					reason: action.reason,
				}); // Wait for page updates (longer for clicks that might navigate)
				const waitTime = action.type === "click" ? 3000 : 1500;
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}

			if (stepCount >= MAX_STEPS && !isDone) {
				addToHistory(
					`⚠️ Reached maximum steps (${MAX_STEPS}). Task may be incomplete.`,
				);
				addToHistory(
					`💡 Try breaking the task into smaller steps or refresh and try again.`,
				);
			}

			// Task completed successfully - reset for next command
			if (isDone) {
				setCommand(""); // Clear the input
				setTimeout(() => {
					commandInputRef.current?.focus(); // Focus back on input
				}, 100);
			}
		} catch (error) {
			addToHistory(
				`Error: ${error instanceof Error ? error.message : String(error)}`,
			);
			console.error("Error running command:", error);
		} finally {
			setIsRunning(false);
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
			message.startsWith("✓ Workshop") ||
			message.startsWith("✓ Found") || // Script action count
			message.match(/^\d+\./) || // Already has number like "1. NAVIGATE"
			message.startsWith("⏳ Waiting") || // Waiting messages
			message.startsWith("✓ Switched") || // Tab switch messages
			message.startsWith("✓ New tab") || // New tab messages
			message.startsWith("✓ User provided") || // User input confirmation
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

	// Execute action via background script
	const executeAction = async (
		tabId: number,
		action: LLMAction,
	): Promise<void> => {
		try {
			// First, attach debugger if not already attached
			const attachResponse = await chrome.runtime.sendMessage({
				type: "ATTACH_DEBUGGER",
				tabId: tabId,
			});
			// Suppress bfcache errors
			if (chrome.runtime.lastError) {
				// Ignore silently
			}
			if (!attachResponse.success) {
				console.log(
					"Debugger already attached or attachment failed:",
					attachResponse.error,
				);
			}

			// Execute the action
			let payload: Record<string, unknown> = {};

			if (action.type === "click") {
				payload = { elementId: action.elementId };
			} else if (action.type === "setValue") {
				payload = { elementId: action.elementId, value: action.value };
			} else if (action.type === "scroll") {
				payload = { direction: "down" };
			}

			const executeResponse = await chrome.runtime.sendMessage({
				type: "EXECUTE_ACTION",
				tabId: tabId,
				action: action.type,
				payload: payload,
				elementMapping:
					(
						window as Window & {
							__elementMapping?: Record<string, string>;
						}
					).__elementMapping || {}, // Pass element mapping
			});
			// Suppress bfcache errors
			if (chrome.runtime.lastError) {
				// Ignore silently
			}
			if (!executeResponse.success) {
				throw new Error(
					executeResponse.error || "Failed to execute action",
				);
			}

			// Wait briefly for the action to complete
			await new Promise((resolve) => setTimeout(resolve, 300));
		} catch (error) {
			console.error("Error executing action:", error);

			// Provide more helpful error messages
			let errorMessage =
				error instanceof Error ? error.message : String(error);

			if (errorMessage.includes("Could not compute box model")) {
				errorMessage =
					"Element not clickable (may be hidden, still loading, or DOM changed). The page might still be transitioning. Try running the task again.";
			} else if (errorMessage.includes("Could not find unique ID")) {
				errorMessage =
					"Element no longer exists (DOM changed). The page structure changed after element extraction.";
			}

			throw new Error(`Action execution failed: ${errorMessage}`);
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

	if (!hasSettings) {
		return (
			<div className="panel-container">
				<div className="panel-header">
					<h1>Workshop Automation</h1>
					<button
						type="button"
						onClick={openSettings}
						className="settings-btn"
					>
						⚙️ Settings
					</button>
				</div>
				<div className="panel-content">
					<div className="warning-section">
						⚠️ API keys not configured. Please go to Settings to set
						up your Workshop API credentials.
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="panel-container">
			<div className="panel-header">
				<h1>Workshop Automation</h1>
				<button
					type="button"
					onClick={openSettings}
					className="settings-btn"
				>
					⚙️ Settings
				</button>
			</div>

			<div className="panel-content">
				{/* Mode Switcher */}
				<div className="mode-switcher">
					<button
						type="button"
						onClick={() => setMode("llm")}
						className={mode === "llm" ? "active" : ""}
					>
						🤖 LLM Mode
					</button>
					<button
						type="button"
						onClick={() => setMode("script")}
						className={mode === "script" ? "active" : ""}
					>
						📜 Script Mode
					</button>
				</div>

				{/* LLM Mode */}
				{mode === "llm" && (
					<div className="command-section">
						<label htmlFor={commandId}>Task Command:</label>
						<textarea
							id={commandId}
							ref={commandInputRef}
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							placeholder="Enter automation task (e.g., 'click on the search button and type hello')"
							rows={4}
							disabled={isRunning}
							onKeyDown={(e) => {
								// Allow Enter to submit (but Shift+Enter for new line)
								if (
									e.key === "Enter" &&
									!e.shiftKey &&
									!isRunning &&
									command.trim()
								) {
									e.preventDefault();
									handleRunCommand();
								}
							}}
						/>
						<button
							type="button"
							onClick={handleRunCommand}
							disabled={isRunning || !command.trim()}
							className="run-btn"
						>
							{isRunning ? "⏸️ Running..." : "▶️ Start Task"}
						</button>
					</div>
				)}

				{/* Script Mode */}
				{mode === "script" && (
					<div className="command-section">
						{/* Format Toggle */}
						<div className="format-selector">
							<div className="format-label">JSON Format:</div>
							<div className="format-options">
								<label
									className={`format-option ${jsonFormat === "playwright" ? "active" : ""}`}
								>
									<input
										type="radio"
										name="jsonFormat"
										value="playwright"
										checked={jsonFormat === "playwright"}
										onChange={() =>
											setJsonFormat("playwright")
										}
										disabled={isRunning}
									/>
									<span className="format-text">
										Playwright Recorder
									</span>
								</label>
								<label
									className={`format-option ${jsonFormat === "google" ? "active" : ""}`}
								>
									<input
										type="radio"
										name="jsonFormat"
										value="google"
										checked={jsonFormat === "google"}
										onChange={() => setJsonFormat("google")}
										disabled={isRunning}
									/>
									<span className="format-text">
										Google Recorder
									</span>
								</label>
							</div>
						</div>

						<div className="file-upload-section">
							<label
								className="upload-label"
								htmlFor={fileInputId}
							>
								Upload Script JSON:
							</label>
							<div className="file-input-wrapper">
								<input
									id={fileInputId}
									ref={fileInputRef}
									type="file"
									accept=".json"
									onChange={handleFileUpload}
									disabled={isRunning}
									className="file-input"
								/>
							</div>
							{scriptJson && (
								<div className="script-loaded-badge">
									<span className="badge-icon">✓</span>
									<span className="badge-text">
										Script loaded:{" "}
										<strong>
											{jsonFormat === "playwright"
												? JSON.parse(scriptJson).meta
														?.title || "Untitled"
												: JSON.parse(scriptJson)
														.title || "Untitled"}
										</strong>
									</span>
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={handleRunScript}
							disabled={isRunning || !scriptJson}
							className="run-btn"
						>
							{isRunning ? "⏸️ Running..." : "▶️ Run Script"}
						</button>
					</div>
				)}

				{actionHistory.length > 0 && (
					<div className="history-section">
						<h3>Action History</h3>
						<div className="history-list">
							{actionHistory.map((action, index) => (
								<div
									key={`action-${index}-${action.substring(0, 20)}`}
									className="history-item"
								>
									{action}
								</div>
							))}
							<div ref={historyEndRef} />
						</div>
					</div>
				)}

				{/* User Input Dialog */}
				{waitingForUserInput && (
					<div className="user-input-overlay">
						<div className="user-input-dialog">
							<h3>Input Required</h3>
							<p>{userInputPrompt}</p>
							<input
								ref={userInputRef}
								type="text"
								value={userInputValue}
								onChange={(e) =>
									setUserInputValue(e.target.value)
								}
								placeholder="Enter value..."
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
								<button
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
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PanelApp;
