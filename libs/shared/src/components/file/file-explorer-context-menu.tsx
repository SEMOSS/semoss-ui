/** biome-ignore-all lint/a11y/useKeyWithClickEvents: custom context menu keyboard handling is managed below */
import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn } from "@semoss/ui/next";
import type {
	FileExplorerApi,
	FileExplorerContextMenuState,
} from "./file-explorer.types";
import { getFileExplorerTestIdSegment } from "./file-explorer.utils";

export interface FileExplorerContextMenuProps {
	explorer: FileExplorerApi;
	/** The open menu — where it is and what it is over. */
	state: FileExplorerContextMenuState;
}

interface MenuEntry {
	key: string;
	label: string;
	disabled?: boolean;
	destructive?: boolean;
	dividerBefore?: boolean;
	action: () => void | Promise<void>;
}

/** Approximate menu box, used only to flip it away from a viewport edge. */
const MENU_WIDTH = 192;
const MENU_ENTRY_HEIGHT = 32;
const MENU_PADDING = 12;

/**
 * The explorer's right-click menu.
 *
 * Hand-rolled rather than a Radix `ContextMenu` because it is opened
 * imperatively from a pointer position the explorer already tracks, over rows
 * that also handle drag and bulk selection. Every entry runs an
 * `explorer.commands.*` call; consumer-supplied `secondaryActions` are appended
 * after the built-ins.
 *
 * Entries are label-only, matching the workbench's own menus and command
 * palette — a consumer-supplied action has no icon to offer anyway, so guessing
 * one from its name only made the built-ins and the extensions look different.
 */
export const FileExplorerContextMenu: React.FC<
	FileExplorerContextMenuProps
> = ({ explorer, state }) => {
	const { t } = useTranslation("common");
	const menuRef = useRef<HTMLDivElement>(null);
	const focusedIndexRef = useRef<number>(-1);

	const { commands, capabilities, tree } = explorer;
	const { item, targetPath, x, y } = state;
	const onClose = tree.closeContextMenu;
	const isOnItem = item !== null;
	const canMutate = capabilities.mutate;

	// right-clicking a row inside the selection acts on the whole selection
	const bulkItems =
		item &&
		tree.selectedItems.some((selected) => selected.path === item.path)
			? tree.selectedItems
			: [];
	const isBulkAction = bulkItems.length > 1;
	const targetItems = isBulkAction ? bulkItems : item ? [item] : [];
	const secondaryActions = state.secondaryActions || [];

	// ── Build menu entries ──────────────────────────────────────────────────

	const entries: MenuEntry[] = [];

	// copying a path is a read operation — every scope gets it, including
	// storage buckets and read-only explorers. Over empty space there is no
	// `item`, so it falls back to `targetPath` — the directory the menu was
	// opened over, already resolved by the caller (`file-explorer.tsx`'s
	// `onContextMenu` passes `ensureDirectoryPath(path)` for that case).
	entries.push({
		key: "copy-path",
		label: t("fileExplorer.contextMenu.copyPath"),
		disabled: isBulkAction,
		action: async () => {
			await commands.copyPath(item ? item.path : targetPath);
			onClose();
		},
	});

	if (isOnItem && canMutate) {
		entries.push({
			key: "copy",
			label: t("fileExplorer.contextMenu.copy"),
			action: () => {
				commands.copy(targetItems);
				onClose();
			},
		});

		entries.push({
			key: "cut",
			label: t("fileExplorer.contextMenu.cut"),
			action: () => {
				commands.cut(targetItems);
				onClose();
			},
		});
	}

	if (canMutate) {
		entries.push({
			key: "paste",
			label: t("fileExplorer.contextMenu.pasteHere"),
			disabled: tree.clipboard === null || isBulkAction,
			dividerBefore: isOnItem,
			action: async () => {
				if (!tree.clipboard) return;
				onClose();
				await commands.paste(targetPath);
			},
		});
	}

	if (isOnItem && canMutate) {
		entries.push({
			key: "rename",
			label: t("fileExplorer.contextMenu.rename"),
			disabled: isBulkAction,
			dividerBefore: true,
			action: () => {
				if (!item) return;
				onClose();
				commands.rename(item);
			},
		});
	}

	if (isOnItem && capabilities.download) {
		entries.push({
			key: "download",
			label: t("fileExplorer.contextMenu.download"),
			action: async () => {
				onClose();
				await commands.download(targetItems);
			},
		});
	}

	const isZip =
		item &&
		item.type !== "directory" &&
		item.path.toLowerCase().endsWith(".zip");

	if (isZip && canMutate && !isBulkAction) {
		entries.push({
			key: "unzip",
			label: t("fileExplorer.contextMenu.unzip"),
			action: async () => {
				if (!item) return;
				onClose();
				await commands.unzip(item);
			},
		});
	}

	if (isOnItem && !isBulkAction) {
		secondaryActions.forEach((secondaryAction) => {
			entries.push({
				key: `secondary-${secondaryAction.name}`,
				label: secondaryAction.name,
				action: async () => {
					if (!item) return;
					onClose();
					await secondaryAction.action(item);
				},
			});
		});
	}

	if (isOnItem && canMutate) {
		entries.push({
			key: "delete",
			label: t("fileExplorer.contextMenu.delete"),
			destructive: true,
			dividerBefore: true,
			action: async () => {
				onClose();
				await commands.remove(targetItems);
			},
		});
	}

	if (canMutate) {
		entries.push({
			key: "new-file",
			label: t("fileExplorer.contextMenu.newFile"),
			disabled: isBulkAction,
			dividerBefore: true,
			action: () => {
				onClose();
				commands.openNewFile(targetPath, "add_file");
			},
		});

		entries.push({
			key: "new-folder",
			label: t("fileExplorer.contextMenu.newFolder"),
			disabled: isBulkAction,
			action: () => {
				onClose();
				commands.openNewFile(targetPath, "add_directory");
			},
		});
	}

	// ── Keyboard navigation ─────────────────────────────────────────────────

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			const buttons =
				menuRef.current?.querySelectorAll<HTMLButtonElement>(
					"button:not([disabled])",
				);
			if (!buttons?.length) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				focusedIndexRef.current = Math.min(
					focusedIndexRef.current + 1,
					buttons.length - 1,
				);
				buttons[focusedIndexRef.current]?.focus();
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				focusedIndexRef.current = Math.max(
					focusedIndexRef.current - 1,
					0,
				);
				buttons[focusedIndexRef.current]?.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	// ── Outside click ───────────────────────────────────────────────────────

	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node)
			) {
				onClose();
			}
		};
		document.addEventListener("pointerdown", handlePointerDown);
		return () =>
			document.removeEventListener("pointerdown", handlePointerDown);
	}, [onClose]);

	// ── Position: flip menu if it would overflow the viewport ──────────────

	const menuHeight = entries.length * MENU_ENTRY_HEIGHT + MENU_PADDING;
	const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
	const vh = typeof window !== "undefined" ? window.innerHeight : 9999;

	const left = x + MENU_WIDTH > vw ? Math.max(0, x - MENU_WIDTH) : x;
	const top = y + menuHeight > vh ? Math.max(0, y - menuHeight) : y;

	if (entries.length === 0) return null;

	return (
		<div
			data-testid="file-explorer-context-menu"
			ref={menuRef}
			role="menu"
			aria-label={t("fileExplorer.contextMenu.ariaLabel")}
			// a pointer position, so it cannot be a utility class
			style={{ left, top }}
			className="fixed z-[9999] min-w-48 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
			onClick={(e) => e.stopPropagation()}
			onContextMenu={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			{entries.map((entry) => (
				<div key={entry.key}>
					{entry.dividerBefore && (
						<hr className="my-1 h-px border-0 bg-border" />
					)}
					<button
						data-testid={`file-explorer-context-menu-${getFileExplorerTestIdSegment(entry.key)}-button`}
						type="button"
						role="menuitem"
						disabled={entry.disabled}
						className={cn(
							"flex w-full items-center px-3 py-1.5 text-start text-sm transition-colors",
							"focus:bg-accent focus:outline-none",
							entry.disabled
								? "cursor-not-allowed text-muted-foreground/50"
								: entry.destructive
									? "cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
									: "cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground",
						)}
						onClick={(e) => {
							e.stopPropagation();
							if (entry.disabled) return;
							entry.action();
						}}
					>
						{entry.label}
					</button>
				</div>
			))}
		</div>
	);
};
