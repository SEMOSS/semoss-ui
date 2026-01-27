import React, { useEffect, useRef, useState } from "react";
import "./panel.css";
import {
	createDirectWorkshopService,
	type LLMAction,
	type ScriptFile,
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
	const [mode, setMode] = useState<"llm" | "script">("script");
	const [scriptJson, setScriptJson] = useState("");
	const [jsonFormat, setJsonFormat] = useState<"playwright" | "google">(
		"playwright",
	);
	// Hardcoded project ID for Playwright Player
	const projectId = "b8040678-d208-407b-96d7-327cdce4642e";
	//const projectId = "558ee650-b4a6-41dc-8362-14ca87ec6644";
	const [availableScripts, setAvailableScripts] = useState<ScriptFile[]>([]);
	const [selectedScript, setSelectedScript] = useState<string>("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isFetchingScripts, setIsFetchingScripts] = useState(false);
	const [isLoadingScript, setIsLoadingScript] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const commandInputRef = React.useRef<HTMLTextAreaElement>(null);
	const historyEndRef = React.useRef<HTMLDivElement>(null);
	const userInputRef = React.useRef<HTMLInputElement>(null);

	// Playground chat monitoring
	const [playgroundChatText, setPlaygroundChatText] = useState("");
	const [playgroundLastResponse, setPlaygroundLastResponse] = useState<{
		text: string;
		modelName: string;
		timestamp: number;
	} | null>(null);
	const [autoExecutePlayground, setAutoExecutePlayground] = useState(false);
	const [pendingPlaygroundCommand, setPendingPlaygroundCommand] = useState<string | null>(null);
	const [activeAutomationTabId, setActiveAutomationTabId] = useState<number | null>(null);

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

	// Listen for playground chat events from content script
	useEffect(() => {
		const messageListener = (
			message: any,
			_sender: chrome.runtime.MessageSender,
			_sendResponse: (response?: any) => void,
		) => {
			console.log("[PANEL] Received message:", message.type, message);
			if (message.type === "PLAYGROUND_CHAT_RESPONSE") {
				// Track AI response from playground and use it as the command
				const aiResponseText = message.data.text;
				setPlaygroundLastResponse({
					text: aiResponseText,
					modelName: message.data.modelName || "AI",
					timestamp: message.data.timestamp,
				});
				
				// Check if AI response is about playing/running scripts
				const scriptPatterns = /play\s+(some\s+)?script|run\s+(a\s+)?script|execute\s+(a\s+)?script/i;
				if (scriptPatterns.test(aiResponseText)) {
					setMode("script");
					setActionHistory([`🎮 Switched to Script Mode from Playground AI response`]);
					return;
				}
				
				// Auto-populate command field with AI response for LLM mode
				if (mode === "llm" && aiResponseText.trim()) {
					setCommand(aiResponseText);
					setPendingPlaygroundCommand(aiResponseText);
					
					// Auto-execute if enabled and not already running
					if (autoExecutePlayground && !isRunning) {
						setActionHistory([`🎮 Auto-executing from Playground AI: ${aiResponseText.substring(0, 100)}${aiResponseText.length > 100 ? '...' : ''}`]);
						// Trigger command execution after a brief delay
						setTimeout(() => {
							if (commandInputRef.current) {
								commandInputRef.current.form?.requestSubmit();
							}
						}, 100);
					}
				}
			} else if (message.type === "PLAYGROUND_CHAT_SUBMIT") {
				const submittedText = message.data.text;
				setPlaygroundChatText(submittedText);
			} else if (message.type === "SMSS_EXEC_PLAYWRIGHT_SCRIPT") {
				// Handle Playwright script execution request from Playground
				const script = message.script;
				console.log("Received script execution request:", script);
				
				setActionHistory([`🎬 Received script from Playground: ${script.name}`]);
				setMode("script");
				
				// Check if script content was provided
				if (script.content) {
					console.log("Script content included, using directly:", {
						hasSteps: !!script.content.steps,
						stepCount: script.content.steps?.length || 0,
						scriptCont: script.content
					});
					
					// Use the provided script content directly
					const scriptContent = JSON.stringify(script.content, null, 2);
					setScriptJson(scriptContent);
					setJsonFormat("playwright");
					setActionHistory((prev) => [...prev, `✅ Script loaded: ${script.name}`]);
					
					// Auto-execute the script
					setActionHistory((prev) => [...prev, `▶️ Executing script...`]);
					
					// Trigger script execution with the content directly
					setTimeout(async () => {
						await executeScriptWithContent(scriptContent);
					}, 500);
				} else {
					// Fallback to fetching from server (requires Workshop credentials)
					(async () => {
						try {
							setIsLoadingScript(true);
							setActionHistory((prev) => [...prev, `🔄 Loading script from server: ${script.name}...`]);
							
							const service = await createDirectWorkshopService();
							if (!service) {
								throw new Error("Workshop service not configured. Please configure Workshop credentials in the extension settings.");
							}

							const scriptContent = await service.fetchScript(
								script.projectId,
								`version/assets/recordings/${script.name}`,
							);
							
							setScriptJson(scriptContent);
							setJsonFormat("playwright");
							setActionHistory((prev) => [...prev, `✅ Script loaded: ${script.name}`]);
							setIsLoadingScript(false);
							
							// Auto-execute the script
							setActionHistory((prev) => [...prev, `▶️ Executing script...`]);
							
							// Trigger script execution
							setTimeout(async () => {
								await handleRunScript();
							}, 500);
							
						} catch (error) {
							const errorMsg = error instanceof Error ? error.message : String(error);
							setActionHistory((prev) => [...prev, `❌ Failed to load/execute script: ${errorMsg}`]);
							setIsLoadingScript(false);
						}
					})();
				}
			}
		};

		chrome.runtime.onMessage.addListener(messageListener);

		return () => {
			chrome.runtime.onMessage.removeListener(messageListener);
		};
	}, [mode, autoExecutePlayground, isRunning]);

	const handleFetchScripts = React.useCallback(async () => {
		if (!projectId.trim()) {
			return;
		}

		setIsFetchingScripts(true);

		try {
			const service = await createDirectWorkshopService();
			if (!service) {
				throw new Error("Workshop service not configured");
			}

			const scripts = await service.listScripts(projectId);
			setAvailableScripts(scripts);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : String(error);
			// Log error to console but don't block Action History panel
			console.error("Failed to fetch scripts:", errorMsg);
			setAvailableScripts([]);
		} finally {
			setIsFetchingScripts(false);
		}
	}, []);

	const handleLoadScript = React.useCallback(async () => {
		if (!selectedScript) {
			setActionHistory(["❌ Please select a script to load"]);
			return;
		}

		setIsLoadingScript(true);
		setActionHistory([`🔄 Loading script: ${selectedScript}...`]);

		try {
			
				// Load from project
				if (!projectId.trim()) {
					throw new Error("Project ID not configured");
				}
				
				const service = await createDirectWorkshopService();
				if (!service) {
					throw new Error("Workshop service not configured");
				}

				const scriptContent = await service.fetchScript(
					projectId,
					selectedScript,
				);
				setScriptJson(scriptContent);

				const scriptFile = availableScripts.find(
					(s) => s.path === selectedScript,
				);
				setActionHistory([
					`✅ Loaded script: ${scriptFile?.name || selectedScript}`,
				]);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : String(error);
			setActionHistory([`❌ Failed to load script: ${errorMsg}`]);
		} finally {
			setIsLoadingScript(false);
		}
	}, [selectedScript, availableScripts]);

	// Pre-fetch scripts on page load for instant availability (only for Playwright mode)
	useEffect(() => {
		if (
			hasSettings &&
			projectId &&
			availableScripts.length === 0 &&
			!isFetchingScripts &&
			jsonFormat === "playwright"
		) {
			handleFetchScripts();
		}
	}, [
		hasSettings,
		jsonFormat,
		availableScripts.length,
		isFetchingScripts,
		handleFetchScripts,
	]);

	// Auto-load script when selected
	useEffect(() => {
		if (selectedScript && !isLoadingScript) {
			handleLoadScript();
		}
	}, [selectedScript, isLoadingScript, handleLoadScript]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		if (isDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isDropdownOpen]);

	const openSettings = () => {
		chrome.runtime.openOptionsPage();
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				setScriptJson(content);
				setActionHistory((prev) => [
					...prev,
					`✓ Loaded script: ${file.name}`,
				]);
			} catch (error) {
				setActionHistory((prev) => [
					...prev,
					`✗ Failed to load file: ${error instanceof Error ? error.message : String(error)}`,
				]);
			}
		};
		reader.readAsText(file);
	};

	const executeScriptWithContent = async (content: string) => {
		await executeScript(content);
	};

	const handleRunScript = async () => {
		await executeScript(scriptJson);
	};

	const executeScript = async (content: string) => {
		console.log("scriptJSON in run Script", content);
		


		if (!content.trim()) {
			setActionHistory(["❌ Please upload a script JSON file first"]);
			return;
		}

		setIsRunning(true);
		setActionHistory([]);

		try {
			// Parse script based on format
			let script: PlaywrightScript | GoogleRecorderScript;
			if (jsonFormat === "playwright") {
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
			if (jsonFormat === "playwright") {
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

			// Create a new tab before starting execution
			addToHistory(`✓ Creating new tab for script execution...`);
			const newTab = await chrome.tabs.create({
				active: true, // Make it active so user can see it
				url: "about:blank"
			});
			
			if (!newTab.id) {
				throw new Error("Failed to create new tab");
			}
			
			addToHistory(`✓ New tab created`);
			
			// Wait for tab to be ready
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Track tabs: maps tabId (tab-1, tab-2) to Chrome tab ID
			const tabMap = new Map<string, number>();
			tabMap.set("tab-1", newTab.id); // First tab is the newly created tab
			let currentTabId = newTab.id;

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
			console.error("LLM automation error:", error);
			// Reset tracked tab on error
			setActiveAutomationTabId(null);
		} finally {
			setIsRunning(false);
		}
	};

	const commandId = React.useId();

	const handleRunCommand = async () => {
		if (!command.trim()) return;
		
		// Clear pending playground command indicator
		setPendingPlaygroundCommand(null);

		// Check if command is about opening a new tab
		const newTabPatterns = /(?:open|create|new)\s+(?:a\s+)?(?:new\s+)?tab/i;
		const urlPattern = /(https?:\/\/[^\s]+)|(?:(?:go\s+to|navigate\s+to|open)\s+)([\w\-]+(?:\.[\w\-]+)+(?:\/[^\s]*)?)/i;
		
		if (newTabPatterns.test(command)) {
			setIsRunning(true);
			setActionHistory([`🔄 Opening new tab...`]);
			
			try {
				let url = "https://www.google.com"; // Default URL
				
				// Try to extract URL from command
				const urlMatch = command.match(urlPattern);
				if (urlMatch) {
					if (urlMatch[1]) {
						// Full URL with protocol
						url = urlMatch[1];
					} else if (urlMatch[2]) {
						// Domain without protocol
						url = `https://${urlMatch[2]}`;
					}
				}
				
				// Create new tab with focus
				const newTab = await chrome.tabs.create({ url, active: true });
				
				if (newTab && newTab.id) {
					// Track this tab for subsequent automation
					setActiveAutomationTabId(newTab.id);
					
					setActionHistory([
						`✅ Opened new tab (ID: ${newTab.id})`,
						`🌐 Navigated to: ${url}`,
						`🎯 Focus switched to new tab - all subsequent actions will happen here`,
					]);
					
					// Wait for page to load before continuing
					let loadTimeout = 15;
					while (loadTimeout > 0) {
						const tabs = await chrome.tabs.query({});
						const tab = tabs.find(t => t.id === newTab.id);
						if (tab && tab.status === "complete") {
							await new Promise(resolve => setTimeout(resolve, 500));
							break;
						}
						await new Promise(resolve => setTimeout(resolve, 500));
						loadTimeout--;
					}
				} else {
					throw new Error("Failed to create new tab");
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				setActionHistory([`❌ Error opening new tab: ${errorMsg}`]);
			} finally {
				setIsRunning(false);
			}
			return;
		}

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
// Get tab for automation - use tracked tab if available
		let tab: chrome.tabs.Tab | undefined;
		if (activeAutomationTabId) {
			// Use the tracked automation tab (e.g., from "open new tab" command)
			const tabs = await chrome.tabs.query({});
			tab = tabs.find((t) => t.id === activeAutomationTabId);
			if (tab) {
				addToHistory(`🎯 Using tracked tab (ID: ${activeAutomationTabId})`);
				// Make sure it's active
				await chrome.tabs.update(activeAutomationTabId, { active: true });
			}
		}
		
		if (!tab) {
			// Fall back to current/inspected tab
			if (chrome.devtools?.inspectedWindow) {
				// Running in DevTools panel
				const tabId = chrome.devtools.inspectedWindow.tabId;
				const tabs = await chrome.tabs.query({});
				tab = tabs.find((t) => t.id === tabId);
			} else {
				// Running in popup/side panel
				const [currentTab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				tab = currentTab;
			}
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
				// Use tracked automation tab if available, otherwise get current
				if (activeAutomationTabId) {
					const tabs = await chrome.tabs.query({});
					currentTab = tabs.find((t) => t.id === activeAutomationTabId);
				} else if (chrome.devtools?.inspectedWindow) {
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
					// Determine which tab ID to monitor
					const tabIdToMonitor = activeAutomationTabId || currentTab.id;
					while (loadTimeout > 0) {
						const tabs = await chrome.tabs.query({});
						const tab = tabs.find(
							(t) => t.id === tabIdToMonitor,
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
				// Include playground response as context if available
				const playgroundContext = playgroundLastResponse
					? `AI Response (${playgroundLastResponse.modelName}): ${playgroundLastResponse.text}`
					: undefined;
				
				const action = await workshopService.getNextAction(
					command,
					html,
					currentTab?.url || "",
					currentActionHistory, // Pass synchronously built history
					playgroundContext, // Pass playground response as context
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
					// Reset tracked tab
					setActiveAutomationTabId(null);
					isDone = true;
					break;
				}

				if (action.type === "wait") {
					addToHistory(`⏳ Waiting 2 seconds: ${action.reason}`);
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue; // Skip to next iteration
				}

				// Handle navigate - open URL in NEW tab
				if (action.type === "navigate") {
					if (!action.url) {
						throw new Error("Navigate action requires a URL");
					}
					addToHistory(`🌐 Opening in new tab: ${action.url}`);
					
					// Create new tab with focus
					const newTab = await chrome.tabs.create({ url: action.url, active: true });
					
					if (newTab && newTab.id) {
						// Track this tab for subsequent automation
						setActiveAutomationTabId(newTab.id);
						tab = newTab; // Update current tab reference
						addToHistory(`✓ New tab opened (ID: ${newTab.id})`);
						addToHistory(`🎯 Focus switched to new tab`);
						
						// Wait for page to load
						let loadTimeout = 15; // Max 15 seconds
						while (loadTimeout > 0) {
							const tabs = await chrome.tabs.query({});
							const currentTab = tabs.find((t) => t.id === newTab.id);
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
					} else {
						throw new Error("Failed to create new tab for navigation");
					}
					
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

				// Check for repeated setValue on same element - STOP IMMEDIATELY
				if (action.type === "setValue") {
					const previousSetValueOnSameElement = executedActions.filter(
						(a) =>
							a.type === "setValue" &&
							a.elementId === action.elementId,
					).length;

					if (previousSetValueOnSameElement >= 1) {
						addToHistory(
							"❌ STOPPED: Already set value on this element. Repetition detected.",
						);
						addToHistory(
							"💡 Task terminated. The LLM was trying to repeat an action.",
						);
						isDone = true;
						break;
					}
				}

				// Check for repeated clicks on same element - STOP IMMEDIATELY on repeat
				if (action.type === "click") {
					const previousClicksOnSameElement = executedActions.filter(
						(a) =>
							a.type === "click" &&
							a.elementId === action.elementId,
					).length;

					if (previousClicksOnSameElement >= 1) {
						addToHistory(
							"❌ STOPPED: Repetition detected - already clicked this element.",
						);
						addToHistory(
							"💡 Task terminated to prevent infinite loop.",
						);
						isDone = true;
						break;
					}
				}
				
				// Additional check: detect action loops (same action type repeated 3+ times in a row)
				if (executedActions.length >= 3) {
					const lastThreeActions = executedActions.slice(-3);
					const allSameType = lastThreeActions.every(
						(a) => a.type === action.type,
					);
					if (allSameType) {
						addToHistory(
							`❌ STOPPED: Detected loop pattern - repeated ${action.type} actions.`,
						);
						addToHistory(
							"💡 Task terminated. The LLM appears to be stuck.",
						);
						isDone = true;
						break;
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
						{!hasSettings && (
							<div className="warning-section" style={{ marginBottom: "16px" }}>
								⚠️ API keys not configured. Please go to Settings to set
								up your Workshop API credentials to use LLM mode.
							</div>
						)}
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
						
						{/* Playground Integration Controls */}
						<div className="playground-controls">
							<label className="playground-toggle">
								<input
									type="checkbox"
									checked={autoExecutePlayground}
									onChange={(e) => setAutoExecutePlayground(e.target.checked)}
									disabled={isRunning}
								/>
								<span className="toggle-text">
									🎮 Auto-execute commands from Playground
								</span>
							</label>
							{pendingPlaygroundCommand && !isRunning && (
								<div className="playground-pending">
									<span className="pending-text">
										Playground command ready
									</span>
									<button
										type="button"
										className="use-playground-btn"
										onClick={handleRunCommand}
									>
										▶️ Execute Now
									</button>
								</div>
							)}
						</div>

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

						{/* Playwright Recorder - Script Selector */}
						{jsonFormat === "playwright" && (
							<>
								{availableScripts.length === 0 &&
									!isFetchingScripts && (
										<div className="info-section">
											{isFetchingScripts
												? "🔄 Fetching scripts..."
												: "📭 No scripts found. Record a script in Playwright Recorder first."}
										</div>
									)}

								{availableScripts.length > 0 && (
									<div className="script-selector-container">
										<div className="script-header">
											<span className="script-label">
												Select Script:
											</span>
											<button
												type="button"
												onClick={handleFetchScripts}
												disabled={
													isRunning ||
													isFetchingScripts
												}
												className="refresh-btn-small"
												title="Refresh script list"
											>
												{isFetchingScripts
													? "🔄"
													: "🔄"}
											</button>
										</div>

										<div
											className="custom-dropdown"
											ref={dropdownRef}
										>
											<button
												type="button"
												className="custom-dropdown-header"
												onClick={() =>
													!isRunning &&
													!isLoadingScript &&
													setIsDropdownOpen(
														!isDropdownOpen,
													)
												}
												disabled={
													isRunning || isLoadingScript
												}
											>
												<span>
													{selectedScript
														? availableScripts.find(
																(s) =>
																	s.path ===
																	selectedScript,
															)?.name ||
															" Choose a script "
														: " Choose a script "}
												</span>
												<span className="dropdown-arrow">
													{isDropdownOpen ? "▲" : "▼"}
												</span>
											</button>

											{isDropdownOpen && (
												<div className="custom-dropdown-list">
													{availableScripts.map(
														(script) => (
															<button
																type="button"
																key={
																	script.path
																}
																className={`custom-dropdown-item ${
																	selectedScript ===
																	script.path
																		? "selected"
																		: ""
																}`}
																onClick={() => {
																	setSelectedScript(
																		script.path,
																	);
																	setIsDropdownOpen(
																		false,
																	);
																}}
															>
																{script.name}
															</button>
														),
													)}
												</div>
											)}
										</div>

										{isLoadingScript && (
											<div className="loading-indicator">
												🔄 Loading script...
											</div>
										)}
									</div>
								)}
							</>
						)}

						{/* Google Recorder - File Upload */}
						{jsonFormat === "google" && (
							<div className="file-upload-section">
								<span className="upload-label">
									Upload Script JSON:
								</span>
								<div className="file-input-wrapper">
									<input
										type="file"
										ref={fileInputRef}
										accept=".json"
										onChange={handleFileUpload}
										disabled={isRunning}
										className="file-input"
									/>
								</div>
							</div>
						)}

						{scriptJson && (
							<div className="script-loaded-badge">
								<span className="badge-icon">✓</span>
								<span className="badge-text">
									Script loaded:{" "}
									<strong>
										{jsonFormat === "playwright"
											? JSON.parse(scriptJson).meta
													?.title || "Untitled"
											: JSON.parse(scriptJson).title ||
												"Untitled"}
									</strong>
								</span>
							</div>
						)}

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

				{/* Playground Chat Monitor */}
				{(playgroundChatText || playgroundLastResponse) && (
					<div className="playground-monitor-section">
						<h3>🎮 Playground Chat Monitor</h3>
						{playgroundChatText && (
							<div className="playground-current">
								<strong>Last User Input:</strong>
								<div className="playground-text">
									{playgroundChatText || "(empty)"}
								</div>
							</div>
						)}
						{playgroundLastResponse && (
							<div className="playground-submitted">
								<strong>Latest AI Response ({playgroundLastResponse.modelName}):</strong>
								<div className="playground-text">
									{playgroundLastResponse.text}
								</div>
								<div className="playground-timestamp">
									{new Date(
										playgroundLastResponse.timestamp,
									).toLocaleTimeString()}
								</div>
							</div>
						)}
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
