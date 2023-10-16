import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { TextEditor, ControlledFile } from '../';

import {
    Button,
    Accordion,
    Collapse,
    IconButton,
    TreeView,
    Icon,
    Skeleton,
    useNotification,
    styled,
    Typography,
    ThemeProvider,
} from '@semoss/ui';

import {
    ExpandMore,
    ChevronRight,
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
} from '@mui/icons-material/';

const StyledCollapseContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '250px',
    height: '100%',
    paddingLeft: theme.spacing(2),
    boxShadow: '5px 0 5px -2px rgba(0, 0, 0, 0.04)',
}));

const StyleAppExplorerHeader = styled('div')(({ theme }) => ({
    // border: 'solid green',
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingTop: '2px',
    alignItems: 'center',
}));

const CustomAccordionTrigger = styled('div')(({ theme }) => ({
    // border: 'solid red',
    display: 'flex',
    flexDirection: 'row',
    '&:hover': {
        cursor: 'pointer',
    },
    '&:focus': {
        cursor: 'pointer',
    },
}));

export const AppExplorer = (props) => {
    const { directory, packages, onSelect } = props;
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    /**
     * Sets Expanded Folders
     * @param event
     * @param nodeIds
     */
    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    // ----------------------------
    // Render Helpers -------------
    // ----------------------------
    /**
     * Recursively render Tree Nodes based on nodes children
     */
    function renderTreeNodes(nodes) {
        return nodes.map((node, i) => (
            <TreeView.Item
                key={node.id}
                nodeId={node.id}
                label={node.name + 'dir'}
            >
                'hann'
                {node.children && node.children.length > 0
                    ? renderTreeNodes(node.children)
                    : null}
            </TreeView.Item>
        ));
    }

    return (
        <StyledCollapseContainer>
            <StyleAppExplorerHeader>
                <Typography variant="h6">Explorers</Typography>
            </StyleAppExplorerHeader>
            <TreeView
                sx={{ width: '100%' }}
                expanded={expanded}
                selected={selected}
                onNodeToggle={handleToggle}
                onNodeSelect={async (v) => {
                    // const
                    const selectedNodes = onSelect(v);

                    setSelected(selectedNodes);
                    // if succesful select node in tree view state
                }}
                defaultCollapseIcon={<ExpandMore />}
                defaultExpandIcon={<ChevronRight />}
                multiSelect
            >
                Hey
                {renderTreeNodes(directory)}
            </TreeView>
        </StyledCollapseContainer>
    );
};
