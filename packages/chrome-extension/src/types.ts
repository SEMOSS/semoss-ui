// Type definitions for the extension

export interface WorkshopConfig {
	endpoint: string;
}

export interface ActionHistory {
	thought: string;
	action: string;
	timestamp: number;
	success: boolean;
}

export interface ExtensionState {
	isRunning: boolean;
	taskInstructions: string;
	actionHistory: ActionHistory[];
	currentTabId: number | null;
	workshopConfig: WorkshopConfig | null;
}

export interface DOMElement {
	id: number;
	tagName: string;
	text?: string;
	attributes: Record<string, string>;
	isInteractive: boolean;
	isVisible: boolean;
}

export interface SimplifiedDOM {
	html: string;
	elements: DOMElement[];
}

export interface LLMResponse {
	thought: string;
	action: string;
	complete: boolean;
}

export interface MessagePayload {
	type: string;
	data?: unknown;
}
