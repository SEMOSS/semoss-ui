// ─── Events sent from React → Java backend ───────────────────────────────────

export interface BrowserSelector {
	strategy: string;
	value: string;
	frameSelector?: string | null;
}

export interface BrowserTabInfo {
	tabId: string;
	title: string;
	url: string;
}

type ReplayMetadata = {
	requestId?: string;
	waitAfterMs?: number;
	selector?: BrowserSelector;
	recordedViewportWidth?: number;
	recordedViewportHeight?: number;
	replayTriggerTabId?: string;
};

export type ClientToServerEvent =
	| ({
			type: "mouse-click";
			x: number;
			y: number;
			button: "left" | "right" | "middle";
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "mouse-move";
			x: number;
			y: number;
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "mouse-down";
			x: number;
			y: number;
			button: "left" | "right" | "middle";
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "mouse-up";
			x: number;
			y: number;
			button: "left" | "right" | "middle";
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "wheel";
			x: number;
			y: number;
			deltaX: number;
			deltaY: number;
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "type-text";
			text: string;
			x?: number;
			y?: number;
			record?: boolean;
	  } & ReplayMetadata)
	| ({
			type: "key";
			key: string;
			code?: string;
			modifiers?: {
				alt?: boolean;
				ctrl?: boolean;
				meta?: boolean;
				shift?: boolean;
			};
			record?: boolean;
	  } & ReplayMetadata)
	| ({ type: "navigate"; url: string; record?: boolean } & ReplayMetadata)
	| ({ type: "navigate-back"; record?: boolean } & ReplayMetadata)
	| ({ type: "navigate-forward"; record?: boolean } & ReplayMetadata)
	| ({ type: "reload"; record?: boolean } & ReplayMetadata)
	| { type: "recording-control"; recording: boolean; discard?: boolean }
	| { type: "recording"; recording: boolean; discard?: boolean }
	| {
			type: "selected-text-context";
			requestId: string;
			x: number;
			y: number;
			endX: number;
			endY: number;
	  }
	| { type: "switch-tab"; targetTabId: string; requestId?: string }
	| { type: "switch-replay-tab"; targetTabId: string; requestId?: string }
	| { type: "prepare-replay"; requestId?: string; reuseActiveTab?: boolean }
	| { type: "close-tab"; targetTabId: string; requestId?: string }
	| { type: "close-session" };

// ─── Events sent from Java backend → React ───────────────────────────────────

export type ServerToClientEvent =
	| {
			type: "frame";
			data: string; // base64 JPEG
			metadata: {
				width: number;
				height: number;
				pageScaleFactor?: number;
			};
	  }
	| { type: "loading"; isLoading: boolean }
	| { type: "navigated"; url: string; tabId?: string }
	| { type: "tab-opened"; tabId: string; title: string; url: string }
	| { type: "tab-activated"; tabId: string }
	| { type: "tabs-state"; activeTabId: string; tabs: BrowserTabInfo[] }
	| {
			type: "tab-control-result";
			requestId: string;
			success: boolean;
			activeTabId?: string;
			error?: string;
	  }
	| {
			type: "replay-step-result";
			requestId: string;
			success: boolean;
			url?: string;
			error?: string;
	  }
	| {
			type: "selected-text-context-result";
			requestId: string;
			success: boolean;
			context?: SelectedTextContext;
			error?: string;
	  }
	| { type: "error"; message: string };

export interface SelectionBounds {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

export interface SelectedTextContext {
	version: string;
	kind: "selected-text";
	id: string;
	label?: string;
	capturedAt: number;
	url: string;
	title: string;
	throughStepId: number;
	extractionMethod: "dom-range" | "dom-rectangle";
	bounds: SelectionBounds;
	content: string;
	edited: boolean;
	sources: Array<Record<string, unknown>>;
	text: string;
	stats: {
		characterCount: number;
		fragmentCount: number;
		scannedTextNodes: number;
		truncated: boolean;
	};
}

// ─── Session info returned by the REST API ───────────────────────────────────

export interface RemoteBrowserSessionInfo {
	sessionId: string;
	webSocketUrl: string;
	viewport: { width: number; height: number };
	currentUrl?: string;
}

export interface SaveRecordingRequest {
	project: string;
	name: string;
	title?: string;
	description?: string;
	intent?: string;
}

export interface SaveRecordingResponse {
	saved: boolean;
	project: string;
	fileName: string;
	filePath: string;
}

export interface RecordingMeta {
	id?: string;
	title?: string;
	description?: string;
	createdAt?: number;
	updatedAt?: number;
	intent?: string;
	requestedStartUrl?: string;
	searchTerms?: string[];
	source?: string;
}

export interface RecordingProjectOption {
	label: string;
	value: string;
	project_id?: string;
	project_name?: string;
}

export interface LoadedRecordingStep {
	id?: number;
	type?: string;
	shouldRun?: boolean;
	required?: boolean;
	[key: string]: unknown;
}

export interface LoadedRecording {
	version?: string;
	meta?: Record<string, unknown>;
	steps: Record<string, LoadedRecordingStep[] | LoadedRecordingStep[][]>;
}

export interface StepsEnvelope {
	version: string;
	meta?: RecordingMeta;
	steps: Record<string, LoadedRecordingStep[] | LoadedRecordingStep[][]>;
}

export interface RoomRecordingSaveResponse {
	saved: boolean;
	fileName: string;
	roomPath: string;
}

export interface McpToolContext {
	type: string;
	id: string;
	name: string;
	originalName: string;
	message: string;
	roomId: string;
	/** SMSS_PROJECT_ID from the tool’s _meta — the playwright app project ID for the sidebar URL. */
	projectId: string;
	parameters: Record<string, unknown>;
	toolResponse?: unknown;
	executedParameters?: Record<string, unknown>;
}

export interface ReplayStepResult {
	success: boolean;
	shouldStop?: boolean;
	isNewTab?: boolean;
	newTabId?: string;
	tabTitle?: string;
	error?: string;
}

export interface RemoteBrowserRecordedStep {
	type?: string;
	url?: string;
	selector?: string;
	text?: string;
	role?: string;
	coordinates?: { x: number; y: number };
	viewport?: { width: number; height: number; deviceScaleFactor?: number };
	timestamp?: number;
}

// ─── Connection state ────────────────────────────────────────────────────────

export type ConnectionState =
	| "idle"
	| "connecting"
	| "connected"
	| "error"
	| "closed";
