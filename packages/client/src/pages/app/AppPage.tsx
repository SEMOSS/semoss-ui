import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@semoss/ui';

import { AppContext } from '@/contexts';
import { useAPI, usePixel } from '@/hooks';
import { Navbar, LoadingScreen } from '@/components/ui';

import { AppActions, AppView } from '@/components/app';

const NAV_HEIGHT = '48px';

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
    paddingTop: NAV_HEIGHT,
}));

export const AppPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const notification = useNotification();

    const [appEditorFiles, setAppEditorFiles] = useState([]);

    const [editMode, setEditMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [counter, setCounter] = useState(0);
    const [view, setView] = useState<
        'code-editor' | 'settings' | 'permissions' | ''
    >('');

    // get the permission
    const getUserProjectPermission = useAPI([
        'getUserProjectPermission',
        appId,
    ]);

    // get the metadata if the permissions come back
    const getAppInfo = usePixel<{
        project_type?: 'blocks' | 'custom';
    }>(
        getUserProjectPermission.status === 'SUCCESS'
            ? `ProjectInfo(project=["${appId}"]);`
            : '',
    );

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

    /**
     * @desc Refreshes the inner Iframe/Application
     */
    const refreshOutlet = () => {
        setCounter((c) => {
            return c + 1;
        });
    };

    // throw an error if unable to authenticate
    if (getUserProjectPermission.status === 'ERROR') {
        notification.add({
            color: 'error',
            message: 'Unable to authenticate',
        });

        return <Navigate to="/" />;
    }

    if (getUserProjectPermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking permissions" />;
    }

    // get the permission
    const permission = getUserProjectPermission.data.permission || 'READ_ONLY';

    if (getAppInfo.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    // const type = getAppInfo.data.project_type;
    const type = 'custom';

    return (
        <AppContext.Provider
            value={{
                /** App Id */
                appId: appId,
                /** Type */
                type: type,
                /** Current Permission */
                permission: permission,
                /** Needed for panels in view and navigation */
                editorMode: editMode,
                /** Editor View (code-editor, settings, permissions) */
                editorView: view,
                /** Loading */
                isLoading: isLoading,
                /** Turns edit mode on/off */
                setEditorMode: switchEditorMode,
                /** Changes Layout */
                setEditorView: setEditorView,
                /** Set Loading */
                setIsLoading: setIsLoading,
                /** Refreshes App */
                refreshKey: counter,
                /** Refreshes App */
                refreshApp: refreshOutlet,
                appEditorFiles,
                setAppEditorFiles,
            }}
        >
            <StyledViewport>
                <Navbar>
                    {/* Actions for edit mode */}
                    {(permission === 'OWNER' || permission === 'EDIT') && (
                        <AppActions />
                    )}
                </Navbar>
                <StyledContent>
                    <AppView />
                </StyledContent>
            </StyledViewport>
        </AppContext.Provider>
    );
});
