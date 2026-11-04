import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MentionPlugin } from "@/components";
import { useRoot } from "@/hooks";
import { useSlashCommands } from "./context";
import { filterSlashCommands, RoomInputMenuSlash } from "./menu";
import { $createSlashCommandNode } from "./node";

// ============================================================================
// isIframed
// ============================================================================

let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

// ============================================================================
// MenuPortal
// ============================================================================

/** The menu's width (w-72) and its smallest distance from the window's edge. */
const MENU_WIDTH = 288;
const MENU_GUTTER = 8;

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
				...(window.innerHeight - menuPosition.bottom < 340
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

// ============================================================================
// SlashMentionPlugin
// ============================================================================

/**
 * Wires MentionPlugin to the slash command system. Must be rendered inside a
 * LexicalComposer wrapped by SlashCommandProvider so it can read the current
 * command list from context via useSlashCommands().
 */
export const SlashMentionPlugin: React.FC<{
	disabled?: boolean;
	isLoading?: boolean;
	hasTools?: boolean;
}> = ({ disabled, isLoading, hasTools }) => {
	const { root } = useRoot();
	const { commands } = useSlashCommands();

	if (disabled || (root.theme.featureFlags?.hideToolsInIframe && isIframed))
		return null;

	return (
		<MentionPlugin
			trigger="/"
			onAccept={(query, selectedIndex, addNode) => {
				const filtered = filterSlashCommands(commands, query);
				const match = filtered[selectedIndex] ?? filtered[0];
				if (!match) return;
				if (match.disableWithTools && (isLoading || hasTools)) return;
				if (!match.noChip) {
					addNode(() =>
						$createSlashCommandNode(match.id, match.label),
					);
				}
				match.onExecute();
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
				addNode,
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
						<RoomInputMenuSlash
							query={query}
							selectedIndex={selectedIndex}
							setItemCount={setItemCount}
							setSelectedIndex={setSelectedIndex}
							onRequestClose={onRequestClose}
							isLoading={isLoading}
							hasTools={hasTools}
							onCommandSelect={(cmd) => {
								if (
									cmd.disableWithTools &&
									(isLoading || hasTools)
								)
									return;
								if (cmd.noChip) {
									cmd.onExecute();
									onRequestClose();
								} else {
									addNode(() =>
										$createSlashCommandNode(
											cmd.id,
											cmd.label,
										),
									);
									cmd.onExecute();
								}
							}}
						/>
					</MenuPortal>
				) : null
			}
		/>
	);
};
