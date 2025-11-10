import { ChevronRight, ExpandMore } from "@mui/icons-material";
import React, { useCallback, useEffect } from "react";
import { Icon, LoadingScreen, styled, TreeView } from "@semoss/ui";
import { usePixel } from "@/hooks";
import {
	FileExplorerItem,
	type FileExplorerItemHandle,
} from "./FileExplorerItem";
           
const StyledTreeView = styled(TreeView)(({ theme }) => ({
	width: "100%",
	maxHeight: "100%",
	gap: theme.spacing(3),
	".MuiTreeItem-content": {
		padding: theme.spacing(0.5),
	},
	overflow: "auto",
}));

interface FileExplorerProps {
	expandedPaths: string[];
	onToggleExpand: (path: string) => void;
	/** Type of file opened */
	type: "app" | "insight";

	/** Space where the file is located */
	space: string;

	/** insight id */
	insightId?: string | null;

	/** Trigger a callback when an file is selected */
	onSelect?: (path: string) => void;

	/** Triggered when the Label starts dragging */
	onDragStart: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

	/** Triggered when the item ends dragging */
	onDragEnd?: (event: React.DragEvent<HTMLDivElement>, path: string) => void;

	/** Triggered when the Track Icon is clicked */
	onTrashClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		paths: string[],
	) => void;

	onRenameSave?: (
		oldPath: string,
		newName: string,
		isDirectory: boolean,
	) => Promise<void>;
	deleteMode?: boolean;
	checkedPaths?: Set<string>;
	onToggleChecked?: (path: string) => void;
	onDeleteRequest?: (
		path: string,
		isDirectory: boolean,
		childrenPaths?: string[],
	) => void;
	onCancelDeleteMode?: () => void;
	deleteRootPath?: string | null;
	deletablePaths?: Set<string>;

	/** Additional props for duplicate mode */
	duplicateMode?: boolean;
	onDuplicateRequest?: (
		path: string,
		isDirectory: boolean,
		childrenPaths?: string[],
	) => void;
	onCancelDuplicateMode?: () => void;
	duplicateRootPath?: string | null;
	duplicatablePaths?: Set<string>;

	/** Additional props for duplicating files */
	onDuplicateClickFunc?: (
		checkedPaths: Set<string>,
		duplicateRootPath: string | null,
	) => void;

	allFolders?: string[];
	onAllFoldersLoaded?: (folders: string[]) => void;
	onAllFilesLoaded?: (files: string[]) => void;
	onExpand?: (path: string, childrenPaths?: string[]) => void;

	itemRefs: React.MutableRefObject<
		Record<string, FileExplorerItemHandle | null>
	>;
	/** Triggered when the Make MCP Icon is clicked */
	onMakeMCPClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => void;
	/** Triggered when the Edit MCP Icon is clicked */
	onMCPEditClick?: (
		event: React.MouseEvent<HTMLButtonElement>,
		path: string,
	) => void;
}

export const FileExplorer = (props: FileExplorerProps) => {
	const {
		type,
		space,
		insightId = null,
		onSelect = () => null,
		onDragStart = () => null,
		onDragEnd = () => null,
		onTrashClick = () => null,
		onRenameSave = () => Promise.resolve(),
		deleteMode = false,
		checkedPaths = new Set<string>(),
		onToggleChecked = () => null,
		onDeleteRequest = () => null,
		onCancelDeleteMode = () => null,
		deleteRootPath = null,
		deletablePaths = new Set<string>(),
		duplicateMode = false,
		onDuplicateRequest = () => null,
		onCancelDuplicateMode = () => null,
		duplicateRootPath = null,
		duplicatablePaths = new Set<string>(),
		onDuplicateClickFunc = () => null,
		onAllFoldersLoaded = () => null,
		onAllFilesLoaded = () => null,
		onMakeMCPClick = () => null,
		onMCPEditClick = () => null,
		expandedPaths,
		onToggleExpand,
		onExpand = () => null,
		itemRefs,
	} = props;

	const getAssets = usePixel<
		{
			lastModified: string;
			name: string;
			path: string;
			type: "directory" | "file";
		}[]
	>(
		type === "app"
			? `BrowseAsset(filePath=["version/assets"], space=["${space}"]);`
			: "",
		{},
		insightId,
	);

	// When the assets/folders are loaded, trigger the onAllFoldersLoaded callback, this is used when duplicating a directory
	useEffect(() => {
		if (getAssets.status === "SUCCESS" && Array.isArray(getAssets.data)) {
			const folderPaths = getAssets.data
				.filter((item) => item.type === "directory")
				.map((item) => item.path);
			onAllFoldersLoaded?.(folderPaths);
		}
	}, [getAssets.status, getAssets.data, onAllFoldersLoaded]);

	// When the files are loaded, trigger the onAllFilesLoaded callback, this is used when duplicating files
	const handleFilesLoaded = useCallback(
		(folderPath: string, filesPaths: string[]) => {
			if (onAllFilesLoaded) {
				onAllFilesLoaded(filesPaths);
			}
		},
		[onAllFilesLoaded],
	);

	const initLoadComplete = getAssets.status === "SUCCESS";
	const [selected, setSelected] = React.useState<string[]>([]);

	/**
	 * Triggered when a node is selected
	 * @param selected - newly selected values
	 */
	const handleOnNodeSelect = (selected: string[]) => {
		// trigger the callback on the first one
		onSelect(selected[0] || "");

		// set the selected values
		setSelected(selected);
	};

	/**
	 * Triggered when a item is toggled
	 * @param expanded - newly expanded values
	 */

	if (!initLoadComplete) {
		return (
			<LoadingScreen.Trigger description="Retrieving files from application..." />
		);
	}

	return (
		<StyledTreeView
			multiSelect
			expanded={expandedPaths}
			selected={selected}
			onNodeToggle={(e, nodeIds) => {
				const lastToggled =
					nodeIds.find((id) => !expandedPaths.includes(id)) ||
					expandedPaths.find((id) => !nodeIds.includes(id));
				if (lastToggled) {
					onToggleExpand(lastToggled);
				}
			}}
			onNodeSelect={(e, v) => {
				handleOnNodeSelect(v);
			}}
		>
			<LoadingScreen>
				{getAssets.status === "INITIAL" ||
				getAssets.status === "LOADING" ? (
					<LoadingScreen.Trigger />
				) : getAssets.status === "SUCCESS" ? (
					getAssets.data.map((n) => {
						return (
							<FileExplorerItem
								ref={(el) => {
									if (el) itemRefs.current[n.path] = el;
								}}
								key={n.path}
								type={type}
								space={space}
								name={n.name}
								path={n.path}
								isDirectory={n.type === "directory"}
								lastModified={n.lastModified}
								expanded={expandedPaths}
								selected={selected}
								onDragStart={(e, path) => {
									onDragStart(e, path);
								}}
								onDragEnd={(e, path) => {
									onDragEnd(e, path);
								}}
								onTrashClick={(e, paths) => {
									onTrashClick(e, paths);
								}}
								onRenameSave={onRenameSave}
								deleteMode={deleteMode}
								checkedPaths={checkedPaths}
								onToggleChecked={onToggleChecked}
								onDeleteRequest={onDeleteRequest}
								onCancelDeleteMode={onCancelDeleteMode}
								deleteRootPath={deleteRootPath}
								deletablePaths={deletablePaths}
								duplicateMode={duplicateMode}
								onDuplicateRequest={onDuplicateRequest}
								onCancelDuplicateMode={onCancelDuplicateMode}
								duplicateRootPath={duplicateRootPath}
								duplicatablePaths={duplicatablePaths}
								onDuplicateClickFunc={onDuplicateClickFunc}
								onFilesLoaded={handleFilesLoaded}
								onExpand={onExpand}
								// sending expandIcon and collapseIcon props to FileExplorerItem to show expand/collapse icons only for directories not for files
								expandIcon={
									n.type === "directory" ? (
										<Icon color="disabled">
											<ChevronRight />
										</Icon>
									) : null
								}
								collapseIcon={
									n.type === "directory" ? (
										<Icon color="disabled">
											<ExpandMore />
										</Icon>
									) : null
								}
								endIcon={
									n.type !== "directory" ? (
										<span /> // Empty span to override default behavior
									) : null
								}
								onMakeMCPClick={(e, path) => {
									onMakeMCPClick(e, path);
								}}
								onMCPEditClick={(e, path) => {
									onMCPEditClick(e, path);
								}}
							/>
						);
					})
				) : null}
			</LoadingScreen>
		</StyledTreeView>
	);
};
