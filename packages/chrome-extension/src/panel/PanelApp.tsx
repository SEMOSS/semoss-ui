import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import { Button, TextField, Typography } from "@semoss/ui";
import {
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";

const PanelApp: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [isRunning, setIsRunning] = useState(false);
	const [actionHistory, setActionHistory] = useState<string[]>([]);
	const [waitingForUserInput, setWaitingForUserInput] = useState(false);
	const [userInputPrompt, setUserInputPrompt] = useState("");
	const [userInputValue, setUserInputValue] = useState("");
	const [isPasswordInput, setIsPasswordInput] = useState(false);
	const [userInputCallback, setUserInputCallback] = useState<
		((value: string) => void) | null
	>(null);
	const [mode, setMode] = useState<"script">("script");
	const [scriptJson, setScriptJson] = useState("");
	const [jsonFormat, setJsonFormat] = useState<"playwright">("playwright");

	const historyEndRef = React.useRef<HTMLDivElement>(null);

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
		
		chrome.runtime.sendMessage({
			type: "SMSS_EXTENSION_PANEL_OPENED",
			timestamp: Date.now(),
		}).catch((error) => {
			console.error("[PANEL] ❌ Failed to send open message:", error);
		});

		return () => {
			
			chrome.runtime.sendMessage({
				type: "SMSS_EXTENSION_PANEL_CLOSED",
				timestamp: Date.now(),
			}).catch((error) => {
				console.error("[PANEL] ❌ Failed to send close message:", error);
			});
		};
	}, []);

	// Listen for playground chat events from content script
	useEffect(() => {
		const messageListener = (
			message: any,
			sender: chrome.runtime.MessageSender,
			_sendResponse: (response?: any) => void,
		) => {
			// CRITICAL: Only process messages forwarded by background script (sender.tab will be undefined)
			// Ignore direct messages from content scripts to prevent duplicate execution
			if (
				sender.tab &&
				(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT")
			) {
				return;
			}

			// CRITICAL: Block script execution if already running
			if (
				(message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") &&
				isRunning
			) {
				return;
			}

			if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				// Handle Playwright script execution request from Playground
				const script = message.script;

				setActionHistory([
					`🎬 Received script from Playground: ${script.name}`,
				]);
				setMode("script");

				// Check if script content was provided
				if (script.scriptContent) {
					let content = script.scriptContent;

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
					if (content && typeof content.steps === "string") {
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

					// Auto-execute the script
					setActionHistory((prev) => [
						...prev,
						`▶️ Waiting for page to load before executing script...`,
					]);

					// Wait longer and check if page is loaded before executing
					setTimeout(async () => {
						// Wait for current tab to be in complete state
						const [currentTab] = await chrome.tabs.query({
							active: true,
							currentWindow: true,
						});
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
						await executeScriptWithContent(
							scriptContent,
							"playwright",
						);
					}, 1000);
				}
			}
			
			// Handle field input detected from webpage
			if (message.type === "FIELD_INPUT_DETECTED") {
				
				// If we're waiting for user input, auto-submit with the detected value
				if (waitingForUserInput && userInputCallback) {
					const valueToUse = message.isPassword ? "••••••••" : (message.value || "");
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
		format?: "playwright"
	) => {
		await executeScript(content, format);
	};

	const executeScript = async (
		content: string,
		format?: "playwright"
	) => {

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
			tabMap.set("tab-1", targetTab.id!); // First tab is the target tab
			let currentTabId = targetTab.id!;

			// Track which navigate URL we already executed during tab creation
			const preExecutedNavigateUrl = createdNewTab ? initialUrl : null;


			// Execute each action
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
							chrome.runtime.sendMessage({
								type: "HIGHLIGHT_FIELD",
								tabId: targetTabId,
								selector: selector,
							}).catch(err => {
								console.log("[PANEL] ⚠️ Highlight unavailable:", err.message);
							});
						}
						
						// Start monitoring the field on the webpage
						if (selector && targetTabId) {
							chrome.runtime.sendMessage({
								type: "START_FIELD_MONITORING",
								tabId: targetTabId,
								selector: selector,
								isPassword: isPassword,
							}).catch(err => {
								// This is not critical - user can still input via extension dialog
								console.log("[PANEL] ℹ️ Field monitoring unavailable:", err.message);
							});
						}
						
						setUserInputCallback(() => (value: string) => {
							// Remove highlight when input is received
							if (selector && targetTabId) {
								chrome.runtime.sendMessage({
									type: "REMOVE_HIGHLIGHT",
									tabId: targetTabId,
									selector: selector,
								}).catch(err => {
									// Not critical
									console.log("[PANEL] ℹ️ Could not remove highlight:", err.message);
								});
							}
							
							// Stop monitoring when input is received
							if (selector && targetTabId) {
								chrome.runtime.sendMessage({
									type: "STOP_FIELD_MONITORING",
									tabId: targetTabId,
									selector: selector,
								}).catch(err => {
									// Not critical - monitoring will cleanup on its own
									console.log("[PANEL] ℹ️ Could not stop field monitoring:", err.message);
								});
							}
							
							setWaitingForUserInput(false);
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

				// If this action triggers a new tab, track it (but skip if we already created initial tab)
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

			<div className="panel-content">
				{actionHistory.length > 0 && (
					<div className="history-section">
						<Typography variant="h3">Action History</Typography>
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
							<Typography variant="h3">Input Required</Typography>
							<Typography variant="body1">
								{userInputPrompt}
							</Typography>
							<TextField
								type={isPasswordInput ? "password" : "text"}
								value={userInputValue}
								onChange={(e) => {
									const newValue = e.target.value;
									setUserInputValue(newValue);
									
									// Real-time mirroring to webpage (password fields show as dots automatically)
									if (currentSelector && currentTabId) {
										// Clear existing debounce timer
										if (debounceTimerRef.current) {
											clearTimeout(debounceTimerRef.current);
										}
										
										// Debounce the update to avoid excessive messages
										debounceTimerRef.current = setTimeout(() => {
											chrome.runtime.sendMessage({
												type: "UPDATE_FIELD_VALUE",
												tabId: currentTabId,
												selector: currentSelector,
												value: newValue,
											}).catch(err => {
												console.log("[PANEL] ⚠️ Mirroring unavailable:", err.message);
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
											userInputCallback(userInputValue);
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
