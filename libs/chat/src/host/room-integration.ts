import type { ComponentType, ReactNode } from "react";
import type { RoomEngine, RoomToolCall, ToolCallStore } from "@semoss/sdk";

/** A panel an integration offers on the room Workspace's rail and menu. */
export interface RoomRailPanel {
	/** The panel's blueprint type; the host's `panelComponents` holds it. */
	type: string;
	/** The tab label. */
	name: string;
	/** The menu's icon for it. */
	icon?: ReactNode;
}

/** What a room's integration renders into, beside the room it belongs to. */
export interface RoomIntegrationSlotProps {
	/** The room. */
	room: RoomEngine;
}

/** What an integration renders inside a tool call's card. */
export interface RoomToolCallSlotProps extends RoomIntegrationSlotProps {
	/** The tool call. */
	tool: ToolCallStore;
}

/** How the chat tool card shows a client tool call an integration owns. */
export interface RoomToolCallPresentation {
	/** The card's icon. */
	icon: ReactNode;
	/** What the call runs against, shown under its name, such as "Outlook". */
	source: string;
	/** Shown while the call waits for the user to allow it. */
	approvalNote: string;
	/** A notice under the card, such as a sign in after a failed call. */
	Notice?: ComponentType<RoomToolCallSlotProps>;
}

/**
 * A per-room UI integration, such as the connectors: state the room's UI
 * keeps beside the engine, and the views it adds to the chat. Every member
 * is optional; the room calls only what an integration has.
 */
export interface RoomIntegration {
	/** Which integration this is, as `RoomUiStore.getIntegration` finds it. */
	readonly id: string;
	/**
	 * Take over a draft's state before the draft's first message creates
	 * this room.
	 *
	 * @param draft - The same integration on the new-chat draft.
	 */
	adopt?(draft: RoomIntegration): Promise<void>;
	/**
	 * Read what a new chat's draft offers before it has a room, such as the
	 * user's connectors.
	 */
	prepareDraft?(): Promise<void>;
	/**
	 * Bring the integration up to date with a room just bound to its insight.
	 *
	 * @param options.isNew - Whether the room was only just created.
	 */
	restore?(options: { isNew: boolean }): Promise<void>;
	/**
	 * Listen for changes to what the integration offers: its rail panels,
	 * whether it is busy, its suggestion context.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe?(listener: () => void): () => void;
	/** The panels the Workspace's rail and menu offer for it, now. */
	getRailPanels?(): RoomRailPanel[];
	/**
	 * Whether a panel type is one the integration offers, so the rail can
	 * close a panel it no longer offers.
	 *
	 * @param type - The panel type.
	 * @returns True for one of the integration's panels.
	 */
	ownsPanelType?(type: string): boolean;
	/** Whether it is writing to the room; follow-ups wait until it is not. */
	isBusy?(): boolean;
	/** Context it adds to follow-up suggestion requests. */
	getSuggestionContext?(): Record<string, unknown>;
	/**
	 * An icon for a context item it produced, such as a saved email.
	 *
	 * @param service - The item's source.
	 * @returns The icon, or undefined to show the default.
	 */
	getContextItemIcon?(service: string): ReactNode | undefined;
	/**
	 * Its page in the host's settings, which the room's More actions menu
	 * opens through `ChatHostConfig.onOpenSettings`.
	 */
	settingsPage?: {
		id: string;
		/** The page title's translation key. */
		titleKey: string;
		icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	};
	/**
	 * How a `component://` tool view of the integration's signs in, such as a
	 * mail view whose `provider` parameter names the account. The returned
	 * call runs inside a click, so it opens its window before its first
	 * await, and resolves to whether the account is connected afterwards.
	 *
	 * @param params - The view's URI parameters.
	 * @returns The sign in, or undefined for a view that is not its own.
	 */
	getToolViewSignIn?(
		params: Readonly<Record<string, string>>,
	): (() => Promise<boolean>) | undefined;
	/** A notice above the composer, such as a sign in prompt. */
	ComposerNotice?: ComponentType<RoomIntegrationSlotProps>;
	/** A section in the room's settings panel. */
	SettingsSection?: ComponentType<RoomIntegrationSlotProps>;
	/**
	 * Whether a tool call is one of the integration's, which the chat tool
	 * card shows (`describeToolCall`) instead of the generic tool view.
	 *
	 * @param call - The tool call.
	 * @returns True for one of its calls.
	 */
	ownsToolCall?(call: RoomToolCall): boolean;
	/**
	 * How the chat tool card shows a client tool call the integration owns,
	 * such as a connector's.
	 *
	 * @param call - The tool call.
	 * @param state - Where the call stands.
	 * @returns The card's presentation, or undefined for a call it does not own.
	 */
	describeToolCall?(
		call: RoomToolCall,
		state: { status: string; response: unknown },
	): RoomToolCallPresentation | undefined;
	/** Release whatever it holds when the room is closed. */
	dispose?(): void;
}

/**
 * Makes one room's integration. Called for every room the UI makes,
 * including the new-chat draft.
 *
 * @param room - The room.
 * @returns The integration.
 */
export type RoomIntegrationFactory = (room: RoomEngine) => RoomIntegration;
