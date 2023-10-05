/**
 * ---------------------------*------------------------------------
 * This will be your app page, what this component
 * really does is handle the layout and switching between the
 * different { editor mode } nav items.
 *
 * - We have a Resizable Bottom Panel for the console. (Removed)
 *      - AppConsole
 * - Resizable Left Right Panel
 *      - AppEditorPanel (also resizable),
 * - The Bigger Components that get consumed here are:
 *      - AppEditorPanel, AppConsole, AppRenderer
 *
 * Update: 9/28/2023 -
 * Bottom Debug Console commented out so no horizontal bottom panel resize
 * ---------------------------*------------------------------------
 *
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AppContext, AppContextType } from '@/contexts';
import { useRootStore } from '@/hooks';
import { AppEditorActions, Navbar } from '@/components/ui';
import { AppRenderer, AppConsole, AppEditorPanel } from '@/components/app';
import { styled, Button, ThemeProvider } from '@semoss/ui';

// Styles --------------------------------------*
const NAV_HEIGHT = '48px';
const NAV_FOOTER = '24px';
const SIDEBAR_WIDTH = '56px';

const StyledViewport = styled('div')(({ theme }) => ({
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledTopPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    paddingTop: NAV_HEIGHT,
}));

const StyledLeftPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledRightPanel = styled('div')(({ theme }) => ({
    position: 'relative',
}));

const StyledVertDivider = styled('div')(({ theme }) => ({
    width: theme.spacing(0.5),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'col-resize',
    },
}));

const StyledHorizDivider = styled('div')(({ theme }) => ({
    height: theme.spacing(0.25),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'ns-resize',
    },
}));

const StyledBottomPanel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'absolute',
    bottom: '0',
    width: '100%',
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    background: theme.palette.secondary.main,
    zIndex: 9999, // App Editor scroll bar hovers over this
}));

export const AppPage = observer(() => {
    const { monolithStore, configStore } = useRootStore();

    // App ID Needed for pixel calls
    const { appId } = useParams();

    const [appPermission, setAppPermission] = useState('READ_ONLY');
    const [editMode, setEditMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [counter, setCounter] = useState(0);
    const [view, setView] = useState<
        'code-editor' | 'settings' | 'permissions' | ''
    >('');
    const [transparentOverlay, setTransparentOverlay] = useState(false);

    /**
     * Effects
     */
    useEffect(() => {
        getAppPermission();
        return () => {
            // disable edit
            setAppPermission('READ_ONLY');
        };
    }, []);

    /**
     * @desc Determines whether user is allowed to edit or export the app in view
     */
    const getAppPermission = async () => {
        const response = await monolithStore.getUserProjectPermission(appId);

        setAppPermission(response.permission);
    };

    /**
     * Turns Edit Mode off and handles layout
     * @param mode
     */
    const switchEditorMode = (mode: boolean) => {
        setEditMode(mode);
        if (mode) {
            setEditorView('code-editor');
        } else {
            // setTopPanelHeight('100%');
            setEditorView('');
        }
    };

    /**
     * @desc handle changes for navigation in editor mode (setting, editor, access)
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const setEditorView = (
        newValue: 'code-editor' | 'settings' | 'permissions' | '',
    ) => {
        if (newValue === 'code-editor') {
            setLeftPanelWidth('55%');
            setRightPanelWidth('45%');
        } else {
            setLeftPanelWidth('25%');
            setRightPanelWidth('75%');
        }
        setView(newValue);
    };

    const setConsoleHeight = () => {
        if (bottomPanelHeight === '3.5%') {
            setShowConsole(true);
            setBottomPanelHeight('25%');
        } else {
            setShowConsole(false);
            setBottomPanelHeight('3.5%');
        }
    };

    /**
     * @desc Refreshes the inner Iframe/Application
     */
    const refreshOutlet = () => {
        setCounter((c) => {
            return c + 1;
        });
    };

    /**
     * Resizing of Panels Code
     */
    const [topPanelHeight, setTopPanelHeight] = useState('96.5%');
    const [bottomPanelHeight, setBottomPanelHeight] = useState('3.5%');

    const [leftPanelWidth, setLeftPanelWidth] = useState('50%');
    const [rightPanelWidth, setRightPanelWidth] = useState('45%');

    const [showConsole, setShowConsole] = useState(false);

    const handleVerticalResize = (e) => {
        const bottomPanelHeight =
            (window.innerHeight - e.clientY) / window.innerHeight;
        const newBottomPanelHeight = `${bottomPanelHeight * 100}%`;
        const newTopPanelHeight = `${(e.clientY / window.innerHeight) * 100}%`;

        if (bottomPanelHeight < 0.035) {
            setShowConsole(false);
        } else {
            // Since position is absolute on the bottom panel we do not have to reset Top panel height
            // setTopPanelHeight(newTopPanelHeight);
            setBottomPanelHeight(newBottomPanelHeight);
            setShowConsole(true);
        }
    };

    const handleHorizontalResize = (e) => {
        const containerWidth = window.innerWidth;
        const rightContainerWidth =
            ((containerWidth - e.clientX) / containerWidth) * 100;
        const leftContainerWidth = (e.clientX / containerWidth) * 100;

        const newRightPanelWidthPercentage = `${rightContainerWidth}%`;
        const newLeftPanelWidthPercentage = `${leftContainerWidth}%`;

        const parsedLeftPanelWidth = Math.floor(leftContainerWidth);
        // Prevent Code Editor from being resized to small
        if (view === 'code-editor' && parsedLeftPanelWidth < 15) {
            return;
        }
        // Transparency Overlay allows dragging over iframe and removal of event listener
        setTransparentOverlay(true);

        setLeftPanelWidth(newLeftPanelWidthPercentage);
        setRightPanelWidth(newRightPanelWidthPercentage);
    };

    /**
     * Value to pass for App Context
     */
    const value: AppContextType = {
        /** App Id */
        appId: appId,
        /** Current Permission */
        permission: appPermission,
        /** Needed for panels in view and navigation */
        editorMode: editMode,
        /** Editor View (code-editor, settings, permissions) */
        editorView: view,
        /** Is our App Console Open */
        openConsole: showConsole,
        /** Loading */
        isLoading: isLoading,
        /** Turns edit mode on/off */
        setEditorMode: switchEditorMode,
        /** Changes Layout */
        setEditorView: setEditorView,
        /** Opens and closes console */
        setOpenConsole: setConsoleHeight,
        /** Set Loading */
        setIsLoading: setIsLoading,
        /** Refreshes App */
        refreshApp: refreshOutlet,
    };

    return (
        <StyledViewport>
            <AppContext.Provider value={value}>
                <Navbar>
                    {/* Actions to Open Editor Mode */}
                    {(configStore.store.user.admin ||
                        appPermission === 'OWNER' ||
                        appPermission === 'EDIT') && <AppEditorActions />}
                </Navbar>

                {/* Top Panel: Contains Editor and Renderer */}
                <StyledTopPanel
                    sx={{
                        // height: editMode ? '96.5%' : '100%',
                        height: '100%',
                    }}
                >
                    {editMode && (
                        <StyledLeftPanel sx={{ width: leftPanelWidth }}>
                            {/* Left Panel for Editor Mode, should be Dark Mode */}
                            <ThemeProvider reset={true} type={'light'}>
                                <AppEditorPanel width={leftPanelWidth} />
                                <StyledVertDivider
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        window.addEventListener(
                                            'mousemove',
                                            handleHorizontalResize,
                                        );
                                        window.addEventListener(
                                            'mouseup',
                                            () => {
                                                window.removeEventListener(
                                                    'mousemove',
                                                    handleHorizontalResize,
                                                );
                                                setTransparentOverlay(false);
                                            },
                                        );
                                    }}
                                />
                            </ThemeProvider>
                        </StyledLeftPanel>
                    )}
                    {/* Right Panel that Renders our App */}
                    <StyledRightPanel
                        sx={{ width: !editMode ? '100%' : rightPanelWidth }}
                    >
                        {/* Allows you to drag over the iframe, if you remove this resizing is buggy */}
                        {transparentOverlay ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    opacity: '0.8',
                                    zIndex: 9999,
                                }}
                            ></div>
                        ) : null}
                        <AppRenderer
                            key={counter}
                            appId={appId}
                            counter={counter}
                            editMode={editMode}
                            refreshApp={refreshOutlet}
                        ></AppRenderer>
                    </StyledRightPanel>
                </StyledTopPanel>

                {/* Only when in Editor Mode: Resizable Bottom Panel  */}
                {
                    // editMode ? (
                    //     <StyledBottomPanel sx={{ height: bottomPanelHeight }}>
                    //         <StyledHorizDivider
                    //             onMouseDown={(e) => {
                    //                 e.preventDefault();
                    //                 window.addEventListener(
                    //                     'mousemove',
                    //                     handleVerticalResize,
                    //                 );
                    //                 window.addEventListener('mouseup', () => {
                    //                     window.removeEventListener(
                    //                         'mousemove',
                    //                         handleVerticalResize,
                    //                     );
                    //                 });
                    //             }}
                    //         ></StyledHorizDivider>
                    //         {/* App Console */}
                    //         <AppConsole />
                    //     </StyledBottomPanel>
                    // ) : null
                }
            </AppContext.Provider>
        </StyledViewport>
    );
});
