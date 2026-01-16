import React, { useEffect } from 'react';
import { Icon, LoadingScreen, TreeView, styled } from '@semoss/ui';
import { usePixel } from '@/hooks';
import { ExpandMoreOutlined, ChevronRightOutlined } from '@mui/icons-material';

import { EngineFileExplorerItem } from './EngineFileExplorerItem';

type AssetItem = {
    lastModified: string;
    name: string;
    path: string;
    type: 'directory' | 'file';
};

interface EngineFileExplorerProps {
    type: 'engine';
    engine: string;
    expandedPaths: string[];
    onToggleExpand: (path: string) => void;
    /** Trigger a callback when an file is selected */
    onSelect?: (path: string) => void;
    onDataLoad?: (data: AssetItem[]) => void;
    onTrashClick?: (
        event: React.MouseEvent<HTMLButtonElement>,
        path: string,
    ) => void;
}

const StyledTreeView = styled(TreeView)(({ theme }) => ({
    width: '100%',
    maxHeight: '100%',
    gap: theme.spacing(3),
    '.MuiTreeItem-content': {
        padding: theme.spacing(0.5),
    },
    overflow: 'auto',
}));

const StyledIconWrapper = styled(Icon)(({ theme }) => ({
  color: theme.palette.action.disabled,
  '& svg': {
    color: '#757575',
  },
}));

export const EngineFileExplorer = (props: EngineFileExplorerProps) => {
    const {
        type,
        engine,
        onSelect = () => null,
        expandedPaths,
        onToggleExpand,
        onDataLoad,
        onTrashClick,
    } = props;

    const getAssets = usePixel<AssetItem[]>(
        type === 'engine'
            ? `BrowseEngineAssets(engine=["${engine}"],filePath=[""]);`
            : '',
        {},
    );

    const initLoadComplete = getAssets.status === 'SUCCESS';
    const [selected, setSelected] = React.useState<string[]>([]);

    useEffect(() => {
        if (initLoadComplete && onDataLoad) {
            onDataLoad(getAssets.data);
        }
    }, [initLoadComplete, getAssets.data, onDataLoad]);

    /**
     * Triggered when a node is selected
     * @param selected - newly selected values
     */
    const handleOnNodeSelect = (selected: string[]) => {
        onSelect(selected[0] || '');
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
            defaultCollapseIcon={
                <StyledIconWrapper>
                    <ExpandMoreOutlined />
                </StyledIconWrapper>
            }
            defaultExpandIcon={
                <StyledIconWrapper>
                    <ChevronRightOutlined />
                </StyledIconWrapper>
            }
        >
            <LoadingScreen>
                {getAssets.status === 'INITIAL' ||
                getAssets.status === 'LOADING' ? (
                    <LoadingScreen.Trigger />
                ) : getAssets.status === 'SUCCESS' ? (
                    getAssets.data.map((n) => {
                        return (
                            <EngineFileExplorerItem
                                key={n.path}
                                type={type}
                                engine={engine}
                                name={n.name}
                                path={n.path}
                                isDirectory={n.type === 'directory'}
                                lastModified={n.lastModified}
                                expanded={expandedPaths}
                                selected={selected}
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
