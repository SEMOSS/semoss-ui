import { observer } from 'mobx-react-lite';
import { styled, Stack, Icon, Divider, Paper } from '@semoss/ui';
import { DataObject, Layers, Widgets } from '@mui/icons-material';
import { useState } from 'react';

import { DesignerContext } from '@/contexts';
import { DesignerStore } from '@/stores';

import { BlocksMenu } from './BlocksMenu';
import { SelectedMenu } from './SelectedMenu';
import { OutlineMenu } from './OutlineMenu';
import { QueryMenu } from './QueryMenu';
import { Screen } from './Screen';

const StyledLeftMenu = styled('div', {
    shouldForwardProp: (prop) => prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
    display: 'flex',
    height: '100%',
    flexDirection: 'row',
    width: `calc(${width}% + ${theme.spacing(7)});`,
    flexShrink: '0',
}));

const StyledSidebar = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    height: '100%',
    minWidth: theme.spacing(7),
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
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    borderRadius: '0',
}));

const StyledSidebarContentInner = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
}));

const StyledDesignerContainer = styled(Stack, {
    shouldForwardProp: (prop) =>
        prop !== 'isDragging' && prop !== 'isMenuResizing',
})<{
    isDragging: boolean;
    isMenuResizing: boolean;
}>(({ isDragging, isMenuResizing }) => ({
    height: '100%',
    width: '100%',
    cursor: isDragging
        ? 'grabbing!important'
        : isMenuResizing
        ? 'col-resize'
        : 'unset',
}));

const StyledRightMenu = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
    display: 'flex',
    height: '100%',
    width: `${width}%`,
    flexDirection: 'row',
    borderRadius: '0',
    flexShrink: '0',
}));

const StyledDragger = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMenuResizing',
})<{ isMenuResizing: boolean }>(({ theme, isMenuResizing }) => ({
    // width: theme.spacing(0.5),
    minWidth: theme.spacing(0.5),
    cursor: 'col-resize',
    zIndex: '100',
    backgroundColor: theme.palette.divider,
    opacity: isMenuResizing ? 1 : 0.2,
    '&:hover': {
        transition: 'opacity 2s ease',
        opacity: 1,
    },
}));

interface DesignerProps {
    /** Content to render in the designer */
    children: React.ReactNode;

    /** Connect the designer to a store */
    designer: DesignerStore;
}

export const Designer = observer((props: DesignerProps): JSX.Element => {
    const { children, designer } = props;

    // view
    const [view, setView] = useState<'outline' | 'query' | 'add' | ''>('');

    // menu resize
    const [leftMenuResize, setLeftMenuResize] = useState<{
        width: number;
        isResizing: boolean;
    }>({
        width: 25,
        isResizing: false,
    });
    const [rightMenuResize, setRightMenuResize] = useState<{
        width: number;
        isResizing: boolean;
    }>({
        width: 25,
        isResizing: false,
    });

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
    const handleLeftMenuMouseDown = () => {
        designer.setSelected('');
    };

    const handleLeftMenuResize = (e) => {
        const containerWidth = window.innerWidth;
        const menuWidth = (e.clientX / containerWidth) * 100;
        if (menuWidth > 48 || menuWidth < 20) {
            // don't allow menu to take up more than 48% of screen
            // or less than 20% of the screen
            return;
        }

        setLeftMenuResize((state) => {
            return { ...state, width: menuWidth };
        });
    };

    const handleRightMenuResize = (e) => {
        const containerWidth = window.innerWidth;
        const menuWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
        if (menuWidth > 48 || menuWidth < 20) {
            // don't allow menu to take up more than 48% of screen
            // or less than 20% of the screen
            return;
        }

        setRightMenuResize((state) => {
            return { ...state, width: menuWidth };
        });
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
                isMenuResizing={
                    rightMenuResize.isResizing || leftMenuResize.isResizing
                }
            >
                <StyledLeftMenu
                    id="left-menu"
                    onMouseDown={handleLeftMenuMouseDown}
                    width={view ? leftMenuResize.width : 0}
                >
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
                    {view ? (
                        <StyledDragger
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setLeftMenuResize((state) => {
                                    return { ...state, isResizing: true };
                                });
                                window.addEventListener(
                                    'mousemove',
                                    handleLeftMenuResize,
                                );
                                window.addEventListener('mouseup', () => {
                                    setLeftMenuResize((state) => {
                                        return { ...state, isResizing: false };
                                    });
                                    window.removeEventListener(
                                        'mousemove',
                                        handleLeftMenuResize,
                                    );
                                });
                            }}
                            isMenuResizing={leftMenuResize.isResizing}
                            id="left-dragger"
                        />
                    ) : null}
                </StyledLeftMenu>
                <Screen>{children}</Screen>
                <StyledRightMenu width={rightMenuResize.width} elevation={7}>
                    <StyledDragger
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setRightMenuResize((state) => {
                                return { ...state, isResizing: true };
                            });
                            window.addEventListener(
                                'mousemove',
                                handleRightMenuResize,
                            );
                            window.addEventListener('mouseup', () => {
                                setRightMenuResize((state) => {
                                    return { ...state, isResizing: false };
                                });
                                window.removeEventListener(
                                    'mousemove',
                                    handleRightMenuResize,
                                );
                            });
                        }}
                        isMenuResizing={rightMenuResize.isResizing}
                        id="right-dragger"
                    />
                    <SelectedMenu />
                </StyledRightMenu>
            </StyledDesignerContainer>
        </DesignerContext.Provider>
    );
});
