/**
 * ---------------------------*------------------------------------
 * This will be your app page, what this component does is
 * really is to handle the layout and switching between the
 * different { editor mode } nav items.
 *
 * - We have a Resizable Bottom Panel for the console.
 * - The Bigger Components that get consumed here are:
 *      - AppEditorPanel (also resizable), AppConsole, AppRenderer
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
import { styled } from '@semoss/ui';

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

const StyledRightPanel = styled('div')(({ theme }) => ({}));

const StyledVertDivider = styled('div')(({ theme }) => ({
    width: theme.spacing(0.25),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'ew-resize',
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
            // setTopPanelHeight('96.5%');
            if (configStore.store.user.admin) {
                setEditorView('code-editor');
            } else {
                setEditorView('settings');
            }
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
            if (!configStore.store.user.admin) {
                return;
            }
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
    const [topPanelHeight, setTopPanelHeight] = useState('100%');
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
                    {appPermission === 'OWNER' && <AppEditorActions />}
                </Navbar>

                {/* Top Panel: Contains Editor and Renderer */}
                <StyledTopPanel sx={{ height: topPanelHeight }}>
                    {editMode && (
                        <StyledLeftPanel sx={{ width: leftPanelWidth }}>
                            {/* Left Panel for Editor Mode */}
                            <AppEditorPanel />
                            <StyledVertDivider
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    window.addEventListener(
                                        'mousemove',
                                        handleHorizontalResize,
                                    );
                                    window.addEventListener('mouseup', () => {
                                        window.removeEventListener(
                                            'mousemove',
                                            handleHorizontalResize,
                                        );
                                    });
                                }}
                            />
                        </StyledLeftPanel>
                    )}

                    <StyledRightPanel
                        sx={{ width: !editMode ? '100%' : rightPanelWidth }}
                    >
                        {/* Right Panel that Renders our App */}
                        <AppRenderer
                            key={counter}
                            counter={counter}
                            appId={appId}
                        ></AppRenderer>
                    </StyledRightPanel>
                </StyledTopPanel>

                {/* Only when in Editor Mode: Resizable Bottom Panel  */}
                {editMode ? (
                    <StyledBottomPanel sx={{ height: bottomPanelHeight }}>
                        <StyledHorizDivider
                            onMouseDown={(e) => {
                                e.preventDefault();
                                window.addEventListener(
                                    'mousemove',
                                    handleVerticalResize,
                                );
                                window.addEventListener('mouseup', () => {
                                    window.removeEventListener(
                                        'mousemove',
                                        handleVerticalResize,
                                    );
                                });
                            }}
                        ></StyledHorizDivider>
                        {/* App Console */}
                        <AppConsole />
                    </StyledBottomPanel>
                ) : null}
            </AppContext.Provider>
        </StyledViewport>
    );
});
