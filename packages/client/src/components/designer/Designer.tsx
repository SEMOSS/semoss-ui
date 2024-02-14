import { observer } from 'mobx-react-lite';
import { styled, Stack, Paper } from '@semoss/ui';
import { DashboardRounded, Layers } from '@mui/icons-material';
import { useMemo, useState } from 'react';

import { DesignerContext } from '@/contexts';
import { DesignerStore } from '@/stores';
import { useBlocks } from '@/hooks';
import { Sidebar, SidebarItem } from '@/components/common';
import { Renderer } from '@/components/blocks';

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

const ACTIVE = 'page-1';

export const Designer = observer((): JSX.Element => {
    const { state } = useBlocks();

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
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        // return the store
        return new DesignerStore(state, {
            rendered: ACTIVE,
        });
    }, [state]);

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

    if (!designer) {
        return null;
    }

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
                    <Sidebar>
                        <SidebarItem
                            selected={view === 'outline'}
                            onClick={() => updateView('outline')}
                        >
                            <Layers color="inherit" />
                        </SidebarItem>
                        {/* <SidebarItem
                            selected={view === 'query'}
                            onClick={() => updateView('query')}
                        >
                            <DataObject color="inherit" />
                        </SidebarItem> */}
                        <SidebarItem
                            selected={view === 'add'}
                            onClick={() => updateView('add')}
                        >
                            <DashboardRounded color="inherit" />
                        </SidebarItem>
                    </Sidebar>
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
                <Screen>
                    <Renderer id={designer.rendered} />
                </Screen>
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
