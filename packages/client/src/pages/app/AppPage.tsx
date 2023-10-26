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
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { AppContext } from '@/contexts';
import { useRootStore } from '@/hooks';
import { AppEditorActions, Navbar } from '@/components/ui';
import { Renderer, CodeDevMode } from '@/components/app';
import { styled } from '@semoss/ui';

const StyledViewport = styled('div')(() => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledContent = styled('div')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

export const AppPage = observer(() => {
    const { monolithStore } = useRootStore();

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
     * TODO - See what type of App we have
     * UI Builder or Template (code-editor)
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
    const [bottomPanelHeight, setBottomPanelHeight] = useState('3.5%');

    const [showConsole, setShowConsole] = useState(false);

    return (
        <AppContext.Provider
            value={{
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
                refreshKey: counter,
                /** Refreshes App */
                refreshApp: refreshOutlet,
            }}
        >
            <StyledViewport>
                <Navbar>
                    {/* Actions to Open Editor Mode */}
                    {(appPermission === 'OWNER' ||
                        appPermission === 'EDIT') && <AppEditorActions />}
                </Navbar>
                <StyledContent>
                    {editMode ? <CodeDevMode /> : <Renderer appId={appId} />}
                </StyledContent>
            </StyledViewport>
        </AppContext.Provider>
    );
});
