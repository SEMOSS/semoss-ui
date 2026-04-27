/** biome-ignore-all lint/a11y/useKeyWithClickEvents: custom context menu keyboard handling is managed below */
import {
	ClipboardPasteIcon,
	CopyIcon,
	DownloadIcon,
	FileArchiveIcon,
	FilePlus2Icon,
	FolderPlusIcon,
	MoreHorizontalIcon,
	PencilIcon,
	ScissorsIcon,
	Trash2Icon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import type { FileItem } from "./file.types";
import { getFileExplorerTestIdSegment } from "./file-explorer.utils";
import type { NewFileAction } from "./new-file-overlay";

interface ClipboardState {
	items: FileItem[];
	action: "copy" | "cut";
}

interface ContextMenuState {
	x: number;
	y: number;
	item: FileItem | null;
	targetPath: string;
	secondaryActions?: FileExplorerSecondaryAction[];
}

type FileExplorerSecondaryAction = {
	name: string;
	action: (item: FileItem) => Promise<void>;
};

interface FileExplorerContextMenuProps {
	state: ContextMenuState;
	clipboard: ClipboardState | null;
	selectedItems?: FileItem[];
	canMutateFiles: boolean;
	onClose: () => void;
	onCut: (item: FileItem) => void;
	onCopyPath: (item: FileItem) => void;
	onCutItems: (items: FileItem[]) => void;
	onPaste: (targetDirectory: string) => Promise<void>;
	onRename: (item: FileItem) => void;
	onDelete: (item: FileItem) => Promise<void>;
	onDeleteItems: (items: FileItem[]) => Promise<void>;
	onDownload: (item: FileItem) => Promise<void>;
	onDownloadItems: (items: FileItem[]) => Promise<void>;
	onNew: (targetPath: string, initialAction?: NewFileAction) => void;
}

interface MenuEntry {
	key: string;
	label: string;
	icon: React.ReactNode;
	disabled?: boolean;
	destructive?: boolean;
	dividerBefore?: boolean;
	action: () => void | Promise<void>;
}

export const FileExplorerContextMenu: React.FC<
	FileExplorerContextMenuProps
> = ({
	state,
	clipboard,
	selectedItems = [],
	canMutateFiles,
	onClose,
	onCut,
	onCopyPath,
	onCutItems,
	onPaste,
	onRename,
	onDelete,
	onDeleteItems,
	onDownload,
	onDownloadItems,
	onNew,
}) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const focusedIndexRef = useRef<number>(-1);

	const { item, targetPath, x, y } = state;
	const isOnItem = item !== null;
	const bulkItems =
		item &&
		selectedItems.some((selectedItem) => selectedItem.path === item.path)
			? selectedItems
			: [];
	const isBulkAction = bulkItems.length > 1;
	const secondaryActions = state.secondaryActions || [];
	const getSecondaryAction = (name: string) =>
		secondaryActions.find(
			(action) => action.name.toLowerCase() === name.toLowerCase(),
		);
	const getSecondaryIcon = (name: string) => {
		const normalizedName = name.toLowerCase();
		if (normalizedName.includes("unzip")) {
			return <FileArchiveIcon className="size-4 shrink-0" />;
		}
		if (normalizedName.includes("download")) {
			return <DownloadIcon className="size-4 shrink-0" />;
		}
		if (normalizedName.includes("delete")) {
			return <Trash2Icon className="size-4 shrink-0" />;
		}
		if (normalizedName.includes("copy")) {
			return <CopyIcon className="size-4 shrink-0" />;
		}
		return <MoreHorizontalIcon className="size-4 shrink-0" />;
	};
	const duplicateSecondaryActions = new Set([
		"copy path",
		"download",
		"delete",
	]);

	// ── Build menu entries ──────────────────────────────────────────────────

	const entries: MenuEntry[] = [];

	if (isOnItem && canMutateFiles) {
		entries.push({
			key: "copy-path",
			label: "Copy path",
			icon: <CopyIcon className="size-4 shrink-0" />,
			disabled: isBulkAction,
			action: async () => {
				if (!item) return;
				const secondaryCopyPath = getSecondaryAction("Copy Path");
				if (secondaryCopyPath) {
					await secondaryCopyPath.action(item);
				} else {
					onCopyPath(item);
				}
				onClose();
			},
		});

		entries.push({
			key: "cut",
			label: "Cut",
			icon: <ScissorsIcon className="size-4 shrink-0" />,
			action: () => {
				if (isBulkAction) {
					onCutItems(bulkItems);
				} else {
					if (!item) return;
					onCut(item);
				}
				onClose();
			},
		});
	}

	if (canMutateFiles) {
		entries.push({
			key: "paste",
			label: "Paste here",
			icon: <ClipboardPasteIcon className="size-4 shrink-0" />,
			disabled: clipboard === null || isBulkAction,
			dividerBefore: isOnItem,
			action: async () => {
				if (!clipboard) return;
				onClose();
				await onPaste(targetPath);
			},
		});
	}

	if (isOnItem && canMutateFiles) {
		entries.push({
			key: "rename",
			label: "Rename",
			icon: <PencilIcon className="size-4 shrink-0" />,
			disabled: isBulkAction,
			dividerBefore: true,
			action: () => {
				if (!item) return;
				onClose();
				onRename(item);
			},
		});
	}

	if (isOnItem) {
		entries.push({
			key: "download",
			label: "Download",
			icon: <DownloadIcon className="size-4 shrink-0" />,
			action: async () => {
				onClose();
				if (isBulkAction) {
					await onDownloadItems(bulkItems);
				} else {
					if (!item) return;
					const secondaryDownload = getSecondaryAction("Download");
					if (secondaryDownload && item.type !== "directory") {
						await secondaryDownload.action(item);
					} else {
						await onDownload(item);
					}
				}
			},
		});
	}

	if (isOnItem && !isBulkAction) {
		secondaryActions
			.filter(
				(action) =>
					!duplicateSecondaryActions.has(action.name.toLowerCase()),
			)
			.forEach((secondaryAction) => {
				entries.push({
					key: `secondary-${secondaryAction.name}`,
					label: secondaryAction.name,
					icon: getSecondaryIcon(secondaryAction.name),
					action: async () => {
						if (!item) return;
						onClose();
						await secondaryAction.action(item);
					},
				});
			});
	}

	if (isOnItem && canMutateFiles) {
		entries.push({
			key: "delete",
			label: "Delete",
			icon: <Trash2Icon className="size-4 shrink-0" />,
			destructive: true,
			dividerBefore: true,
			action: async () => {
				onClose();
				if (isBulkAction) {
					await onDeleteItems(bulkItems);
				} else {
					if (!item) return;
					const secondaryDelete = getSecondaryAction("Delete");
					if (secondaryDelete) {
						await secondaryDelete.action(item);
					} else {
						await onDelete(item);
					}
				}
			},
		});
	}

	if (canMutateFiles) {
		entries.push({
			key: "new-file",
			label: "New file",
			icon: <FilePlus2Icon className="size-4 shrink-0" />,
			disabled: isBulkAction,
			dividerBefore: true,
			action: () => {
				onClose();
				onNew(targetPath, "add_file");
			},
		});

		entries.push({
			key: "new-folder",
			label: "New folder",
			icon: <FolderPlusIcon className="size-4 shrink-0" />,
			disabled: isBulkAction,
			action: () => {
				onClose();
				onNew(targetPath, "add_directory");
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

	const MENU_W = 192;
	const MENU_H_APPROX = entries.length * 32 + 12;
	const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
	const vh = typeof window !== "undefined" ? window.innerHeight : 9999;

	const left = x + MENU_W > vw ? Math.max(0, x - MENU_W) : x;
	const top = y + MENU_H_APPROX > vh ? Math.max(0, y - MENU_H_APPROX) : y;

	if (entries.length === 0) return null;

	return (
		<div
			data-testid="file-explorer-context-menu"
			ref={menuRef}
			role="menu"
			aria-label="File actions"
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
						className={[
							"flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
							"focus:bg-accent focus:outline-none",
							entry.disabled
								? "cursor-not-allowed text-muted-foreground/50"
								: entry.destructive
									? "cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
									: "cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground",
						]
							.filter(Boolean)
							.join(" ")}
						onClick={(e) => {
							e.stopPropagation();
							if (entry.disabled) return;
							entry.action();
						}}
					>
						<span className="flex size-4 shrink-0 items-center justify-center">
							{entry.icon}
						</span>
						{entry.label}
					</button>
				</div>
			))}
		</div>
	);
};
