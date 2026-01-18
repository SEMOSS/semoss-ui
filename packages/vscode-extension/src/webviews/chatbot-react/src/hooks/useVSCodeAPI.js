import { useCallback, useEffect, useRef } from "react";

// Singleton to store the VS Code API instance
let vscodeApiInstance = null;

/**
 * Get or create the VS Code API instance (singleton pattern)
 */
const getVSCodeAPI = () => {
	if (!vscodeApiInstance) {
		// First, try to use the pre-acquired API from HTML
		if (typeof window !== "undefined" && window.vscode) {
			vscodeApiInstance = window.vscode;
			console.log("Using pre-acquired VS Code API");
		}
		// Fallback: try to acquire it ourselves
		else if (typeof window !== "undefined" && window.acquireVsCodeApi) {
			try {
				vscodeApiInstance = window.acquireVsCodeApi();
				console.log("VS Code API acquired in hook");
			} catch (error) {
				console.warn(
					"VS Code API already acquired or not available:",
					error.message,
				);
			}
		}
	}
	return vscodeApiInstance;
};

/**
 * Custom hook for VS Code API integration
 * Provides the same functionality as the original acquireVsCodeApi()
 * Uses singleton pattern to prevent "already acquired" errors
 */
export const useVSCodeAPI = () => {
	const vscode = useRef(null);

	useEffect(() => {
		vscode.current = getVSCodeAPI();
	}, []);

	const postMessage = useCallback((message) => {
		if (vscode.current) {
			vscode.current.postMessage(message);
		} else {
			console.warn("VS Code API not available");
		}
	}, []);

	const setState = useCallback((state) => {
		if (vscode.current) {
			vscode.current.setState(state);
		}
	}, []);

	const getState = useCallback(() => {
		return vscode.current ? vscode.current.getState() : null;
	}, []);

	return {
		postMessage,
		setState,
		getState,
		isAvailable: !!vscode.current,
	};
};
