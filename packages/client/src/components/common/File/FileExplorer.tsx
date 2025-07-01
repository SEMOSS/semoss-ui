import React from 'react';
import { Icon, TreeView, styled } from '@semoss/ui';
import { ExpandMore, ChevronRight } from '@mui/icons-material';

import { useEngine, usePixel, useRootStore, useWorkspace } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { FileExplorerItem } from './FileExplorerItem';

const StyledTreeView = styled(TreeView)(({ theme }) => ({
    width: '100%',
    maxHeight: '100%',
    gap: theme.spacing(3),
    '.MuiTreeItem-content': {
        padding: theme.spacing(0.5),
    },
    overflow: 'auto',
}));

interface FileExplorerProps {
    /** Type of file opened */
    type: 'app' | 'insight' | 'storage-catalog' ;

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
    } = props;

    // const getAssets = usePixel<
    //     {
    //         lastModified: string;
    //         name: string;
    //         path: string;
    //         type: 'directory' | 'file';
    //     }[]
    // >(
    //     type === 'app'
    //         ? `BrowseAsset(filePath=["version/assets"], space=["${space}"]);`
    //         : '',
    //     {},
    //     insightId,
    // );

    const { id } = useEngine();
    const query = `Storage(storage = '${id}') | ListStoragePathDetails(storagePath='/');`;
    console.log("at FileExplorer query 4" ,query);
    
    const getAssets = usePixel<
        {
            metadata: Record<string, any>;
            size: number;
            etag: string;
            lastModified: {
            seconds: number;
            nanos: number;
            };
            key: string;
        }[]
        >(
        query,
        {},
        insightId
        );



    const initLoadComplete = getAssets.status === 'SUCCESS';
    console.log("at FileExplorer type" ,type)
    console.log("at FileExplorer  Fetching assets 12",getAssets.status);
    console.log("at FileExplorer  Fetching assets 12" ,getAssets.data);

    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    const { monolithStore, configStore } = useRootStore();
    const insightIdFromStore = configStore.store.insightID;
    console.log("at FileExplorer insightIdFromStore" ,insightIdFromStore);
    /**
     * Triggered when a node is selected
     * @param selected - newly selected values
     */
    const handleOnNodeSelect = (selected: string[]) => {
        // trigger the callback on the first one
        onSelect(selected[0] || '');

        // set the selected values
        setSelected(selected);
    };

    /**
     * Triggered when a item is toggled
     * @param expanded - newly expanded values
     */
    const handleOnNodeToggle = (expanded: string[]) => {
        // set the expanded values
        setExpanded(expanded);
    };

    if (!initLoadComplete) {
        return (
            <LoadingScreen.Trigger description="Retrieving files from application..." />
        );
    }

    return (
        <StyledTreeView
            multiSelect
            expanded={expanded}
            selected={selected}
            onNodeToggle={(e, v) => {
                handleOnNodeToggle(v);
            }}
            onNodeSelect={(e, v) => {
                handleOnNodeSelect(v);
            }}
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
                {getAssets.status === 'INITIAL' ||
                getAssets.status === 'LOADING' ? (
                    <LoadingScreen.Trigger />
                ) : getAssets.status === 'SUCCESS' ? (
                    getAssets.data?.map((n) => {

                        const name = n.key.split('/').pop() || n.key;
                        const path = n.key;
                        const isDirectory = !n.key.includes('.'); // fallback check, or use metadata if available
                        const lastModified = new Date(
                            n.lastModified.seconds * 1000 +
                                n.lastModified.nanos / 1000000,
                        ).toLocaleString();
                        return (
                            <FileExplorerItem
                                key={path}
                                type={type}
                                space={space}
                                name={name}
                                path={path}
                                isDirectory={isDirectory}
                                lastModified={lastModified}
                                expanded={expanded}
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
                            />
                        );
                    })
                ) : null}
            </LoadingScreen>
        </StyledTreeView>
    );
};
