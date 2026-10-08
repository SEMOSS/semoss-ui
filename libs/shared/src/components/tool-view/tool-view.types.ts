import type { ComponentType, LazyExoticComponent } from "react";

/** Where a call is: waiting for the user, running, or done. */
export type ToolViewCallStatus =
	| "pending"
	| "running"
	| "succeeded"
	| "failed"
	| "declined";

/** The call a tool view shows. */
export interface ToolViewCall {
	/** The call's id. */
	id: string;
	/** What the call runs, such as `GoogleGmailSendMail`. */
	functionName: string;
	/** The arguments it runs with: the model's, or what the user changed them to. */
	arguments: Readonly<Record<string, unknown>>;
	/**
	 * What the call returned, as the tool answered it, which is usually JSON
	 * text. Only there once it ran.
	 */
	result?: string;
	/** Where the call is. */
	status: ToolViewCallStatus;
}

/**
 * What the user did in place of the call. It resolves the call without
 * running it, so the conversation continues from what really happened.
 */
export interface ToolCallOutcome {
	/** A short name for it, such as `savedAsDraft`. */
	userAction: string;
	/**
	 * A sentence the model reads, such as `The user saved this email as a
	 * draft instead of sending it.`
	 */
	summary: string;
	/** What the operation the user ran instead returned. */
	result?: unknown;
}

/** An item a tool view saved into the host's files. */
export interface ToolViewSavedFile {
	/** Where it is, relative to the host's files, as a message's `media` takes it. */
	path: string;
	/** Its name in the host's files. */
	name: string;
	/** The app it came from, such as `gmail`, so the host can show its logo. */
	source?: string;
}

/** What the host offers a tool view besides deciding its call. */
export interface ToolViewHost {
	/** What the host calls its files, such as `Chat files`. */
	saveTargetName?: string;
	/** Called once the view saved an item into the host's files. */
	onSaved?: (file: ToolViewSavedFile) => void;
	/** Adds a saved item to the conversation. Views only offer it when given. */
	onAddToContext?: (file: ToolViewSavedFile) => void;
	/**
	 * Starts signing in to the account the view reads. It runs inside a click,
	 * so it opens its window before its first await, and resolves to whether
	 * the account is connected afterwards.
	 */
	onSignIn?: () => Promise<boolean>;
}

/** `approval` while the call waits for the user's decision, `result` otherwise. */
export type ToolViewMode = "approval" | "result";

/** What every `component://` view receives. */
export interface ToolViewProps {
	/** The call the view shows. */
	call: ToolViewCall;
	/**
	 * The query parameters of the view's URI, such as `intent` and
	 * `provider`. They configure the view and never carry the call's data.
	 */
	params: Readonly<Record<string, string>>;
	/** Whether the call waits for the user's decision. */
	mode: ToolViewMode;
	/**
	 * Runs the call. Given edited arguments, it runs with those in place of
	 * the model's.
	 */
	onApprove: (editedArguments?: Record<string, unknown>) => Promise<void>;
	/** Declines the call; it does not run. */
	onDecline: () => Promise<void>;
	/**
	 * Resolves the call with what the user did instead, such as saving a draft
	 * in place of sending, without running it.
	 */
	onRespond: (outcome: ToolCallOutcome) => Promise<void>;
	/** What the host offers besides deciding the call. */
	host: ToolViewHost;
}

/** A tool view, loaded with the page or when first shown. */
export type ToolViewComponent =
	| ComponentType<ToolViewProps>
	| LazyExoticComponent<ComponentType<ToolViewProps>>;

/** One library's views by name: the `<view>` of `component://<library>/<view>`. */
export type ToolViewLibrary = Readonly<Record<string, ToolViewComponent>>;

/** The libraries a host renders by name: the `<library>` of `component://<library>/<view>`. */
export type ToolViewLibraries = Readonly<Record<string, ToolViewLibrary>>;
