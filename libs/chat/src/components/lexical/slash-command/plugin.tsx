import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useChat } from "../../../host/chat.context";
import { MentionPlugin } from "../mention-plugin";
import { useSlashCommands } from "./context";
import { filterSlashCommands, SlashCommandMenu } from "./menu";
import type { SlashCommand } from "./types";

let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

/** The menu's width in px; matches its `w-72`. */
const MENU_WIDTH = 288;

/** The menu's smallest distance from the window's edge, in px. */
const MENU_GUTTER = 8;

/**
 * The room the menu needs below the caret, in px (its `max-h-80` list plus
 * margin); with less, it opens above.
 */
const MENU_FLIP_HEIGHT = 340;

/**
 * Renders the slash command menu into a portal and closes it when the user
 * clicks outside — without blocking the click from reaching its target.
 */
const MenuPortal: React.FC<{
	menuPosition: { top: number; bottom: number; left: number };
	onClose: () => void;
	children: React.ReactNode;
}> = ({ menuPosition, onClose, children }) => {
	const ref = useRef<HTMLDivElement>(null);
	// Stable ref so the effect never needs to re-register
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const handler = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) {
				onCloseRef.current();
			}
		};
		// pointerdown fires before Radix's own pointerdown handler and before
		// the browser can suppress mousedown (which Radix does via preventDefault).
		// Capture phase ensures we run before any stopPropagation in the tree.
		document.addEventListener("pointerdown", handler, true);
		return () => document.removeEventListener("pointerdown", handler, true);
	}, []);

	// keep the whole menu on screen when the caret is near the right edge
	const left = Math.max(
		MENU_GUTTER,
		Math.min(
			menuPosition.left,
			window.innerWidth - MENU_WIDTH - MENU_GUTTER,
		),
	);

	return createPortal(
		<div
			ref={ref}
			style={{
				position: "fixed",
				...(window.innerHeight - menuPosition.bottom < MENU_FLIP_HEIGHT
					? { bottom: window.innerHeight - menuPosition.top + 4 }
					: { top: menuPosition.bottom + 4 }),
				left,
				zIndex: 50,
			}}
			className="w-72 overflow-hidden rounded-md border border-border bg-popover shadow-md"
		>
			{children}
		</div>,
		document.body,
	);
};

/**
 * Wires MentionPlugin to the slash command system. Must be rendered inside a
 * LexicalComposer wrapped by SlashCommandProvider so it can read the current
 * command list from context via useSlashCommands().
 */
export const SlashCommandPlugin: React.FC<{
	isLoading?: boolean;
	hasTools?: boolean;
}> = ({ isLoading, hasTools }) => {
	const { config } = useChat();
	const { commands } = useSlashCommands();
	const isBusy = Boolean(isLoading || hasTools);

	if (config.featureFlags?.hideToolsInIframe && isIframed) return null;

	/**
	 * Runs a picked command, unless it is locked while busy.
	 *
	 * @return Whether it ran.
	 */
	const runCommand = (cmd: SlashCommand): boolean => {
		if (cmd.isLockedWhileBusy && isBusy) return false;
		cmd.onExecute();
		return true;
	};

	return (
		<MentionPlugin
			trigger="/"
			onAccept={(query, selectedIndex) => {
				const filtered = filterSlashCommands(commands, query);
				const match = filtered[selectedIndex] ?? filtered[0];
				if (match) runCommand(match);
			}}
			onTabComplete={(query, selectedIndex) => {
				const filtered = filterSlashCommands(commands, query);
				const match = filtered[selectedIndex] ?? filtered[0];
				return match?.id;
			}}
			MenuComponent={({
				isOpen,
				onOpenChange,
				menuPosition,
				onRequestClose,
				query,
				selectedIndex,
				setItemCount,
				setSelectedIndex,
			}) =>
				isOpen && menuPosition ? (
					<MenuPortal
						menuPosition={menuPosition}
						onClose={() => onOpenChange(false)}
					>
						<SlashCommandMenu
							query={query}
							selectedIndex={selectedIndex}
							setItemCount={setItemCount}
							setSelectedIndex={setSelectedIndex}
							isBusy={isBusy}
							onCommandSelect={(cmd) => {
								if (runCommand(cmd)) onRequestClose();
							}}
						/>
					</MenuPortal>
				) : null
			}
		/>
	);
};
