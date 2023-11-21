import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Button,
    Paper,
    Grid,
    Modal,
    Icon,
    Switch,
    useNotification,
} from '@semoss/ui';
import {
    Delete,
    Lock,
    LockOpen,
    Visibility,
    VisibilityOffRounded,
    MonitorRounded,
} from '@mui/icons-material';
import { SwitchProps } from '@mui/material/Switch';

import { AxiosResponse } from 'axios';

import { useRootStore, usePixel, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_MODE } from './settings.types';

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '13px',
    padding: '5px 13px',
}));

const StyledHr = styled('div')(({ theme }) => ({
    width: '95%',
    height: '1px',
    borderBottom: `1px solid ${theme.palette.secondary.main}`,
    display: 'block',
    margin: '10px auto',
}));

const StyledIcon = styled(Icon)(() => ({
    color: 'rgba(0, 0, 0, .6)',
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
    width: '468px',
    // height: theme.spacing(13),
    height: theme.spacing(10),
    backgroundColor: theme.palette.background.paper,
}));

const StyledGrid = styled(Grid)(() => ({
    flex: '1',
}));

const SwitchSizeMultiplier = 1.3;

const StyledMuiSwitch = styled((props: SwitchProps) => (
    <Switch
        focusVisibleClassName=".Mui-focusVisible"
        disableRipple
        {...props}
    />
))(({ theme }) => ({
    width: 42 * SwitchSizeMultiplier,
    height: 26 * SwitchSizeMultiplier,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 3 * SwitchSizeMultiplier,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: `translateX(${16 * SwitchSizeMultiplier}px)`,
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor:
                    theme.palette.mode === 'dark'
                        ? theme.palette.primary.main
                        : theme.palette.primary.main,
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color:
                theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        //   width: 22,
        //   height: 22,
        width: 20 * SwitchSizeMultiplier,
        height: 20 * SwitchSizeMultiplier,
    },
    '& .MuiSwitch-track': {
        borderRadius: (26 * SwitchSizeMultiplier) / 2,
        // background color for switch off
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

interface SettingsTilesProps {
    /**
     * Mode of setting
     */
    mode: SETTINGS_MODE;

    /**
     * Id of the setting
     */
    id: string;

    /**
     * Name of setting
     */
    name: string;

    /**
     * Callback that is fired on delete
     * @returns
     */
    onDelete?: () => void;

    /**
     * Condensed View
     */
    condensed?: boolean;
}

export const SettingsTiles = (props: SettingsTilesProps) => {
    const { id, mode, name, condensed, onDelete } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [deleteModal, setDeleteModal] = useState(false);
    const [discoverable, setDiscoverable] = useState(false);
    const [global, setGlobal] = useState(false);
    const [loading, setLoading] = useState(false);

    const engineInfo = usePixel(
        mode === 'engine'
            ? adminMode
                ? `AdminEngineInfo(engine='${id}');`
                : `EngineInfo(engine='${id}');`
            : mode === 'app'
            ? adminMode
                ? `AdminProjectInfo(project='${id}')`
                : `ProjectInfo(project='${id}')`
            : '',
    );

    useEffect(() => {
        // pixel call to get pending members
        if (engineInfo.status !== 'SUCCESS' || !engineInfo.data) {
            return;
        }

        if (mode === 'engine') {
            const data = engineInfo.data as {
                database_global: boolean;
                database_discoverable: boolean;
            };

            setDiscoverable(data.database_discoverable);
            setGlobal(data.database_global);
        } else if (mode === 'app') {
            const data = engineInfo.data as {
                project_global: boolean;
                project_discoverable: boolean;
            };

            setDiscoverable(data.project_discoverable);
            setGlobal(data.project_global);
        }
    }, [engineInfo.status, engineInfo.data]);

    /**
     * Delete the item
     */
    const deleteWorkflow = async () => {
        try {
            // start the loading screen
            setLoading(true);

            // run the pixel
            const response = await monolithStore.runQuery(
                mode === 'engine'
                    ? `DeleteEngine(engine=['${id}']);`
                    : mode === 'app'
                    ? `DeleteProject(project=['${id}']);`
                    : '',
            );

            const operationType = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully deleted ${name}`,
                });

                // go back to page before
                onDelete();
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // stop the loading screen
            setLoading(false);
        }
    };

    /**
     * @name changeDiscoverable
     */
    const changeDiscoverable = async () => {
        try {
            // start the loading screen
            setLoading(true);

            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (mode === 'engine') {
                response = await monolithStore.setEngineVisiblity(
                    adminMode,
                    id,
                    !discoverable,
                );
            } else if (mode === 'app') {
                response = await monolithStore.setProjectVisiblity(
                    adminMode,
                    id,
                    !discoverable,
                );
            }

            // ignore if there is no response
            if (!response) {
                return;
            }

            if (response.data.success || response.data) {
                setDiscoverable(!discoverable);

                notification.add({
                    color: 'success',
                    message: `Successfully made ${name} ${
                        !discoverable ? 'discoverable' : 'non-discoverable'
                    }`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${name} ${
                        !discoverable ? 'discoverable' : 'non-discoverable'
                    }`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // stop the loading screen
            setLoading(false);
        }
    };

    /**
     * @name changeGlobal
     */
    const changeGlobal = async () => {
        try {
            // start the loading screen
            setLoading(true);

            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (mode === 'engine') {
                response = await monolithStore.setEngineGlobal(
                    adminMode,
                    id,
                    !global,
                );
            } else if (mode === 'app') {
                response = await monolithStore.setProjectGlobal(
                    adminMode,
                    id,
                    !global,
                );
            }

            // ignore if there is no response
            if (!response) {
                return;
            }

            if (response.data.success) {
                setGlobal(!global);

                notification.add({
                    color: 'success',
                    message: `Successfully made ${name} ${
                        !global ? 'global' : 'private'
                    }`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${name} ${
                        !global ? 'global' : 'private'
                    }`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // stop the loading screen
            setLoading(false);
        }
    };

    /** LOADING */
    if (loading) {
        return <LoadingScreen.Trigger description="Deleting..." />;
    }

    if (condensed) {
        return (
            <Paper sx={{ width: '100%', padding: '8px 5px' }}>
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={
                        <StyledIcon>
                            {global ? <LockOpen /> : <Lock />}
                        </StyledIcon>
                    }
                    action={
                        <StyledMuiSwitch
                            title={
                                global
                                    ? `Make ${name} private`
                                    : `Make ${name} public`
                            }
                            checked={!global}
                            onChange={() => {
                                changeGlobal();
                            }}
                        ></StyledMuiSwitch>
                    }
                >
                    <Alert.Title>{global ? 'Public' : 'Private'}</Alert.Title>
                    {global
                        ? 'All members can access'
                        : 'No one outside of the specified member group can access'}
                </StyledAlert>
                <StyledHr />
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={
                        <StyledIcon>
                            {!discoverable ? (
                                <VisibilityOffRounded />
                            ) : (
                                <Visibility />
                            )}
                        </StyledIcon>
                    }
                    action={
                        <StyledMuiSwitch
                            title={
                                discoverable
                                    ? `Make ${name} non-discoverable`
                                    : `Make ${name} discoverable`
                                // ? `Make ${name} discoverable`
                                // : `Make ${name} non-discoverable`
                            }
                            checked={!discoverable}
                            onChange={() => {
                                changeDiscoverable();
                            }}
                        ></StyledMuiSwitch>
                    }
                >
                    <Alert.Title>
                        {discoverable ? 'Discoverable' : 'Non-Discoverable'}
                    </Alert.Title>
                    Users {discoverable ? 'can' : 'cannot'} request access to
                    this {name} if private
                </StyledAlert>
                <StyledHr />
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={
                        <StyledIcon>
                            <MonitorRounded />
                        </StyledIcon>
                    }
                    action={
                        <StyledButton
                            variant="contained"
                            color="error"
                            onClick={() => setDeleteModal(true)}
                        >
                            Delete
                        </StyledButton>
                    }
                >
                    <Alert.Title>Delete {name}</Alert.Title>

                    {`Permanently delete ${name} form CFG AI Server`}
                </StyledAlert>
                <Modal open={deleteModal}>
                    <Modal.Title>Are you sure?</Modal.Title>
                    <Modal.Content>
                        This action is irreversable. This will permanentely
                        delete this {name}.
                    </Modal.Content>
                    <Modal.Actions>
                        <StyledButton onClick={() => setDeleteModal(false)}>
                            Cancel
                        </StyledButton>
                        <StyledButton
                            color={'error'}
                            variant={'contained'}
                            onClick={() => deleteWorkflow()}
                        >
                            Delete
                        </StyledButton>
                    </Modal.Actions>
                </Modal>
            </Paper>
        );
    } else {
        return (
            <StyledGrid container spacing={3}>
                <Grid item>
                    <StyledAlert
                        icon={
                            <StyledIcon>
                                <Lock />
                            </StyledIcon>
                        }
                        action={
                            <StyledMuiSwitch
                                title={
                                    global
                                        ? `Make ${name} private`
                                        : `Make ${name} public`
                                }
                                checked={global}
                                onChange={() => {
                                    changeGlobal();
                                }}
                            ></StyledMuiSwitch>
                        }
                    >
                        <Alert.Title>
                            {global ? 'Public' : 'Private'}
                        </Alert.Title>
                        {global
                            ? 'All members can access'
                            : 'No one outside of the specified member group can access'}
                    </StyledAlert>
                </Grid>
                <Grid item>
                    <StyledAlert
                        icon={
                            <StyledIcon>
                                {!discoverable ? (
                                    <VisibilityOffRounded />
                                ) : (
                                    <Visibility />
                                )}
                            </StyledIcon>
                        }
                        action={
                            <StyledMuiSwitch
                                title={
                                    discoverable
                                        ? `Make ${name} non-discoverable`
                                        : `Make ${name} discoverable`
                                }
                                checked={discoverable}
                                onChange={() => {
                                    changeDiscoverable();
                                }}
                            ></StyledMuiSwitch>
                        }
                    >
                        <Alert.Title>
                            {discoverable ? 'Discoverable' : 'Non-Discoverable'}
                        </Alert.Title>
                        Users {discoverable ? 'can' : 'cannot'} request access
                        to this {name} if private
                    </StyledAlert>
                </Grid>
                {onDelete ? (
                    <Grid item>
                        <StyledAlert
                            icon={
                                <StyledIcon>
                                    <MonitorRounded />
                                </StyledIcon>
                            }
                            action={
                                <StyledButton
                                    variant="contained"
                                    color="error"
                                    onClick={() => setDeleteModal(true)}
                                >
                                    Delete
                                </StyledButton>
                            }
                        >
                            <Alert.Title>Delete {name}</Alert.Title>
                            Remove {name} from catalog
                        </StyledAlert>
                        <Modal open={deleteModal}>
                            <Modal.Title>Are you sure?</Modal.Title>
                            <Modal.Content>
                                This action is irreversable. This will
                                permanentely delete this {name}.
                            </Modal.Content>
                            <Modal.Actions>
                                <StyledButton
                                    onClick={() => setDeleteModal(false)}
                                >
                                    Cancel
                                </StyledButton>
                                <StyledButton
                                    color={'error'}
                                    variant={'contained'}
                                    onClick={() => deleteWorkflow()}
                                >
                                    Delete
                                </StyledButton>
                            </Modal.Actions>
                        </Modal>
                    </Grid>
                ) : null}
            </StyledGrid>
        );
    }
};
