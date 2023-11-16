import { useEffect, useMemo, useState } from 'react';

import { DesignerStore, StateStore } from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { styled } from '@semoss/ui';
import { Navbar } from '@/components/ui';
import { useParams } from 'react-router-dom';
import { AppContext } from '@/contexts';
import { DesignerEditorActions } from '@/components/designer/DesignerEditorActions';
import { useRootStore } from '@/hooks';

// const NAV_HEIGHT = '48px';
const NAV_HEIGHT = '0px';

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

const ACTIVE = 'page-1';

export const DesignPage = () => {
    const { monolithStore } = useRootStore();

    // App ID Needed for pixel calls
    const { appId } = useParams();

    const [appPermission, setAppPermission] = useState('READ_ONLY');
    const [editMode, setEditMode] = useState<boolean>(true);
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
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        const d = new DesignerStore(StateStore);

        // set the rendered one
        d.setRendered(ACTIVE);

        // return the store
        return d;
    }, [StateStore]);

    /**
     * @desc Refreshes the inner Iframe/Application
     */
    const refreshOutlet = () => {
        setCounter((c) => {
            return c + 1;
        });
    };

    /**
     * @desc Determines whether user is allowed to edit or export the app in view
     */
    const getAppPermission = async () => {
        // TODO: Set up project creation
        // const response = await monolithStore.getUserProjectPermission(appId);
        setAppPermission('OWNER');
    };

    /**
     * Turns Edit Mode off and handles layout
     * @param mode
     */
    const switchEditorMode = (mode: boolean) => {
        setEditMode(mode);
        setEditorView('');
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

    return (
        // TODO: Fix
        <AppContext.Provider
            value={{
                /** App Id */
                appId: appId,
                /** Type */
                type: 'blocks',
                /** Current Permission */
                permission: appPermission,
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
            }}
        >
            <StyledViewport>
                {/* <Navbar>
                    {(appPermission === 'OWNER' ||
                        appPermission === 'EDIT') && (
                        <DesignerEditorActions />
                    )}
                </Navbar> */}
                <StyledContent>
                    <Blocks state={StateStore} registry={DefaultBlocks}>
                        {/* {editMode ? (
                            <Designer designer={designer}>
                                <Renderer id={ACTIVE} />
                            </Designer>
                        ) : (
                            <Renderer id={ACTIVE} />
                        )} */}
                        <Designer designer={designer}>
                            <Renderer id={ACTIVE} />
                        </Designer>
                    </Blocks>
                </StyledContent>
            </StyledViewport>
        </AppContext.Provider>
    );
};
