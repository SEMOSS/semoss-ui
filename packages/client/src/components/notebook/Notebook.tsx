import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { DataArrayRounded } from '@mui/icons-material';

import { Sidebar, SidebarItem } from '@/components/common';

import { NotebookMenu } from './NotebookMenu';
import { NotebookSheet } from './NotebookSheet';

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
    return (
        <StyledNotebook>
            <Sidebar>
                <SidebarItem selected={true} onClick={() => null}>
                    <DataArrayRounded color="inherit" />
                </SidebarItem>
            </Sidebar>
            <StyledLeftPanel>
                <NotebookMenu />
            </StyledLeftPanel>
            <StyledRightPanel>
                <NotebookSheet />
            </StyledRightPanel>
        </StyledNotebook>
    );
});
