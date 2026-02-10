/// <reference types="chrome"/>

// Global type declarations for the extension
declare module "*.png" {
	const value: string;
	export default value;
}

declare module "*.jpg" {
	const value: string;
	export default value;
}

declare module "*.svg" {
	const value: string;
	export default value;
}

// Chrome Side Panel API type definitions (Chrome 114+)
declare namespace chrome.sidePanel {
	interface OpenOptions {
		tabId?: number;
		windowId?: number;
	}

	function open(options: OpenOptions): Promise<void>;
	function setOptions(options: {
		enabled?: boolean;
		path?: string;
		tabId?: number;
	}): Promise<void>;
	function getOptions(options: {
		tabId?: number;
	}): Promise<{ enabled: boolean; path: string }>;
}
