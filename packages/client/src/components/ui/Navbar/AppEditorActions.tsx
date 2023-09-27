import React from 'react';
import { Button, IconButton, useNotification, styled } from '@semoss/ui';
import {
    Code,
    CodeOff,
    Download,
    Settings,
    PersonAdd,
} from '@mui/icons-material';

import { useApp, useRootStore } from '@/hooks';

const NAV_HEIGHT = '48px';
const NAV_FOOTER = '24px';
const SIDEBAR_WIDTH = '56px';

const StyledNavbarChildren = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledNavbarLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    // gap: theme.spacing(2),
}));

const StyledNavbarRight = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
}));

const StyledNavbarItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: selected
        ? theme.palette.primary.main
        : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: selected
            ? theme.palette.primary.main
            : `${theme.palette.primary.dark}4D`,
        transition: 'backgroundColor 2s ease',
    },
}));

const StyledTrack = styled('div', {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    flexShrink: '0',
    width: '52px',
    height: '32px',
    padding: '2px 4px',
    borderRadius: '100px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: active
        ? theme.palette.primary.light
        : theme.palette.grey['500'],
    backgroundColor: active
        ? theme.palette.primary.light
        : theme.palette.action.active,
    '&:hover': {
        borderColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
}));

const StyledHandle = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    left: active ? '16px' : '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '23px',
    color: active ? theme.palette.common.white : theme.palette.common.black,
    backgroundColor: active
        ? theme.palette.primary.main
        : theme.palette.grey['500'],
    '&:hover': {
        backgroundColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
    transition: theme.transitions.create(['left'], {
        duration: theme.transitions.duration.standard,
    }),
}));
export const AppEditorActions = () => {
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const {
        appId,
        editorMode,
        editorView,
        setEditorMode,
        setEditorView,
        setIsLoading,
        isLoading,
    } = useApp();

    /**
     * Method that is called to download the app
     */
    const downloadApp = async () => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // upnzip the file in the new app
            const response = await monolithStore.runQuery(
                `DownloadAsset(filePath=["${path}"], space=["${appId}"]);`,
            );
            const key = response.pixelReturn[0].output;
            if (!key) {
                throw new Error('Error Downloading Asset');
            }

            await monolithStore.download(configStore.store.insightID, key);
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    };

    return (
        <StyledNavbarChildren>
            <StyledNavbarLeft>
                {editorMode ? (
                    <>
                        <StyledNavbarItem
                            selected={editorView === 'code-editor'}
                            onClick={() => {
                                setEditorView('code-editor');
                            }}
                        >
                            <CodeOff />
                        </StyledNavbarItem>
                        <StyledNavbarItem
                            selected={editorView === 'settings'}
                            onClick={() => {
                                setEditorView('settings');
                            }}
                        >
                            <Settings />
                        </StyledNavbarItem>
                        <StyledNavbarItem
                            selected={editorView === 'permissions'}
                            onClick={() => {
                                setEditorView('permissions');
                            }}
                        >
                            <PersonAdd />
                        </StyledNavbarItem>
                    </>
                ) : null}
            </StyledNavbarLeft>
            <StyledNavbarRight>
                <StyledTrack
                    active={editorMode}
                    onClick={() => {
                        setEditorMode(!editorMode);
                    }}
                >
                    <StyledHandle active={editorMode}>
                        <Code />
                    </StyledHandle>
                </StyledTrack>
                <Button
                    size={'small'}
                    color={'primary'}
                    variant={'outlined'}
                    onClick={() => {
                        downloadApp();
                    }}
                >
                    <Download />
                </Button>
            </StyledNavbarRight>
        </StyledNavbarChildren>
    );
};
