import { observer } from 'mobx-react-lite';
import { styled, Icon, Divider, Paper } from '@semoss/ui';
import {
    DesktopWindowsRounded,
    SpaceDashboardOutlined,
    Functions,
} from '@mui/icons-material';
import { useState } from 'react';

const StyledContent = styled('div')(() => ({
    display: 'flex',
    height: '100%',
    flexDirection: 'row',
}));

const StyledSidebar = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    height: '100%',
    width: theme.spacing(7),
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
    zIndex: 10,
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledSidebarItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: selected ? theme.palette.primary.light : 'inherit',
    textDecoration: 'none',
    height: theme.spacing(6),
    width: '100%',
    cursor: 'pointer',
    backgroundColor: selected ? '#2A3A4C' : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: selected
            ? theme.palette.primary.main
            : `${theme.palette.primary.dark}`,
        transition: 'backgroundColor 2s ease',
    },
}));

const StyledSidebarDivider = styled(Divider)(({ theme }) => ({
    backgroundColor: 'rgba(235, 238, 254, 1)',
    width: theme.spacing(2),
}));

const StyledSidebarContent = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    overflowX: 'hidden',
    overflowY: 'auto',
    width: theme.spacing(43),
    borderRadius: '0',
}));

const StyledSidebarContentInner = styled('div')(({ theme }) => ({
    flex: '1',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    width: '100%',
}));

export const DesignerSidebar = observer(() => {
    const [view, setView] = useState<'outline' | 'query' | 'add' | ''>('');

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
        <StyledContent>
            <StyledSidebar>
                <StyledSidebarItem
                    selected={view === 'outline'}
                    onClick={() => updateView('outline')}
                >
                    <Icon>
                        <DesktopWindowsRounded />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarItem
                    selected={view === 'query'}
                    onClick={() => updateView('query')}
                >
                    <Icon>
                        <Functions />
                    </Icon>
                </StyledSidebarItem>
                <StyledSidebarDivider />
                <StyledSidebarItem
                    selected={view === 'add'}
                    onClick={() => updateView('add')}
                >
                    <Icon>
                        <SpaceDashboardOutlined />
                    </Icon>
                </StyledSidebarItem>
            </StyledSidebar>
            {view ? (
                <StyledSidebarContent elevation={7}>
                    <StyledSidebarContentInner>
                        {view}
                    </StyledSidebarContentInner>
                </StyledSidebarContent>
            ) : null}
        </StyledContent>
    );
});
