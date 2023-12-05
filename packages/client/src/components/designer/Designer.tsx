import { observer } from 'mobx-react-lite';
import { styled, Stack, Icon, Divider, Paper } from '@semoss/ui';
import { DataObject, Layers, Widgets } from '@mui/icons-material';
import { useState } from 'react';

import { DesignerContext } from '@/contexts';
import { DesignerStore } from '@/stores';
import { Router } from '@/components/blocks';
import { BlocksMenu } from './BlocksMenu';
import { SelectedMenu } from './SelectedMenu';
import { OutlineMenu } from './OutlineMenu';
import { QueryMenu } from './QueryMenu';
import { Screen } from './Screen';

const StyledLeftMenu = styled('div')(() => ({
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
    /** Track if item is disabled because of app view mode - temporary for demos */
    disabled: boolean;
}>(({ theme, selected, disabled }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: selected
        ? theme.palette.primary.light
        : disabled
        ? theme.palette.grey[800]
        : 'inherit',
    textDecoration: 'none',
    height: theme.spacing(6),
    width: '100%',
    cursor: disabled ? 'default' : 'pointer',
    backgroundColor: selected ? '#2A3A4C' : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: disabled
            ? theme.palette.common.black
            : selected
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
    height: '100%',
    width: '100%',
}));

const StyledDesignerContainer = styled(Stack, {
    shouldForwardProp: (prop) => prop !== 'isDragging',
})<{
    isDragging: boolean;
}>(({ isDragging }) => ({
    height: '100%',
    width: '100%',
    cursor: isDragging ? 'grabbing !important' : 'unset',
}));

const StyledRightMenu = styled(Paper)(({ theme }) => ({
    display: 'flex',
    height: '100%',
    width: theme.spacing(50),
    flexDirection: 'row',
    borderRadius: '0',
}));

interface DesignerProps {
    /** Connect the designer to a store */
    designer: DesignerStore;
}

export const Designer = observer((props: DesignerProps): JSX.Element => {
    const { designer } = props;

    // view
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

    /**
     * Clear any selections when interacting with the left menu
     */
    const handleMouseDown = () => {
        designer.setSelected('');
    };

    return (
        <DesignerContext.Provider
            value={{
                designer: designer,
            }}
        >
            <StyledDesignerContainer
                direction="row"
                isDragging={!!designer.drag.ghostWidget}
            >
                <StyledLeftMenu onMouseDown={handleMouseDown}>
                    <StyledSidebar>
                        <StyledSidebarItem
                            disabled={false}
                            selected={view === 'outline'}
                            onClick={() => updateView('outline')}
                        >
                            <Icon>
                                <Layers />
                            </Icon>
                        </StyledSidebarItem>
                        <StyledSidebarItem
                            disabled={false}
                            selected={view === 'query'}
                            onClick={() => updateView('query')}
                        >
                            <Icon>
                                <DataObject />
                            </Icon>
                        </StyledSidebarItem>
                        <StyledSidebarDivider />
                        <StyledSidebarItem
                            disabled={false}
                            selected={view === 'add'}
                            onClick={() => updateView('add')}
                        >
                            <Icon>
                                <Widgets />
                            </Icon>
                        </StyledSidebarItem>
                    </StyledSidebar>
                    {view ? (
                        <StyledSidebarContent elevation={7}>
                            <StyledSidebarContentInner>
                                {view === 'outline' ? <OutlineMenu /> : null}
                                {view === 'query' ? <QueryMenu /> : null}
                                {view === 'add' ? <BlocksMenu /> : null}
                            </StyledSidebarContentInner>
                        </StyledSidebarContent>
                    ) : null}
                </StyledLeftMenu>
                <Stack flex="1">
                    <Screen>
                        <Router />
                    </Screen>
                </Stack>
                <StyledRightMenu elevation={7}>
                    <SelectedMenu />
                </StyledRightMenu>
            </StyledDesignerContainer>
        </DesignerContext.Provider>
    );
});
