/**
 * Recording State Manager
 * Manages Chrome storage operations and provides React hooks for recording state
 */

import { useCallback, useEffect, useState } from "react";
import type {
	ChromeMessage,
	RecordedAction,
	RecorderState,
} from "../recorder/types";

/**
 * React hook to access and manage recording state
 * Automatically syncs with Chrome storage and listens for updates from background
 */
export function useRecordingState() {
	const [state, setState] = useState<RecorderState>({
		isRecording: false,
		isPaused: false,
		isStopped: false,
		actionsList: [],
		actionCounter: 0,
	});

	const [isLoading, setIsLoading] = useState(true);

	const loadState = useCallback(async () => {
		try {
			// Always clear state when panel opens to ensure fresh start

			await chrome.storage.local.set({
				isRecording: false,
				isPaused: false,
				isStopped: false,
				actionsList: [],
				actionCounter: 0,
				startedAt: undefined,
				currentTabId: undefined,
			});

			setState({
				isRecording: false,
				isPaused: false,
				isStopped: false,
				actionsList: [],
				actionCounter: 0,
			});
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to load state:",
				error,
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Load initial state from storage
	useEffect(() => {
		loadState();
	}, [loadState]);

	// Listen for state updates from background
	useEffect(() => {
		const handleMessage = (message: ChromeMessage) => {
			if (message.type === "STATE_UPDATE" && message.state) {
				setState(message.state);
			}
		};

		chrome.runtime.onMessage.addListener(handleMessage);

		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, []);

	const startRecording = useCallback(async () => {
		try {
			// Get current tab
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			// Send start recording message to background
			await chrome.runtime.sendMessage({
				type: "START_RECORDING",
				tabId: tab.id,
			});

			// State will be updated via STATE_UPDATE message from background
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to start recording:",
				error,
			);
			throw error;
		}
	}, []);

	const stopRecording = useCallback(async () => {
		try {
			await chrome.runtime.sendMessage({
				type: "STOP_RECORDING",
			});
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to stop recording:",
				error,
			);
			throw error;
		}
	}, []);

	const pauseRecording = useCallback(async () => {
		try {
			await chrome.runtime.sendMessage({
				type: "PAUSE_RECORDING",
			});
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to pause recording:",
				error,
			);
			throw error;
		}
	}, []);

	const resumeRecording = useCallback(async () => {
		try {
			await chrome.runtime.sendMessage({
				type: "RESUME_RECORDING",
			});
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to resume recording:",
				error,
			);
			throw error;
		}
	}, []);

	const clearRecording = useCallback(async () => {
		try {
			await chrome.storage.local.set({
				isRecording: false,
				isPaused: false,
				isStopped: false,
				actionsList: [],
				actionCounter: 0,
				startedAt: undefined,
				currentTabId: undefined,
			});

			setState({
				isRecording: false,
				isPaused: false,
				isStopped: false,
				actionsList: [],
				actionCounter: 0,
			});
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to clear recording:",
				error,
			);
			throw error;
		}
	}, []);

	const updateAction = useCallback(
		async (index: number, updatedAction: RecordedAction) => {
			try {
				const data = await chrome.storage.local.get(["actionsList"]);
				const actionsList = data.actionsList || [];

				if (index >= 0 && index < actionsList.length) {
					actionsList[index] = updatedAction;
					await chrome.storage.local.set({ actionsList });

					setState((prev) => ({
						...prev,
						actionsList,
					}));
				}
			} catch (error) {
				console.error(
					"[RecordingStateManager] Failed to update action:",
					error,
				);
				throw error;
			}
		},
		[],
	);

	const deleteAction = useCallback(async (index: number) => {
		try {
			const data = await chrome.storage.local.get(["actionsList"]);
			const actionsList = data.actionsList || [];

			if (index >= 0 && index < actionsList.length) {
				actionsList.splice(index, 1);
				await chrome.storage.local.set({ actionsList });

				setState((prev) => ({
					...prev,
					actionsList,
				}));
			}
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to delete action:",
				error,
			);
			throw error;
		}
	}, []);

	return {
		state,
		isLoading,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
		clearRecording,
		updateAction,
		deleteAction,
	};
}

/**
 * React hook to access actions list with real-time updates
 */
export function useActionsList() {
	const [actions, setActions] = useState<RecordedAction[]>([]);

	const loadActions = useCallback(async () => {
		try {
			const data = await chrome.storage.local.get(["actionsList"]);
			setActions(data.actionsList || []);
		} catch (error) {
			console.error(
				"[RecordingStateManager] Failed to load actions:",
				error,
			);
		}
	}, []);

	useEffect(() => {
		// Load initial actions
		loadActions();

		// Listen for updates
		const handleMessage = (message: ChromeMessage) => {
			if (message.type === "STATE_UPDATE" && message.state) {
				setActions(message.state.actionsList || []);
			}
		};

		chrome.runtime.onMessage.addListener(handleMessage);

		return () => {
			chrome.runtime.onMessage.removeListener(handleMessage);
		};
	}, [loadActions]);

	return actions;
}

/**
 * Get recording state once (non-reactive)
 */
export async function getRecordingState(): Promise<RecorderState> {
	try {
		const data = await chrome.storage.local.get([
			"isRecording",
			"isPaused",
			"isStopped",
			"actionsList",
			"actionCounter",
			"startedAt",
			"currentTabId",
		]);

		return {
			isRecording: data.isRecording || false,
			isPaused: data.isPaused || false,
			isStopped: data.isStopped || false,
			actionsList: data.actionsList || [],
			actionCounter: data.actionCounter || 0,
			startedAt: data.startedAt,
			currentTabId: data.currentTabId,
		};
	} catch (error) {
		console.error(
			"[RecordingStateManager] Failed to get recording state:",
			error,
		);
		return {
			isRecording: false,
			isPaused: false,
			isStopped: false,
			actionsList: [],
			actionCounter: 0,
		};
	}
}

/**
 * Save recording name
 */
export async function saveRecordingName(name: string): Promise<void> {
	try {
		await chrome.storage.local.set({ recordingName: name });
	} catch (error) {
		console.error(
			"[RecordingStateManager] Failed to save recording name:",
			error,
		);
		throw error;
	}
}

/**
 * Get recording name
 */
export async function getRecordingName(): Promise<string | undefined> {
	try {
		const data = await chrome.storage.local.get(["recordingName"]);
		return data.recordingName;
	} catch (error) {
		console.error(
			"[RecordingStateManager] Failed to get recording name:",
			error,
		);
		return undefined;
	}
}
