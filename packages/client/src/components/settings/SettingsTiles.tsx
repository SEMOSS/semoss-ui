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
    Stack,
} from '@semoss/ui';

import { AxiosResponse } from 'axios';

import { ALL_TYPES } from '@/types';
import { useRootStore, usePixel, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledAlert = styled(Alert, {
    shouldForwardProp: (prop) => prop !== 'setBounds',
})<{ setBounds?: boolean }>(({ theme, setBounds }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    padding: '16px',
    alignItems: 'flex-start',
    gap: '16px',
    flex: '1 0 0',
    alignSelf: 'stretch',
    borderRadius: '12px',
    color: theme.palette.text.primary,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.border}`,
    '.MuiAlert-action': {
        paddingRight: '8px',
    },

    ...(setBounds && {
        height: theme.spacing(13),
        width: '600px',
    }),
}));

const StyledGrid = styled(Grid)(() => ({
    flex: '1',
}));

const StyledTypography = styled(Typography)<{
    // Track if discoverable will be disabled or not
    isDisabled: boolean;
}>(({ isDisabled, theme }) => ({
    color: isDisabled ? theme.palette.text.disabled : 'inherit',
}));

interface SettingsTilesProps {
    /**
     * Type of setting
     */
    type: ALL_TYPES;

    /**
     * Id of the setting
     */
    id: string;

    /**
     * Name of the setting
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

    /**
     * diection: stack tiles vertically or horizontally
     */
    direction?: 'column' | 'row';
}

export const SettingsTiles = (props: SettingsTilesProps) => {
    const { id, type, name, condensed, onDelete, direction = 'column' } = props;

    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [deleteModal, setDeleteModal] = useState(false);
    const [closeEngineModal, setCloseEngineModal] = useState(false);
    const [discoverable, setDiscoverable] = useState(false);
    const [global, setGlobal] = useState(false);
    const [loading, setLoading] = useState(false);

    const engineInfo = usePixel(
        type === 'DATABASE' ||
            type === 'STORAGE' ||
            type === 'MODEL' ||
            type === 'VECTOR' ||
            type === 'FUNCTION'
            ? adminMode
                ? `AdminEngineInfo(engine='${id}');`
                : `EngineInfo(engine='${id}');`
            : type === 'APP'
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

        if (
            type === 'DATABASE' ||
            type === 'STORAGE' ||
            type === 'MODEL' ||
            type === 'VECTOR' ||
            type === 'FUNCTION'
        ) {
            const data = engineInfo.data as {
                database_global: boolean;
                database_discoverable: boolean;
            };

            setDiscoverable(data.database_discoverable);
            setGlobal(data.database_global);
        } else if (type === 'APP') {
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
                type === 'DATABASE' ||
                    type === 'STORAGE' ||
                    type === 'MODEL' ||
                    type === 'VECTOR' ||
                    type === 'FUNCTION'
                    ? `DeleteEngine(engine=['${id}']);`
                    : type === 'APP'
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
                type === 'DATABASE' ||
                    type === 'STORAGE' ||
                    type === 'MODEL' ||
                    type === 'VECTOR' ||
                    type === 'FUNCTION'
                    ? `CloseEngine(engine=['${id}']);`
                    : '',
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
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.setEngineVisiblity(
                    adminMode,
                    id,
                    !discoverable,
                );
            } else if (type === 'APP') {
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
            if (
                type === 'DATABASE' ||
                type === 'STORAGE' ||
                type === 'MODEL' ||
                type === 'VECTOR' ||
                type === 'FUNCTION'
            ) {
                response = await monolithStore.setEngineGlobal(
                    adminMode,
                    id,
                    !global,
                );
            } else if (type === 'APP') {
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
                <Stack direction={direction}>
                    <StyledAlert
                        setBounds={direction === 'column'}
                        sx={{ width: '100%' }}
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
                    {global ? (
                        <Tooltip
                            title={`An ${name} does not need to be discoverable and public.`}
                            placement="top"
                        >
                            <StyledAlert
                                setBounds={direction === 'column'}
                                sx={{ width: '100%' }}
                                icon={false}
                                action={
                                    <Switch
                                        title={
                                            discoverable
                                                ? `Make ${name} non-discoverable`
                                                : `Make ${name} discoverable`
                                        }
                                        disabled={global}
                                        checked={discoverable}
                                        onChange={() => {
                                            changeDiscoverable();
                                        }}
                                    ></Switch>
                                }
                            >
                                <Alert.Title>
                                    <StyledTypography
                                        variant="body1"
                                        isDisabled={true}
                                    >
                                        Make Discoverable
                                    </StyledTypography>
                                </Alert.Title>
                                <StyledTypography
                                    variant="body2"
                                    isDisabled={true}
                                >
                                    {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                                </StyledTypography>
                            </StyledAlert>
                        </Tooltip>
                    ) : (
                        <StyledAlert
                            setBounds={direction === 'column'}
                            sx={{ width: '100%' }}
                            icon={false}
                            action={
                                <Switch
                                    title={
                                        discoverable
                                            ? `Make ${name} non-discoverable`
                                            : `Make ${name} discoverable`
                                    }
                                    disabled={global}
                                    checked={discoverable}
                                    onChange={() => {
                                        changeDiscoverable();
                                    }}
                                ></Switch>
                            }
                        >
                            <Alert.Title>
                                <StyledTypography
                                    variant="body1"
                                    isDisabled={false}
                                >
                                    Make Discoverable
                                </StyledTypography>
                            </Alert.Title>
                            <StyledTypography
                                variant="body2"
                                isDisabled={false}
                            >
                                {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                            </StyledTypography>
                        </StyledAlert>
                    )}
                    <StyledAlert
                        setBounds={direction === 'column'}
                        sx={{ width: '100%' }}
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
                        setBounds={direction === 'column'}
                        sx={{ width: '100%' }}
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
                </Stack>
            </Paper>
        );
    } else {
        return (
            <StyledGrid container spacing={3}>
                <Grid item xs={direction === 'row' ? 4 : 12}>
                    <StyledAlert
                        setBounds={direction === 'column'}
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
                        <Grid item xs={direction === 'row' ? 4 : 12}>
                            <StyledAlert
                                setBounds={direction === 'column'}
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
                                    <StyledTypography
                                        variant="body1"
                                        isDisabled={true}
                                    >
                                        Make Discoverable
                                    </StyledTypography>
                                </Alert.Title>
                                <StyledTypography
                                    variant="body2"
                                    isDisabled={true}
                                >
                                    {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                                </StyledTypography>
                            </StyledAlert>
                        </Grid>
                    </Tooltip>
                ) : (
                    <Grid item xs={direction === 'row' ? 4 : 12}>
                        <StyledAlert
                            setBounds={direction === 'column'}
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
                                <StyledTypography
                                    variant="body1"
                                    isDisabled={false}
                                >
                                    Make Discoverable
                                </StyledTypography>
                            </Alert.Title>
                            <StyledTypography
                                variant="body2"
                                isDisabled={false}
                            >
                                {`Allow users that do not currently have access to the ${name} to discover the ${name}, view ${name} details, and request access.`}
                            </StyledTypography>
                        </StyledAlert>
                    </Grid>
                )}
                {onDelete ? (
                    <Grid item xs={direction === 'row' ? 4 : 12}>
                        <StyledAlert
                            setBounds={direction === 'column'}
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
                        setBounds={direction === 'column'}
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
