import { type FC, Fragment, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
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

/** The explorer's action menu, anchored at the requested pointer position.
 * A controlled DropdownMenu supports imperative opening while sharing the
 * design system's keyboard navigation, dismissal, and viewport collision handling.
 */
export const FileExplorerContextMenu: FC<FileExplorerContextMenuProps> = ({
	explorer,
	state,
}) => {
	const { t } = useTranslation("common");
	const returnFocusRef = useRef<HTMLElement | null>(
		typeof document !== "undefined" &&
			document.activeElement instanceof HTMLElement
			? document.activeElement
			: null,
	);

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

	if (isOnItem && capabilities.delete) {
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

	if (entries.length === 0) return null;

	return (
		<DropdownMenu
			open
			modal={false}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DropdownMenuTrigger
				aria-hidden
				tabIndex={-1}
				className="pointer-events-none fixed size-0"
				// The explorer supplies viewport pointer coordinates.
				style={{ left: x, top: y }}
			/>
			<DropdownMenuContent
				data-testid="file-explorer-context-menu"
				aria-label={t("fileExplorer.contextMenu.ariaLabel")}
				align="start"
				sideOffset={0}
				collisionPadding={8}
				className="min-w-48"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
				onClick={(event) => event.stopPropagation()}
				onContextMenu={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				{entries.map((entry) => (
					<Fragment key={entry.key}>
						{entry.dividerBefore && <DropdownMenuSeparator />}
						<DropdownMenuItem
							data-testid={`file-explorer-context-menu-${getFileExplorerTestIdSegment(entry.key)}-button`}
							disabled={entry.disabled}
							variant={
								entry.destructive ? "destructive" : "default"
							}
							onSelect={() => {
								void entry.action();
							}}
						>
							{entry.label}
						</DropdownMenuItem>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
