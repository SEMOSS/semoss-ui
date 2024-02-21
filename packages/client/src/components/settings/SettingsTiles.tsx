import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Button,
    Paper,
    Grid,
    Modal,
    Switch,
    useNotification,
    Typography,
    Tooltip,
} from '@semoss/ui';

import { AxiosResponse } from 'axios';

import { useRootStore, usePixel, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { SETTINGS_MODE } from './settings.types';

const StyledAlert = styled(Alert)(({ theme }) => ({
    width: '600px',
    height: theme.spacing(13),
    display: 'flex',
    padding: '16px',
    alignItems: 'flex-start',
    gap: '16px',
    flex: '1 0 0',
    alignSelf: 'stretch',
    borderRadius: '12px',
    background: theme.palette.background.paper,
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
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
    const [closeEngineModal, setCloseEngineModal] = useState(false);
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
     * Close the engine for item
     */
    const closeEngine = async () => {
        try {
            // start the loading screen
            setLoading(true);

            // run the pixel
            const response = await monolithStore.runQuery(
                mode === 'engine' ? `CloseEngine(engine=['${id}']);` : '',
            );

            const operationType = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully closed engine for ${name}`,
                });
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
            setCloseEngineModal(false);
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
                    icon={false}
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
                        <Typography variant="body1">Make Public</Typography>
                    </Alert.Title>
                    {`Show ${name} to all users and automatically give them read-only access. Users can request elevated access.`}
                </StyledAlert>
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={false}
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
                        <Typography variant="body1">
                            Make Discoverable
                        </Typography>
                    </Alert.Title>
                    <Typography variant="body2">
                        {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                    </Typography>
                </StyledAlert>
                <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={false}
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
                    <Alert.Title>
                        <Typography variant="body1">Delete</Typography>
                    </Alert.Title>
                    <Typography variant="body2">
                        {`Delete ${name} from catalog.`}
                    </Typography>
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
                {/* <StyledAlert
                    sx={{ width: '100%', boxShadow: 'none' }}
                    icon={false}
                    action={
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setCloseEngineModal(true)}
                        >
                            Close
                        </Button>
                    }
                >
                    <Alert.Title>
                        <Typography variant="body1">Close Engine</Typography>
                    </Alert.Title>
                    <Typography variant="body2">
                        {`Close ${name}'s engine.`}
                    </Typography>
                </StyledAlert>
                <Modal open={closeEngineModal}>
                    <Modal.Title>Are you sure?</Modal.Title>
                    <Modal.Content>
                        This action will close the engine for {name}.
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => setCloseEngineModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            color={'primary'}
                            variant={'contained'}
                            onClick={() => closeEngine()}
                        >
                            Close
                        </Button>
                    </Modal.Actions>
                </Modal> */}
            </Paper>
        );
    } else {
        return (
            <StyledGrid container spacing={3}>
                <Grid item>
                    <StyledAlert
                        icon={false}
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
                            <Typography variant="body1">Make Public</Typography>
                        </Alert.Title>
                        <Typography variant="body2">
                            {`Show ${name} to all users and automatically give them read-only access. Users can request elevated access.`}
                        </Typography>
                    </StyledAlert>
                </Grid>
                {global ? (
                    <Tooltip
                        title={`An ${name} does not need to be discoverable and public.`}
                        placement="top"
                    >
                        <Grid item>
                            <StyledAlert
                                icon={false}
                                action={
                                    <Switch
                                        disabled={global}
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
                                    <Typography variant="body1">
                                        Make Discoverable
                                    </Typography>
                                </Alert.Title>
                                <Typography variant="body2">
                                    {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                                </Typography>
                            </StyledAlert>
                        </Grid>
                    </Tooltip>
                ) : (
                    <Grid item>
                        <StyledAlert
                            icon={false}
                            action={
                                <Switch
                                    disabled={global}
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
                                <Typography variant="body1">
                                    Make Discoverable
                                </Typography>
                            </Alert.Title>
                            <Typography variant="body2">
                                {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                            </Typography>
                        </StyledAlert>
                    </Grid>
                )}
                {onDelete ? (
                    <Grid item>
                        <StyledAlert
                            icon={false}
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
                            <Alert.Title>
                                <Typography variant="body1">Delete</Typography>
                            </Alert.Title>
                            <Typography variant="body2">
                                {`Delete ${name} from catalog.`}
                            </Typography>
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
                {/* <Grid item>
                    <StyledAlert
                        icon={false}
                        action={
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setCloseEngineModal(true)}
                            >
                                Close
                            </Button>
                        }
                    >
                        <Alert.Title>
                            <Typography variant="body1">
                                Close Engine
                            </Typography>
                        </Alert.Title>
                        <Typography variant="body2">
                            {`Close ${name}'s engine.`}
                        </Typography>
                    </StyledAlert>
                    <Modal open={closeEngineModal}>
                        <Modal.Title>Are you sure?</Modal.Title>
                        <Modal.Content>
                            This action will close the engine for {name}.
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => setCloseEngineModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                color={'primary'}
                                variant={'contained'}
                                onClick={() => closeEngine()}
                            >
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal>
                </Grid> */}
            </StyledGrid>
        );
    }
};
