import { ChevronRight, ExpandMore } from "@mui/icons-material";
import React from "react";
import { Icon, styled, TreeView } from "@semoss/ui";
import { LoadingScreen } from "@/components/ui";
import { usePixel, useWorkspace } from "@/hooks";
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
		path: string,
	) => void;
	/** Text to filter files and folders */
	searchText?: string;
}

interface FileNode {
    name: string;
    path: string;
    originalPath: string;
    type: "directory" | "file";
    lastModified: string;
    children: Record<string, FileNode>;
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
		expandedPaths,
		onToggleExpand,
		searchText = '',
	} = props;

    const { workspace } = useWorkspace();

    const query =
        searchText.length > 0 && type === 'app'
            ? `SearchAppAssets ( project = "${workspace.appId}" , filePath=["version/assets/"],search="${searchText}",options=[])`
            : type === 'app'
            ? `BrowseAsset(filePath=["version/assets"], space=["${space}"])`
            : '';

    const getAssets = usePixel<
        {
            lastModified: string;
            name: string;
            path: string;
            type: 'directory' | 'file';
        }[]
    >(query, {}, insightId);

    const initLoadComplete = getAssets.status === "SUCCESS";
    const [selected, setSelected] = React.useState<string[]>([]);
	const [localExpanded, setLocalExpanded] = React.useState<string[]>([]);    

	/**
	 * Triggered when a node is selected
	 * @param selected - newly selected values
	 */
	const handleOnNodeSelect = (selected: string[]) => {
		// trigger the callback on the first one
		searchText.length===0 && onSelect(selected[0] || '');

		// set the selected values
		setSelected(selected);
	};

    const buildFileTree = (files: typeof getAssets.data) : Record<string, FileNode> => {
        const root: Record<string, FileNode> = {};

        for (const file of files) {
            const parts = file.path.split('/').filter(Boolean);
            let current = root;

            for (let i = 2; i < parts.length; i++) {
                const part = parts[i];
                const fullPath = `/${parts.slice(0, i + 1).join('/')}`;

                if (!current[fullPath]) {
                    current[fullPath] = {
                        name: part,
                        path: fullPath,
						originalPath: file.path,
                        type: i === parts.length - 1 ? file.type : 'directory',
                        lastModified: file.lastModified,
                        children: {},
                    };
                }

                current = current[fullPath].children;
            }
        }

        return root;
    };

    const extractAllDirectoryPaths = (tree: Record<string, FileNode>): string[] => {
        const result: string[] = [];
        const recurse = (node: Record<string, FileNode>) => {
            for (const entry of Object.values(node)) {
                const e = entry as {
                    path: string;
                    type: string;
                    children: Record<string, FileNode>;
                };

                if (e.type === 'directory') {
                    result.push(e.path);
                    recurse(e.children);
                }
            }
        };
        recurse(tree);
        return result;
    };

    const tree = React.useMemo(() => {
        if (searchText.length > 0) {
            return buildFileTree(getAssets.data || []);
        }
        return null;
    }, [searchText, getAssets.data]);

    React.useEffect(() => {
        if (searchText.length > 0 && tree) {
            const autoExpanded = extractAllDirectoryPaths(tree);
            setLocalExpanded(autoExpanded);
        }
    }, [searchText, tree]);

    // Function to handle click event for search results
    const handleSearchItemClick = (e: React.MouseEvent<HTMLDivElement>, path: string, isDirectory: boolean) => {
        e.stopPropagation();
      if (searchText.length > 0) {
        let finalPath = path;

        // If it's a directory, make sure path ends with "/"
        if (isDirectory && !finalPath.endsWith("/")) {
          finalPath = `${finalPath}/`;
        }

        // Call your onSelect prop if present
        if (onSelect) {
          onSelect(finalPath);
        }
      }
    };

    const renderTree = (node: Record<string, FileNode>) => {
        return Object.entries(node).map(([path, entry]) => (
          <div
            role="treeitem"
            tabIndex={0}
            className="cursor-pointer"
            key={path}
            onKeyDown={() => {}}
            onClick={(e) =>
            handleSearchItemClick(e, entry.path, entry.type === "directory")
            }
          >
            <FileExplorerItem
              type={type}
              space={space}
              name={entry.name}
              path={entry.path}
              isDirectory={entry.type === "directory"}
              lastModified={entry.lastModified}
              expanded={searchText.length > 0 ? localExpanded : expandedPaths}
              selected={selected}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onTrashClick={onTrashClick}
              searchText={searchText}
              fromSearch={true}
            >
              {renderTree(entry.children)}
            </FileExplorerItem>
          </div>
        ));
    };

	if (!initLoadComplete) {
		return (
			<LoadingScreen.Trigger description="Retrieving files from application..." />
		);
	}

    return (
        <StyledTreeView
            multiSelect
            expanded={searchText.length > 0 ? localExpanded : expandedPaths}
            selected={selected}
            onNodeToggle={(_e, nodeIds) => {
                const lastToggled =
                    nodeIds.find((id) =>
                        searchText.length > 0
                            ? !localExpanded.includes(id)
                            : !expandedPaths.includes(id)
                    ) ||
                    (searchText.length > 0
                        ? localExpanded.find((id) => !nodeIds.includes(id))
                        : expandedPaths.find((id) => !nodeIds.includes(id)));

                if (lastToggled) {
                    if (searchText.length > 0) {
                        setLocalExpanded(nodeIds);
                    } else {
                        onToggleExpand(lastToggled);
                    }
                }
            }}
            onNodeSelect={(_e, v) => handleOnNodeSelect(v)}
            defaultCollapseIcon={
                <Icon color={'disabled'}>
                    <ExpandMore />
                </Icon>
            }
            defaultExpandIcon={
                <Icon color={'disabled'}>
                    <ChevronRight />
                </Icon>
            }
        >
            <LoadingScreen>
                {searchText.length > 0
                    ? renderTree(tree)
                    : getAssets.data.map((n) => (
                          <FileExplorerItem
                              key={n.path}
                              type={type}
                              space={space}
                              name={n.name}
                              path={n.path}
                              isDirectory={n.type === 'directory'}
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
                              searchText={searchText}
                          />
                      ))}
            </LoadingScreen>
        </StyledTreeView>
    );
};
