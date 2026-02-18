import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import {
	type GoogleRecorderScript,
	type PlaywrightScript,
	ScriptExecutor,
} from "../services/scriptExecutor";
import { Button, TextField, Typography } from "@semoss/ui";

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
	const [mode, setMode] = useState<"llm" | "script">("script");
	const [scriptJson, setScriptJson] = useState("");
	const [jsonFormat, setJsonFormat] = useState<"playwright" | "google">(
		"playwright",
	);
	
	const dropdownRef = useRef<HTMLDivElement>(null);
	const historyEndRef = React.useRef<HTMLDivElement>(null);

	// Playground chat monitoring
	const [autoExecutePlayground, setAutoExecutePlayground] = useState(false);
	const [activeAutomationTabId, setActiveAutomationTabId] = useState<
		number | null
	>(null);

	// Auto-scroll to bottom when action history updates
	React.useEffect(() => {
		if (historyEndRef.current) {
			historyEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	useEffect(() => {
		setIsLoading(false);
	}, []);

	// Listen for playground chat events from content script
	useEffect(() => {
		const messageListener = (
			message: any,
			sender: chrome.runtime.MessageSender,
			_sendResponse: (response?: any) => void,
		) => {
			console.log("[PANEL] Received message:", message.type, message, "sender:", sender);
			
			// CRITICAL: Only process messages forwarded by background script (sender.tab will be undefined)
			// Ignore direct messages from content scripts to prevent duplicate execution
			if (sender.tab && (
				message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" ||
				message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT"
			)) {
				console.log("[PANEL] Ignoring direct message from content script - waiting for background broadcast");
				return;
			}

			// CRITICAL: Block script execution if already running
			if ((message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT" || message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT") && isRunning) {
				console.log("[PANEL] ⚠️ Script execution already in progress - ignoring duplicate request");
				return;
			}
			
			if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				// Handle Playwright script execution request from Playground
				const script = message.script;
				console.log("[PANEL] 📥 Received Playwright script execution request:", {
					scriptName: script?.name,
					hasScriptContent: !!script?.scriptContent,
					contentType: typeof script?.scriptContent
				});

				setActionHistory([
					`🎬 Received script from Playground: ${script.name}`,
				]);
				setMode("script");

				// Check if script content was provided
				if (script.scriptContent) {
					let content = script.scriptContent;
					
					// If scriptContent is a string, parse it first
					if (typeof content === 'string') {
						try {
							content = JSON.parse(content);
						} catch (e) {
							console.error("[PANEL] ❌ Failed to parse scriptContent string:", e);
						}
					}
					
					// If steps is a string, parse it too (handle nested stringification)
					if (content && typeof content.steps === 'string') {
						try {
							content.steps = JSON.parse(content.steps);
						} catch (e) {
							console.error("[PANEL] ❌ Failed to parse steps string:", e);
						}
					}
					
					console.log("[PANEL] ✅ Script content included, using directly:", {
						hasSteps: !!content.steps,
						stepsType: typeof content.steps,
						isStepsArray: Array.isArray(content.steps),
						stepKeys: content.steps && typeof content.steps === 'object' && !Array.isArray(content.steps) ? Object.keys(content.steps) : 'not an object'
					});

					// Use the provided script content directly
					const scriptContent = JSON.stringify(
						content,
						null,
						2,
					);
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
						const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
						if (currentTab?.id) {
							// Wait for tab to be fully loaded
							let retries = 20; // 10 seconds total
							while (retries > 0) {
								const tabs = await chrome.tabs.query({});
								const tab = tabs.find((t) => t.id === currentTab.id);
								if (tab?.status === 'complete') {
									break;
								}
								await new Promise((resolve) => setTimeout(resolve, 500));
								retries--;
							}
							// Additional buffer time after page load
							await new Promise((resolve) => setTimeout(resolve, 1500));
						}
						setActionHistory((prev) => [
							...prev,
							`▶️ Page loaded, executing script...`,
						]);
						await executeScriptWithContent(scriptContent, "playwright");
					}, 1000);
				}
			} else if (message.type === "SMSS_EXEC_GOOGLE_RECORDER_SCRIPT") {
				// Handle Google Recorder script execution request from Playground
				const script = message.script;
				console.log("[PANEL] 📥 Received Google Recorder script execution request:", {
					scriptName: script?.name,
					hasScriptContent: !!script?.scriptContent,
					autoExecute: script?.autoExecute,
					contentType: typeof script?.scriptContent
				});

				setActionHistory([
					`🎬 Received Google Recorder script from Playground: ${script.name}`,
				]);
				setMode("script");

				// Google Recorder scripts always have content provided
				if (script.scriptContent) {
					let content = script.scriptContent;
					
					// If scriptContent is a string, parse it first
					if (typeof content === 'string') {
						try {
							content = JSON.parse(content);
						} catch (e) {
							console.error("[PANEL] ❌ Failed to parse scriptContent string:", e);
						}
					}
					
					// If steps is a string, parse it too (handle nested stringification)
					if (content && typeof content.steps === 'string') {
						try {
							content.steps = JSON.parse(content.steps);
						} catch (e) {
							console.error("[PANEL] ❌ Failed to parse steps string:", e);
						}
					}
					
					console.log("[PANEL] ✅ Google Recorder script content validated:", {
						hasSteps: !!content.steps,
						stepCount: content.steps?.length || 0,
						title: content.title,
					});

					// Use the provided script content directly
					const scriptContent = JSON.stringify(
						content,
						null,
						2,
					);
					setScriptJson(scriptContent);
					setJsonFormat("google");
					console.log("[PANEL] 📝 Script JSON set, format: google");
					
					setActionHistory((prev) => [
						...prev,
						`✅ Google Recorder script loaded: ${script.name}`,
					]);

					// Auto-execute the script
					setActionHistory((prev) => [
						...prev,
						`▶️ Waiting for page to load before executing Google Recorder script...`,
					]);

					console.log("[PANEL] 🚀 Scheduling script execution with page load detection...");
					// Wait longer and check if page is loaded before executing
					setTimeout(async () => {
						// Wait for current tab to be in complete state
						const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
						if (currentTab?.id) {
							console.log("[PANEL] ⏳ Waiting for tab to fully load...");
							// Wait for tab to be fully loaded
							let retries = 20; // 10 seconds total
							while (retries > 0) {
								const tabs = await chrome.tabs.query({});
								const tab = tabs.find((t) => t.id === currentTab.id);
								if (tab?.status === 'complete') {
									console.log("[PANEL] ✅ Tab loaded, status: complete");
									break;
								}
								await new Promise((resolve) => setTimeout(resolve, 500));
								retries--;
							}
							// Additional buffer time after page load
							await new Promise((resolve) => setTimeout(resolve, 1500));
						}
						setActionHistory((prev) => [
							...prev,
							`▶️ Page loaded, executing script...`,
						]); 
						console.log("[PANEL] ⏱️ Executing script now...");
						await executeScriptWithContent(scriptContent, "google");
					}, 1000);
				} else {
					console.error("[PANEL] ❌ Google Recorder script content missing!");
					setActionHistory((prev) => [
						...prev,
						`❌ Google Recorder script content missing`,
					]);
				}
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		return () => {
			chrome.runtime.onMessage.removeListener(messageListener);
		};
	}, [mode, autoExecutePlayground, isRunning]);

	// Close dropdown when clicking outside

	const executeScriptWithContent = async (content: string, format?: "playwright" | "google") => {
		await executeScript(content, format);
	};

	const executeScript = async (content: string, format?: "playwright" | "google") => {
		console.log("scriptJSON in run Script", content);

		if (!content.trim()) {
			setActionHistory(["❌ Please upload a script JSON file first"]);
			return;
		}

		setIsRunning(true);
		setActionHistory([]);

		try {
			// Use provided format or fall back to state
			const scriptFormat = format || jsonFormat;
			console.log("[PANEL] Executing with format:", scriptFormat);
			
			// Parse script based on format
			let script: PlaywrightScript | GoogleRecorderScript;
			if (scriptFormat === "playwright") {
				script = ScriptExecutor.parseScript(content);
			} else {
				script = ScriptExecutor.parseGoogleRecorderScript(content);
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
				console.log("script being sent to convertToActions", script);

				actions = await ScriptExecutor.convertToActions(
					script as PlaywrightScript,
				);
			} else {
				actions = await ScriptExecutor.convertGoogleRecorderToActions(
					script as GoogleRecorderScript,
				);
			}
			addToHistory(`✓ Found ${actions.length} actions to execute`);

		// Find the first navigate action (might not be the very first action)
		const firstNavigateAction = actions.find(a => a.type === "navigate" && a.url);
		// For Playwright scripts: create a new tab if there's a navigate action
		// For Google Recorder scripts: NEVER create a new tab (execute in current tab)
		const needsNewTab = scriptFormat === "playwright" && !!firstNavigateAction;
		const initialUrl = firstNavigateAction?.url || "about:blank";
		
		console.log("[PANEL] Tab creation decision:", {
			jsonFormat,
			needsNewTab,
			initialUrl,
			firstNavigateAction: firstNavigateAction ? `${firstNavigateAction.type}: ${firstNavigateAction.url}` : 'none',
			totalActions: actions.length
		});

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
					await new Promise((resolve) => setTimeout(resolve, 500));
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
		
		console.log("[PANEL] Starting action execution:", {
			totalActions: actions.length,
			preExecutedNavigateUrl,
			willSkipNavigate: !!preExecutedNavigateUrl
		});

		// Execute each action
		for (let i = 0; i < actions.length; i++) {
			const action = actions[i];
			
			console.log(`[PANEL] Action ${i + 1}/${actions.length}:`, {
				type: action.type,
				url: action.url,
				selector: action.selector?.substring(0, 50),
				willSkip: action.type === "navigate" && action.url === preExecutedNavigateUrl
			});
			
			// Skip navigate action if we already executed it during tab creation
			if (action.type === "navigate" && action.url === preExecutedNavigateUrl) {
				addToHistory(`✓ Skipping navigate (already executed): ${action.url}`);
				console.log(`[PANEL] ⏭️ SKIPPED navigate action`);
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
				): Promise<string> => {
					return new Promise<string>((resolve) => {
						setUserInputPrompt(
							`${isPassword ? "🔒 " : ""}${label}`,
						);
						setIsPasswordInput(isPassword);
						setWaitingForUserInput(true);
						setUserInputCallback(() => (value: string) => {
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
					message: "Script executed successfully"
				});
				console.log("[PANEL] ✅ Sent execution complete message to background");
			} catch (err) {
				console.error("[PANEL] ❌ Failed to send completion message:", err);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			addToHistory(`❌ Error: ${errorMessage}`);
			console.error("LLM automation error:", error);
			// Notify playground of failed execution
			try {
				await chrome.runtime.sendMessage({
					type: "SCRIPT_EXECUTION_COMPLETE",
					success: false,
					message: `Script execution failed: ${errorMessage}`
				});
			} catch (err) {
				console.error("[PANEL] ❌ Failed to send error message:", err);
			}
			// Reset tracked tab on error
			setActiveAutomationTabId(null);
		} finally {
			setIsRunning(false);
		}
	};

	const commandId = React.useId();

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
				<Typography variant="h1">Workshop Automation</Typography>
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
							<Typography variant="body1">{userInputPrompt}</Typography>
							<TextField
								type={isPasswordInput ? "password" : "text"}
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
