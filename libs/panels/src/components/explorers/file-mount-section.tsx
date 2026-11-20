import { useCallback, useId, useMemo } from "react";
import {
	FileExplorer,
	FileExplorerHeader,
	type FileExplorerItemActions,
	FileExplorerNewAction,
	FileExplorerRefreshAction,
	type FileItem,
	NewFileOverlay,
} from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { useFileExplorerHost } from "../../contexts/file-explorer-host.context";
import type {
	FileMount,
	FileMountGroup,
} from "../../contexts/file-sources.context";
import { useDockFileExplorer } from "../../hooks/use-dock-file-explorer";
import { useFilesChanged } from "../../hooks/use-files-changed";
import type { FilePanelMode } from "../../types/file-panel.types";
import { FileExplorerSectionHeading } from "./file-explorer-section-heading";

/** Props for {@link FileMountSection}. */
export interface FileMountSectionProps {
	mount: FileMount;
	/** The group it is listed under, for its heading's buttons. */
	group: FileMountGroup;
	isExpanded: boolean;
	onToggle: () => void;
}

/**
 * One of a host's mounts in the Files panel: its heading, and its own
 * explorer over the mount's source, wired into the dock like the panel's own.
 * The explorer stays mounted while the section is collapsed, so its open
 * folders survive.
 *
 * @param props - The mount and its section's state.
 * @returns The section.
 */
export const FileMountSection = ({
	mount,
	group,
	isExpanded,
	onToggle,
}: FileMountSectionProps) => {
	const contentId = useId();
	const host = useFileExplorerHost();
	const mode = useMemo<FilePanelMode>(
		() => ({ type: "MOUNT", mountId: mount.id }),
		[mount.id],
	);
	const explorer = useDockFileExplorer({
		mode: mode,
		source: mount.source,
		readOnly: false,
	});
	// the host tells the dock when the mount changes outside the explorer,
	// such as a file edited in another app
	useFilesChanged({ mode: mode, refresh: explorer.commands.refresh });

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => ({
			actions: [],
			secondaryActions: host?.secondaryActions?.(item, mode) ?? [],
		}),
		[host, mode],
	);

	return (
		<div
			className={cn(
				"flex min-h-0 flex-col",
				isExpanded && "min-h-32 flex-1",
			)}
		>
			<FileExplorerSectionHeading
				label={mount.name}
				isExpanded={isExpanded}
				onToggle={onToggle}
				isNested
				controls={contentId}
				actions={
					<>
						{isExpanded ? (
							<>
								<FileExplorerNewAction explorer={explorer} />
								<FileExplorerRefreshAction
									explorer={explorer}
								/>
							</>
						) : null}
						{group.mountActions?.(mount)}
					</>
				}
			/>
			<div
				id={contentId}
				className={cn(
					"relative min-h-0 flex-1",
					!isExpanded && "hidden",
				)}
			>
				<FileExplorer
					explorer={explorer}
					header={<FileExplorerHeader explorer={explorer} />}
					newFileOverlay={NewFileOverlay}
					itemActions={itemActions}
				/>
			</div>
		</div>
	);
};
