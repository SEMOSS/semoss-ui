import React, { useState } from 'react';
import {
    Button,
    IconButton,
    Modal,
    TextField,
    Tabs,
    useNotification,
    styled,
    Typography,
} from '@semoss/ui';
import {
    Code,
    CodeOff,
    Download,
    Settings,
    PersonAdd,
} from '@mui/icons-material';

import { useApp, useRootStore } from '@/hooks';
import { Env } from '@/env';

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

const StyledShareButton = styled(Button)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '600px',
    gap: theme.spacing(2),
}));

const StyledTabsContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
}));

const StyledGap = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
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

    const [shareModal, setShareModal] = useState(false);
    const [shareModalTab, setShareModalTab] = useState(0);

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
                {/* <Button
                    size={'small'}
                    color={'primary'}
                    variant={'outlined'}
                    onClick={() => {
                        downloadApp();
                    }}
                >
                    <Download />
                </Button> */}
                <StyledShareButton
                    variant={'outlined'}
                    color="secondary"
                    onClick={() => {
                        setShareModal(true);
                    }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="19"
                        height="18"
                        viewBox="0 0 19 18"
                        fill="none"
                    >
                        <path
                            d="M14 12.06C13.43 12.06 12.92 12.285 12.53 12.6375L7.1825 9.525C7.22 9.3525 7.25 9.18 7.25 9C7.25 8.82 7.22 8.6475 7.1825 8.475L12.47 5.3925C12.875 5.7675 13.4075 6 14 6C15.245 6 16.25 4.995 16.25 3.75C16.25 2.505 15.245 1.5 14 1.5C12.755 1.5 11.75 2.505 11.75 3.75C11.75 3.93 11.78 4.1025 11.8175 4.275L6.53 7.3575C6.125 6.9825 5.5925 6.75 5 6.75C3.755 6.75 2.75 7.755 2.75 9C2.75 10.245 3.755 11.25 5 11.25C5.5925 11.25 6.125 11.0175 6.53 10.6425L11.87 13.7625C11.8325 13.92 11.81 14.085 11.81 14.25C11.81 15.4575 12.7925 16.44 14 16.44C15.2075 16.44 16.19 15.4575 16.19 14.25C16.19 13.0425 15.2075 12.06 14 12.06ZM14 3C14.4125 3 14.75 3.3375 14.75 3.75C14.75 4.1625 14.4125 4.5 14 4.5C13.5875 4.5 13.25 4.1625 13.25 3.75C13.25 3.3375 13.5875 3 14 3ZM5 9.75C4.5875 9.75 4.25 9.4125 4.25 9C4.25 8.5875 4.5875 8.25 5 8.25C5.4125 8.25 5.75 8.5875 5.75 9C5.75 9.4125 5.4125 9.75 5 9.75ZM14 15.015C13.5875 15.015 13.25 14.6775 13.25 14.265C13.25 13.8525 13.5875 13.515 14 13.515C14.4125 13.515 14.75 13.8525 14.75 14.265C14.75 14.6775 14.4125 15.015 14 15.015Z"
                            fill="#EBEEFE"
                        />
                    </svg>
                    Share
                </StyledShareButton>
            </StyledNavbarRight>
            <Modal open={shareModal}>
                <StyledModalContent>
                    <Tabs
                        value={shareModalTab}
                        onChange={(event, value: number) => {
                            setShareModalTab(value);
                        }}
                    >
                        <Tabs.Item label="URL"></Tabs.Item>
                        <Tabs.Item disabled label="REST API"></Tabs.Item>
                        <Tabs.Item disabled label="iframe"></Tabs.Item>
                    </Tabs>
                    {shareModalTab === 0 && (
                        <StyledTabsContent>
                            <Typography variant="subtitle1">
                                Share a link for external use
                            </Typography>
                            <StyledGap>
                                <TextField
                                    disabled
                                    size="small"
                                    sx={{ width: '90%' }}
                                    value={`${Env.MODULE}/public_home/${appId}/portals/`}
                                />
                                <Button
                                    variant={'outlined'}
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `${Env.MODULE}/public_home/${appId}/portals/`,
                                        );
                                        notification.add({
                                            color: 'success',
                                            message:
                                                'Succesfully copied to clipboard',
                                        });
                                    }}
                                >
                                    Copy
                                </Button>
                            </StyledGap>
                        </StyledTabsContent>
                    )}
                    {shareModalTab === 1 && (
                        <StyledTabsContent>
                            <Typography variant="subtitle1">
                                Share the Rest API
                            </Typography>
                        </StyledTabsContent>
                    )}
                    {shareModalTab === 2 && (
                        <StyledTabsContent>
                            <Typography variant="subtitle1">
                                Share the iframe?
                            </Typography>
                        </StyledTabsContent>
                    )}
                </StyledModalContent>
                <Modal.Actions>
                    <Button onClick={() => setShareModal(false)}>Cancel</Button>
                </Modal.Actions>
            </Modal>
        </StyledNavbarChildren>
    );
};
