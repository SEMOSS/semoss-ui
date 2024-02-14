import { Divider, Tooltip, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import {
    DashboardCustomizeRounded,
    DataArrayRounded,
    Layers,
    SwipeRightAltRounded,
} from '@mui/icons-material';

import { Sidebar, SidebarItem, SidebarText } from '@/components/common';

import { NotebookQueriesMenu } from './NotebookQueriesMenu';
import { NotebookSheet } from './NotebookSheet';
import { useState } from 'react';
import { NotebookBlocksMenu } from './NotebookBlocksMenu';

const StyledNotebook = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledLeftPanel = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    height: '100%',
    width: theme.spacing(45),
    overflow: 'hidden',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
}));

const StyledRightPanel = styled('div')(() => ({
    height: '100%',
    flex: 1,
    overflow: 'hidden',
}));

export const Notebook = observer(() => {
    // view
    const [view, setView] = useState<
        'queries' | 'catalog' | 'blocks' | 'transform' | ''
    >('queries');

    /**
     * Set the view. If it is the same, close it
     * @param v
     */
    const updateView = (v: typeof view) => {
        // close if not passed in or the same
        if (!v || v === view) {
            setView('');
            return;
        }

        // set the view
        setView(v);
    };

    return (
        <StyledNotebook>
            <Sidebar>
                <SidebarText>Build</SidebarText>
                <SidebarItem
                    selected={view === 'queries'}
                    onClick={() => updateView('queries')}
                >
                    <Tooltip title={'Add'} placement="right">
                        <Layers color="inherit" />
                    </Tooltip>
                </SidebarItem>
                <SidebarItem
                    disabled={true}
                    selected={view === 'transform'}
                    onClick={() => updateView('transform')}
                >
                    <Tooltip title={'Transform'} placement="right">
                        <DashboardCustomizeRounded color="inherit" />
                    </Tooltip>
                </SidebarItem>
                <Divider orientation="horizontal" />
                <SidebarText>Connect</SidebarText>
                <SidebarItem
                    disabled={true}
                    selected={view === 'catalog'}
                    onClick={() => updateView('catalog')}
                >
                    <Tooltip title={'Catalog'} placement="right">
                        <DataArrayRounded color="inherit" />
                    </Tooltip>
                </SidebarItem>
                <SidebarItem
                    selected={view === 'blocks'}
                    onClick={() => updateView('blocks')}
                >
                    <Tooltip title={'Blocks'} placement="right">
                        <SwipeRightAltRounded color="inherit" />
                    </Tooltip>
                </SidebarItem>
            </Sidebar>
            {view ? (
                <StyledLeftPanel>
                    {view === 'queries' ? <NotebookQueriesMenu /> : null}
                    {view === 'transform' ? <div>Transform</div> : null}
                    {view === 'blocks' ? <NotebookBlocksMenu /> : null}
                    {view === 'catalog' ? <div>Blocks</div> : null}
                </StyledLeftPanel>
            ) : null}

            <StyledRightPanel>
                <NotebookSheet />
            </StyledRightPanel>
        </StyledNotebook>
    );
});
