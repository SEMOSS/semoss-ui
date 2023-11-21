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
    Share,
    Settings,
    PersonAdd,
} from '@mui/icons-material';

import { useApp, useRootStore } from '@/hooks';
import { Env } from '@/env';

const NAV_HEIGHT = '48px';
const NAV_FOOTER = '24px';
const SIDEBAR_WIDTH = '56px';

const tempTheme = {
    palette: {
        primary: {
            main: '#26890D',
            // light: '#86BC25',
            light: '#C4DD98',
            dark: '#046A38',
        },
        action: {
            hoverOpacity: 0.8,
        },
        grey: {
            ['500']: '#6D6D6D4D',
        },
    },
};

const SearchBarPlaceholder = styled('input')(({ theme }) => ({
    backgroundColor: '#fff',
    color: '#000',
    display: 'block',
    width: '300px',
    border: '1px solid white',
    borderRadius: '5px',
    fontSize: '14px',
    padding: '5px 10px',
}));

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
    // color: selected
    //     ? theme.palette.common.black
    //     : 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: selected
        ? // ? tempTheme.palette.primary.main
          tempTheme.palette.grey[500]
        : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: selected
            ? // ? tempTheme.palette.primary.main
              // : `${tempTheme.palette.primary.dark}4D`,
              // : `${tempTheme.palette.primary.dark}`,
              // : `${theme.palette.primary.dark}`,
              tempTheme.palette.grey[500]
            : `${tempTheme.palette.primary.main}`,
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
        ? tempTheme.palette.primary.light
        : theme.palette.grey['500'],
    backgroundColor: active
        ? tempTheme.palette.primary.light
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
        ? tempTheme.palette.primary.main
        : theme.palette.grey['500'],
    '&:hover': {
        backgroundColor: active
            ? // ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
              `${tempTheme.palette.primary.main}AA`
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
    padding: '15px 15px 15px 15px',
}));

const StyledModalActions = styled(Modal.Actions)(({ theme }) => ({
    padding: '0px 15px 15px 15px',
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

    const ShareSaveHandler = () => {
        alert('ShareSaveHandler()');
        setShareModal(false);
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
                            <Code />
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

            {/* <StyledNavbarRight>
                <SearchBarPlaceholder/>
            </StyledNavbarRight> */}

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
                    color={'secondary'}
                    variant={'outlined'}
                    onClick={() => {
                        downloadApp();
                    }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <Download /> Download
                </Button>
                <Button
                    size={'small'}
                    color={'secondary'}
                    variant={'outlined'}
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
                    <Share /> Share
                </Button>
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
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    paddingBottom: '20px',
                                    paddingLeft: '10px',
                                }}
                            >
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
                <StyledModalActions>
                    <Button
                        onClick={() => setShareModal(false)}
                        size={'medium'}
                        color={'primary'}
                        variant={'outlined'}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={ShareSaveHandler}
                        size={'medium'}
                        color={'primary'}
                        variant={'contained'}
                    >
                        Save
                    </Button>
                </StyledModalActions>
            </Modal>
        </StyledNavbarChildren>
    );
};
