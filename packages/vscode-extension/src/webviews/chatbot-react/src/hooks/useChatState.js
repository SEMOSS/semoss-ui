import { useCallback, useEffect, useState } from "react";
import { useVSCodeAPI } from "./useVSCodeAPI";
// Hook: useChatState
// Central chat state container (messages, loading, instance metadata) with
// message passing bridge to VS Code extension (via postMessage). Consolidates
// behavior formerly embedded in class-based implementation.

/**
 * Custom hook for chat state management
 * Replaces the state management from the original SemossChatbot class
 */
export const useChatState = () => {
	const { postMessage } = useVSCodeAPI();

	const [chatState, setChatState] = useState({
		chatStarted: false,
		currentState: "start",
		lastCommand: null,
		chatHistory: [],
		isLoading: false,
		instanceUrls: {},
		currentInstance: null,
		hasSmssFile: false,
		// Internal instance management UI support
		instancesList: [], // [{alias, semossUrl}]
		instancesMode: null, // 'select' | 'remove'
	});

	const addMessage = useCallback(
		(text, from, status = null, saveToHistory = true) => {
			const newMessage = {
				text,
				from,
				status,
				timestamp: Date.now(),
				id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			};

			setChatState((prev) => ({
				...prev,
				chatHistory: [...prev.chatHistory, newMessage],
				chatStarted: true,
			}));

			if (saveToHistory) {
				postMessage({
					type: "saveMessage",
					message: { text, from, timestamp: newMessage.timestamp },
				});
			}
		},
		[postMessage],
	);

	// Special message containing tool buttons (not persisted to history storage for now)
	const addToolsMessage = useCallback((toolsArray) => {
		if (!Array.isArray(toolsArray) || toolsArray.length === 0) return;
		const newMessage = {
			text: "Available actions:",
			from: "bot",
			status: "tools",
			tools: toolsArray,
			timestamp: Date.now(),
			id: `tools_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};
		setChatState((prev) => ({
			...prev,
			chatHistory: [...prev.chatHistory, newMessage],
			chatStarted: true,
		}));
	}, []);

	// Handle messages from VS Code extension
	const handleMessage = useCallback(
		(event) => {
			const message = event.data;

			switch (message.type) {
				case "restoreHistory":
					setChatState((prev) => ({
						...prev,
						chatHistory: message.history || [],
						currentState: message.state || "start",
						chatStarted:
							message.history && message.history.length > 0,
					}));
					break;

				case "response":
					setChatState((prev) => ({
						...prev,
						isLoading: false,
					}));
					// Add response to chat history
					if (message.text) {
						addMessage(message.text, "bot", message.status);
					}
					break;

				case "llmResponse":
					// Handle LLM response
					setChatState((prev) => ({
						...prev,
						isLoading: false,
					}));
					// Replace the "Processing..." message with the actual response
					setChatState((prev) => {
						const updatedHistory = [...prev.chatHistory];
						// Remove the last processing message if it exists
						if (
							updatedHistory.length > 0 &&
							(updatedHistory[updatedHistory.length - 1].text ===
								"Processing your request..." ||
								updatedHistory[updatedHistory.length - 1]
									.text === "Processing your message..." ||
								updatedHistory[updatedHistory.length - 1]
									.status === "processing")
						) {
							updatedHistory.pop();
						}
						return {
							...prev,
							chatHistory: updatedHistory,
						};
					});
					addMessage(message.message, "bot");
					break;

				case "llmError":
					// Handle LLM error
					setChatState((prev) => ({
						...prev,
						isLoading: false,
					}));
					addMessage(message.message, "bot", "error");
					break;

				case "llmProcessing":
					// Handle LLM processing acknowledgment
					setChatState((prev) => ({
						...prev,
						isLoading: true,
					}));
					addMessage(message.message, "bot", "processing");
					break;

				case "progress":
					// Generic progress update from extension (zip/deploy phases)
					addMessage(message.text || message.message, "bot");
					break;

				case "smssFileCheckResult":
					setChatState((prev) => ({
						...prev,
						hasSmssFile: message.hasSmss,
					}));
					break;

				case "instanceAliasesWithUrls":
					setChatState((prev) => ({
						...prev,
						instanceUrls: message.urls || {},
						currentInstance: message.currentInstance,
						isLoading: false,
					}));
					break;

				case "instanceAliasesForRemoval":
					setChatState((prev) => ({
						...prev,
						instanceUrls: message.urls || {},
						currentInstance: message.currentInstance,
						removalAliases: message.aliases || [],
					}));
					break;

				case "instancesList":
					// Generic list for selection/removal from webview UI
					setChatState((prev) => ({
						...prev,
						instancesList: message.instances || [],
						instancesMode: message.mode || null,
						currentInstance:
							message.currentInstance || prev.currentInstance,
						isLoading: false,
					}));
					break;
				case "instanceActionResult": {
					if (message.feedback) addMessage(message.feedback, "bot");
					setChatState((prev) => ({
						...prev,
						currentInstance:
							message.currentInstance ?? prev.currentInstance,
						// keep mode & list if keepMode flag provided (for repeated removals)
						instancesMode: message.keepMode
							? prev.instancesMode
							: null,
						instancesList: message.keepMode
							? message.instances || prev.instancesList
							: [],
						isLoading: false,
					}));
					break;
				}

				default:
					console.warn("Unknown message type:", message.type);
			}
		},
		[addMessage],
	);

	// Setup message listener
	useEffect(() => {
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [handleMessage]);

	// Request history restoration on mount
	useEffect(() => {
		const timer = setTimeout(() => {
			postMessage({ type: "getHistory" });
		}, 100);
		return () => clearTimeout(timer);
	}, [postMessage]);

	// Handle visibility change
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				postMessage({ type: "getHistory" });
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
	}, [postMessage]);

	const clearChat = useCallback(() => {
		setChatState((prev) => ({
			...prev,
			chatHistory: [],
			chatStarted: false,
			currentState: "start",
		}));
		postMessage({ type: "clearHistory" });
	}, [postMessage]);
	const setLoading = useCallback((loading) => {
		setChatState((prev) => ({
			...prev,
			isLoading: loading,
		}));
	}, []);

	const executeCommand = useCallback(
		(command, inputs = null) => {
			setChatState((prev) => ({
				...prev,
				lastCommand: command,
				isLoading: true,
			}));

			postMessage({
				type: "chat",
				command,
				inputs,
			});
		},
		[postMessage],
	);

	const saveState = useCallback(
		(state) => {
			setChatState((prev) => ({
				...prev,
				currentState: state,
			}));
			postMessage({ type: "saveState", state });
		},
		[postMessage],
	);

	return {
		...chatState,
		addMessage,
		addToolsMessage,
		clearChat,
		setLoading,
		executeCommand,
		saveState,
	};
};
