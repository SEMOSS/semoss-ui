import { ChevronRight, ExpandMore } from "@mui/icons-material";
import React from "react";
import { Icon, LoadingScreen, styled, TreeView } from "@semoss/ui";
import { usePixel } from "@/hooks";
import { FileExplorerItem } from "./FileExplorerItem";

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
	type: "app" | "insight" | "engine";

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
		path: string,
	) => void;
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
		onMakeMCPClick = () => null,
		onMCPEditClick = () => null,
		expandedPaths,
		onToggleExpand,
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
			: `BrowseEngineAssets(filePath=[], engine=["${space}"]);`,
		{},
		insightId,
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
	 * Handle deselecting items when clicking/interacting outside tree items
	 */
	const handleDeselectOutside = (target: HTMLElement) => {
		// Only deselect if not clicking on a tree item
		if (
			!target.closest(".MuiTreeItem-root") &&
			!target.closest(".MuiTreeItem-content")
		) {
			handleOnNodeSelect([]);
		}
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
		<div
			role="region"
			className="h-full w-full"
			aria-label="File Explorer"
			onClick={(e) => {
				handleDeselectOutside(e.target as HTMLElement);
			}}
			onKeyDown={(e) => {
				// Handle Escape key to deselect
				if (e.key === "Escape") {
					handleDeselectOutside(e.target as HTMLElement);
				}
			}}
		>
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
				defaultCollapseIcon={
					<Icon color={"disabled"}>
						<ExpandMore />
					</Icon>
				}
				defaultExpandIcon={
					<Icon color={"disabled"}>
						<ChevronRight />
					</Icon>
				}
			>
				<LoadingScreen>
					{getAssets.status === "INITIAL" ||
					getAssets.status === "LOADING" ? (
						<LoadingScreen.Trigger />
					) : getAssets.status === "SUCCESS" ? (
						getAssets.data.map((n) => {
							return (
								<FileExplorerItem
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
									onTrashClick={(e, path) => {
										onTrashClick(e, path);
									}}
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
		</div>
	);
};
