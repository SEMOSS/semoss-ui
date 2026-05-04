/**
 * Type definitions for the browser recording system
 * Based on Playwright JSON format for seamless integration with existing executor
 */

/**
 * Selector strategy types supported by the recorder
 */
export type SelectorStrategy =
	| "css"
	| "xpath"
	| "text"
	| "aria"
	| "data-testid";

/**
 * Array of selectors ordered by priority for self-healing playback
 * First selector is the primary, subsequent selectors are fallbacks
 */
export type SelectorArray = string[];

/**
 * Action types that can be recorded
 * Maps to Playwright script step types (must match backend PlaywrightStepType enum)
 */
export type RecordedActionType =
	| "CLICK"
	| "DBLCLICK"
	| "TYPE"
	| "NAVIGATE"
	| "SCROLL"
	| "WAIT"
	| "HOVER"
	| "SELECT"
	| "CHECK"
	| "UNCHECK"
	| "KEYPRESS";

/**
 * DOM event types that trigger recording
 */
export type DOMEventType =
	| "click"
	| "dblclick"
	| "change"
	| "keyup"
	| "blur"
	| "select"
	| "submit"
	| "load"
	| "unload";

/**
 * Parameter for a recorded action
 * Includes type metadata for proper serialization/deserialization
 */
export interface ActionParameter {
	name: string;
	value: string | number | boolean | object | null;
	type: "selector" | "string" | "number" | "boolean" | "object";
}

/**
 * A single recorded action matching Playwright JSON format
 */
export interface RecordedAction {
	/** Action type (CLICK, TYPE, NAVIGATE, etc.) */
	type: RecordedActionType;

	/** Array of selectors ordered by priority (first is primary) */
	selector?: SelectorArray;

	/** Value for TYPE actions or selected option for SELECT actions */
	text?: string;

	/** URL for NAVIGATE actions */
	url?: string;

	/** Click coordinates relative to viewport */
	coords?: {
		x: number;
		y: number;
	};

	/** Scroll delta Y for SCROLL actions */
	deltaY?: number;

	/** Wait time after action in milliseconds */
	waitAfterMs?: number;

	/** Optional user comment/annotation */
	comment?: string;

	/** Timestamp when action was recorded */
	timestamp?: number;

	/** Tab ID where action occurred */
	tabId?: number;

	/** Structured parameters for action */
	parameters?: ActionParameter[];

	/** Original DOM event data */
	eventData?: {
		tagName: string;
		eventType: DOMEventType;
		eventTypeAttr?: string; // Input type (text, password, etc.) or element type
		keyCode?: number;
		href?: string;
		checked?: boolean;
	};
}

/**
 * Event message sent from content script to background
 * Captures raw DOM event data before conversion to RecordedAction
 */
export interface EventMessage {
	/** Generated selectors for the target element */
	selector: SelectorArray;

	/** Extracted value from the element */
	value: string | boolean | string[];

	/** Element tag name (INPUT, BUTTON, SELECT, etc.) */
	tagName: string;

	/** DOM event type that triggered capture */
	action: DOMEventType;

	/** Key code for keyboard events */
	keyCode?: number;

	/** Detected input type (button, text, checkbox, etc.) */
	eventTypeAttr?: string;

	/** href attribute for links */
	href?: string;

	/** checked state for checkboxes/radios */
	checked?: boolean;

	/** Event timestamp for deduplication */
	timeStamp: number;

	/** Click coordinates */
	clientX?: number;
	clientY?: number;

	/** Current page URL */
	url?: string;
}

/**
 * Recording state managed by background worker
 */
export interface RecorderState {
	/** Whether recording is currently active */
	isRecording: boolean;

	/** Whether recording is paused */
	isPaused: boolean;

	/** Whether recording has been stopped (ready for download) */
	isStopped: boolean;

	/** List of all recorded actions */
	actionsList: RecordedAction[];

	/** Counter for action badge display */
	actionCounter: number;

	/** Name/title for the recording */
	recordingName?: string;

	/** Recording start timestamp */
	startedAt?: number;

	/** Current tab ID being recorded */
	currentTabId?: number;
}

/**
 * Message types for extension communication
 */
export enum MessageType {
	// Recording control messages
	START_RECORDING = "START_RECORDING",
	STOP_RECORDING = "STOP_RECORDING",
	PAUSE_RECORDING = "PAUSE_RECORDING",
	RESUME_RECORDING = "RESUME_RECORDING",

	// Event capture messages
	EVENT = "EVENT",
	NAVIGATION = "NAVIGATION",

	// State sync messages
	STATE_UPDATE = "STATE_UPDATE",
	ACTION_RECORDED = "ACTION_RECORDED",

	// Export/import messages
	DOWNLOAD_SCRIPT = "DOWNLOAD_SCRIPT",
	IMPORT_SCRIPT = "IMPORT_SCRIPT",

	// UI messages
	GET_STATE = "GET_STATE",
	UPDATE_ACTION = "UPDATE_ACTION",
	DELETE_ACTION = "DELETE_ACTION",
}

/**
 * Chrome message structure for extension communication
 */
export interface ChromeMessage {
	type: MessageType;
	state?: RecorderState;
	data?: unknown;
	tabId?: number;
	timestamp?: number;
}

/**
 * Storage keys for Chrome storage API
 */
export enum StorageKey {
	IS_RECORDING = "isRecording",
	IS_PAUSED = "isPaused",
	IS_STOPPED = "isStopped",
	ACTIONS_LIST = "actionsList",
	ACTION_COUNTER = "actionCounter",
	RECORDING_NAME = "recordingName",
	STARTED_AT = "startedAt",
	CURRENT_TAB_ID = "currentTabId",
}

/**
 * Export format options
 */
export enum ExportFormat {
	PLAYWRIGHT_JSON = "playwright-json",
	EXCEL = "excel",
	BOTH = "both",
}

/**
 * Element type detection result
 */
export interface ElementType {
	type:
		| "button"
		| "link"
		| "input"
		| "select"
		| "checkbox"
		| "radio"
		| "textarea"
		| "other";
	role?: string;
	ariaLabel?: string;
}
