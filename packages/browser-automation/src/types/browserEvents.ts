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

export interface BrowserScrollMetrics {
	scrollTop: number;
	scrollHeight: number;
	viewportHeight: number;
}

type ReplayMetadata = {
	requestId?: string;
	stepId?: number;
	waitAfterMs?: number;
	selector?: BrowserSelector;
	expectedUrl?: string;
	expectedTabId?: string;
	recordedViewportWidth?: number;
	recordedViewportHeight?: number;
	replayTriggerTabId?: string;
	downloadExpected?: boolean;
};

export type ClientToServerEvent =
	| ({
			type: "mouse-click";
			x: number;
			y: number;
			button: "left" | "right" | "middle";
			label?: string;
			tag?: string;
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
			/** Atomically fills an editable element or selects a dropdown option. */
			type: "fill-element";
			text: string;
			selector: BrowserSelector;
			label?: string;
			tag?: string;
			isPassword?: boolean;
			storeValue?: boolean;
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
	| {
			type: "recording-control";
			recording: boolean;
			discard?: boolean;
			requestId?: string;
	  }
	| { type: "recording"; recording: boolean; discard?: boolean }
	| {
			type: "selected-text-context";
			requestId: string;
			x: number;
			y: number;
			endX: number;
			endY: number;
			expectedTabId?: string;
			record?: boolean;
			label?: string;
	  }
	| {
			type: "full-page-text-context";
			requestId: string;
			expectedTabId?: string;
	  }
	| { type: "switch-tab"; targetTabId: string; requestId?: string }
	| { type: "switch-replay-tab"; targetTabId: string; requestId?: string }
	| { type: "new-tab"; targetTabId?: string; requestId?: string }
	| { type: "prepare-replay"; requestId?: string; reuseActiveTab?: boolean }
	| { type: "close-tab"; targetTabId: string; requestId?: string }
	| {
			type: "debug-control";
			requestId: string;
			debugEnabled?: boolean;
			clear?: boolean;
	  }
	| { type: "close-session" };

export interface ReplaySocketResult {
	type: "replay-step-result";
	requestId: string;
	success: boolean;
	url?: string;
	error?: string;
	downloadWaitTimedOut?: boolean;
	downloadWaitError?: string;
}

// ─── Events sent from Java backend → React ───────────────────────────────────

export type ServerToClientEvent =
	| {
			type: "frame";
			data: string; // base64 JPEG
			metadata: {
				width: number;
				height: number;
				pageScaleFactor?: number;
				scrollTop?: number;
				scrollHeight?: number;
				viewportHeight?: number;
			};
	  }
	| { type: "loading"; isLoading: boolean }
	| { type: "navigated"; url: string; tabId?: string }
	| { type: "tab-opened"; tabId: string; title: string; url: string }
	| { type: "tab-activated"; tabId: string }
	| { type: "tabs-state"; activeTabId: string; tabs: BrowserTabInfo[] }
	| { type: "cursor-changed"; cursor: string }
	| {
			type: "tab-control-result";
			requestId: string;
			success: boolean;
			activeTabId?: string;
			error?: string;
	  }
	| {
			type: "recording-control-result";
			requestId: string;
			success: boolean;
			error?: string;
	  }
	| ReplaySocketResult
	| {
			type: "selected-text-context-result";
			requestId: string;
			success: boolean;
			context?: SelectedTextContext;
			error?: string;
	  }
	| {
			type: "full-page-text-context-result";
			requestId: string;
			success: boolean;
			context?: SelectedTextContext;
			error?: string;
	  }
	| { type: "download-ready"; download: BrowserDownload }
	| {
			type: "debug-control-result";
			requestId: string;
			success: boolean;
			enabled: boolean;
			error?: string;
	  }
	| {
			type: "debug-events";
			events: BrowserDebugEvent[];
			droppedCount?: number;
	  }
	| { type: "error"; message: string };

export interface BrowserNetworkDebugEvent {
	id: string;
	kind: "network";
	phase: "request" | "response" | "failed";
	requestId: string;
	timestamp: number;
	tabId: string;
	method: string;
	url: string;
	resourceType: string;
	status?: number;
	statusText?: string;
	durationMs?: number;
	error?: string;
}

export interface BrowserConsoleDebugEvent {
	id: string;
	kind: "console";
	timestamp: number;
	tabId: string;
	level: string;
	message: string;
	source?: string;
}

export interface BrowserPageErrorDebugEvent {
	id: string;
	kind: "page-error";
	timestamp: number;
	tabId: string;
	level: "error";
	message: string;
}

export type BrowserDebugEvent =
	| BrowserNetworkDebugEvent
	| BrowserConsoleDebugEvent
	| BrowserPageErrorDebugEvent;

export type BrowserDownloadStatus =
	| "downloading"
	| "ready"
	| "saved"
	| "failed"
	| "save-failed";

export interface BrowserDownload {
	downloadId: string;
	runId: string;
	order: number;
	fileName: string;
	originalFileName?: string;
	status: BrowserDownloadStatus;
	sourceUrl?: string;
	pageUrl?: string;
	tabId?: string;
	triggerRequestId?: string;
	triggerStepId?: number;
	startedAt?: string;
	completedAt?: string;
	downloadedAt?: string;
	savedAt?: string;
	sizeBytes?: number;
	sha256?: string;
	mimeType?: string;
	insightPath?: string;
	error?: string;
}

export interface DownloadError {
	downloadId?: string;
	runId?: string;
	stepId?: number;
	fileName?: string;
	status?: string;
	error: string;
}

export interface DownloadSaveResponse {
	runId: string;
	downloadSummary?: string;
	downloadCount: number;
	downloads: BrowserDownload[];
	downloadErrors: DownloadError[];
}

export interface SelectionBounds {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
}

export interface SelectedTextContext {
	version: string;
	kind: "selected-text" | "full-page-text";
	id: string;
	label?: string;
	capturedAt: number;
	url: string;
	title: string;
	throughStepId: number;
	extractionMethod:
		| "dom-native-selection"
		| "dom-range"
		| "dom-rectangle"
		| "full-page-dom";
	bounds: SelectionBounds;
	content: string;
	edited: boolean;
	sources: Array<Record<string, unknown>>;
	text: string;
	stats: SelectedTextContextStats;
}

export interface SelectedTextContextStats {
	characterCount: number;
	fragmentCount: number;
	scannedTextNodes: number;
	truncated: boolean;
	// Exact capture accounting; optional so an older backend still loads.
	originalCharacterCount?: number;
	includedCharacterCount?: number;
	omittedCharacterCount?: number;
	limitChars?: number;
	truncationReason?: string;
	scrollCount?: number;
	scrollHeight?: number;
	viewportHeight?: number;
	scrollLimitReached?: boolean;
	returnIncludedCharacterCount?: number;
	returnOmittedCharacterCount?: number;
	returnTruncated?: boolean;
	returnTruncationReason?: string;
}

export interface RemoteBrowserContextLimits {
	selectedCaptureHardLimitChars: number;
	fullPageCaptureHardLimitChars: number;
	maxCapturedContexts: number;
	defaultReturnBudgetChars: number;
	maximumReturnBudgetChars: number;
}

// ─── Session info returned by the REST API ───────────────────────────────────

export interface RemoteBrowserSessionInfo {
	sessionId: string;
	webSocketUrl: string;
	viewport: { width: number; height: number };
	currentUrl?: string;
	contextLimits?: RemoteBrowserContextLimits;
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

export interface GeneratedRecordingMetadata {
	success: boolean;
	title?: string;
	description?: string;
	intent?: string;
	suggestedFileName?: string;
	confidence?: number;
	engineId?: string;
	error?: string;
}

export interface RecordingMetadataModelOption {
	label: string;
	value: string;
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
	downloadExpected?: boolean;
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
	/**
	 * Owning app id from the tool's _meta, preferring SMSS_ENGINE_ID over the
	 * deprecated SMSS_PROJECT_ID. Empty for room scoped tools, which report the
	 * reserved __room__ id instead of a catalog entry.
	 */
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
	downloadSummary?: string;
	downloadCount?: number;
	downloads?: BrowserDownload[];
	downloadErrors?: DownloadError[];
	error?: string;
}

export interface RemoteBrowserRecordedStep {
	type?: string;
	url?: string;
	selector?: string;
	text?: string;
	key?: string;
	deltaY?: number;
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
