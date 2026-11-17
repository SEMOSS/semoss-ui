import { useRef, useState } from "react";
import type { MCPConfig } from "@semoss/shared";
import { Dialog, DialogContent } from "@semoss/ui/next";
import type { AgentChoice, AgentOverlaySave, AgentRef } from "./agent-choice";
import { MCPOverlayPicker, type MCPOverlayTab } from "./mcp-overlay-picker";

/** Props for {@link MCPOverlay}. */
interface MCPOverlayProps {
	/** Whether the dialog is open. */
	open: boolean;

	/** Which tab is active when the overlay opens. */
	defaultTab: MCPOverlayTab;

	/** The room's own MCPs (any types). The overlay splits these into the two tabs. */
	values: MCPConfig[];

	/** The agent the room runs, if any, which the Agent tab starts on. */
	workspace?: AgentRef | null;

	/**
	 * The tools and knowledge `workspace` brings. Listed beside the room's own,
	 * where they cannot be removed; picking another agent lists its tools.
	 */
	agentTools: readonly MCPConfig[];

	/** How the chat offers its agent; a `fixed` agent has no Agent tab. */
	agent: AgentChoice;

	/** Keeps selections visible but read-only while the conversation is busy. */
	disabled?: boolean;

	/**
	 * Fired when the overlay closes. Receives the next draft state when the
	 * user saves, or `undefined` when they cancel.
	 */
	onClose: (next?: AgentOverlaySave) => void;
}

/**
 * The dialog that picks a room's agent, knowledge, and toolboxes. Each open
 * starts a fresh picker on the props it opened with, so edits made to them
 * while it is open do not discard the user's, and a cancelled draft is gone
 * when it opens again. Knowledge can also be created here.
 */
export const MCPOverlay = ({
	open,
	defaultTab,
	values,
	workspace,
	agentTools,
	agent,
	disabled = false,
	onClose,
}: MCPOverlayProps) => {
	// Every open is a session of its own; the picker is keyed on it. Kept as
	// state from the last render, so it holds through the closing animation.
	const [session, setSession] = useState({ open, id: 0 });
	if (open !== session.open) {
		setSession({ open, id: open ? session.id + 1 : session.id });
	}
	const [isCreating, setIsCreating] = useState(false);
	// The element focused before the dialog opened, focused again on close.
	const returnFocus = useRef<HTMLElement | null>(null);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				// Don't let the user dismiss while a create is in-flight; the
				// pixel calls can't be cancelled and the draft state would
				// be lost.
				if (!next && !isCreating) {
					onClose();
				}
			}}
		>
			<DialogContent
				className="flex h-160 max-h-dvh w-full flex-col gap-4 sm:max-w-4xl"
				showCloseButton={!isCreating}
				onEscapeKeyDown={(event) => {
					if (isCreating) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isCreating) event.preventDefault();
				}}
				onOpenAutoFocus={(e) => {
					returnFocus.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
					e.preventDefault();
					(e.currentTarget as HTMLElement)
						.querySelector<HTMLElement>("input")
						?.focus();
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocus.current?.isConnected) {
						event.preventDefault();
						returnFocus.current.focus();
					}
				}}
			>
				<MCPOverlayPicker
					key={session.id}
					defaultTab={defaultTab}
					values={values}
					workspace={workspace ?? null}
					agentTools={agentTools}
					agent={agent}
					disabled={disabled}
					isCreating={isCreating}
					onCreatingChange={setIsCreating}
					onClose={onClose}
				/>
			</DialogContent>
		</Dialog>
	);
};
