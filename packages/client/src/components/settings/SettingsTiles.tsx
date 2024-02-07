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
} from '@/component-library';
import {
    Delete,
    Lock,
    Visibility,
    VisibilityOffRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { useRootStore, usePixel, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_MODE } from './settings.types';

const StyledIcon = styled(Icon)(() => ({
    color: 'rgba(0, 0, 0, .5)',
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
    width: '468px',
    height: theme.spacing(13),
    backgroundColor: theme.palette.background.paper,
    padding: '8px, 0',
    '.MuiAlert-root': {
        background: 'rgba(100,0,150, 0.4)',
    },
    '.MuiAlert-action': {
        paddingRight: '8px',
    },
}));

const StyledGrid = styled(Grid)(() => ({
    flex: '1',
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

    const { monolithStore, configStore } = useRootStore();
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
                    message: `Successfully made ${name} discoverable`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${name} discoverable`,
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
                    message: `Successfully made ${name} global`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${name} global`,
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
            <Paper sx={{ width: '100%' }}>
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={
                        <StyledIcon>
                            <Lock />
                        </StyledIcon>
                    }
                    action={
                        <Switch
                            title={
                                global
                                    ? `Make ${name} private`
                                    : `Make ${name} public`
                            }
                            checked={global}
                            disabled={
                                configStore.store.config[
                                    'adminOnlyProjectSetPublic'
                                ] && !configStore.store.user.admin
                            }
                            onChange={() => {
                                changeGlobal();
                            }}
                        ></Switch>
                    }
                >
                    <Alert.Title>{global ? 'Public' : 'Private'}</Alert.Title>
                    {global
                        ? 'All members can access'
                        : 'No one outside of the specified member group can access'}
                </StyledAlert>
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
                        <Switch
                            title={
                                discoverable
                                    ? `Make ${name} non-discoverable`
                                    : `Make ${name} discoverable`
                            }
                            checked={discoverable}
                            onChange={() => {
                                changeDiscoverable();
                            }}
                        ></Switch>
                    }
                >
                    <Alert.Title>
                        {discoverable ? 'Discoverable' : 'Non-Discoverable'}
                    </Alert.Title>
                    Users {discoverable ? 'can' : 'cannot'} request access to
                    this {name} if private
                </StyledAlert>
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={
                        <StyledIcon>
                            <Delete />
                        </StyledIcon>
                    }
                    action={
                        <Button
                            variant="contained"
                            color="error"
                            disabled={
                                configStore.store.config[
                                    'adminOnlyProjectDelete'
                                ] && !configStore.store.user.admin
                            }
                            onClick={() => setDeleteModal(true)}
                        >
                            Delete
                        </Button>
                    }
                >
                    <Alert.Title>Delete {name}</Alert.Title>
                    Remove {name} from catalog
                </StyledAlert>
                <Modal open={deleteModal}>
                    <Modal.Title>Are you sure?</Modal.Title>
                    <Modal.Content>
                        This action is irreversable. This will permanentely
                        delete this {name}.
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => setDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            color={'error'}
                            variant={'contained'}
                            onClick={() => deleteWorkflow()}
                        >
                            Delete
                        </Button>
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
                            <Switch
                                title={
                                    global
                                        ? `Make ${name} private`
                                        : `Make ${name} public`
                                }
                                checked={global}
                                disabled={
                                    configStore.store.config[
                                        'adminOnlyProjectSetPublic'
                                    ] && !configStore.store.user.admin
                                }
                                onChange={() => {
                                    changeGlobal();
                                }}
                            ></Switch>
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
                            <Switch
                                title={
                                    discoverable
                                        ? `Make ${name} non-discoverable`
                                        : `Make ${name} discoverable`
                                }
                                checked={discoverable}
                                onChange={() => {
                                    changeDiscoverable();
                                }}
                            ></Switch>
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
                                    <Delete />
                                </StyledIcon>
                            }
                            action={
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => setDeleteModal(true)}
                                >
                                    Delete
                                </Button>
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
                                <Button onClick={() => setDeleteModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    color={'error'}
                                    variant={'contained'}
                                    onClick={() => deleteWorkflow()}
                                >
                                    Delete
                                </Button>
                            </Modal.Actions>
                        </Modal>
                    </Grid>
                ) : null}
            </StyledGrid>
        );
    }
};
