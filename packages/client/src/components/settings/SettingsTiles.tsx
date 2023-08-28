import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Button,
    Grid,
    Modal,
    Icon,
    Switch,
    useNotification,
} from '@semoss/ui';
import {
    Delete,
    Lock,
    Visibility,
    VisibilityOffRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { useRootStore, usePixel, useSettings } from '@/hooks';

import { SETTINGS_TYPE } from './settings.types';

const StyledIcon = styled(Icon)(() => ({
    color: 'rgba(0, 0, 0, .5)',
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
    width: '468px',
    height: theme.spacing(13),
    backgroundColor: theme.palette.background.paper,
}));

const StyledGrid = styled(Grid)(() => ({
    flex: '1',
}));

interface SettingsTilesProps {
    /**
     * Type of setting
     */
    type: SETTINGS_TYPE;

    /**
     * Id of the setting
     */
    id: string;

    /**
     * Callback that is fired on delete
     * @returns
     */
    onDelete: () => void;
}

export const SettingsTiles = (props: SettingsTilesProps) => {
    const { type, id, onDelete } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [deleteModal, setDeleteModal] = useState(false);
    const [discoverable, setDiscoverable] = useState(false);
    const [global, setGlobal] = useState(false);

    const infoPixel =
        type === 'database' || type === 'model' || type === 'storage'
            ? `EngineInfo(engine='${id}');`
            : type === 'app'
            ? `ProjectInfo(project='${id}')`
            : '';

    const info = usePixel<{
        database_global: boolean;
        database_discoverable: boolean;
    }>(infoPixel);

    useEffect(() => {
        // pixel call to get pending members
        if (info.status !== 'SUCCESS' || !info.data) {
            return;
        }

        setDiscoverable(info.data.database_discoverable);
        setGlobal(info.data.database_global);
    }, [info.status, info.data]);

    /**
     * Delete the item
     */
    const deleteWorkflow = async () => {
        try {
            let pixel = '';
            if (type === 'database' || type === 'model' || type === 'storage') {
                pixel = `DeleteEngine(engineId=['${id}']);`;
            } else {
                pixel = `DeleteProject(project=['${id}']);`;
            }

            if (!pixel) {
                return;
            }

            const response = await monolithStore.runQuery(pixel);

            const operationType = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: `Successfully deleted ${type}`,
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
        }
    };

    /**
     * @name changeDiscoverable
     */
    const changeDiscoverable = async () => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (type === 'database' || type === 'model' || type === 'storage') {
                response = await monolithStore.setEngineVisiblity(
                    adminMode,
                    id,
                    !discoverable,
                );
            } else if (type === 'app') {
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

            if (response.data.success) {
                setDiscoverable(!discoverable);

                notification.add({
                    color: 'success',
                    message: `Successfully made ${type} discoverable`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${type} discoverable`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

    /**
     * @name changeGlobal
     */
    const changeGlobal = async () => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            if (type === 'database' || type === 'model' || type === 'storage') {
                response = await monolithStore.setEngineGlobal(
                    adminMode,
                    id,
                    !global,
                );
            } else if (type === 'app') {
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
                    message: `Successfully made ${type} global`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error making ${type} global`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        }
    };

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
                                    ? `Make ${type} private`
                                    : `Make ${type} public`
                            }
                            checked={global}
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
                                    ? `Make ${type} non-discoverable`
                                    : `Make ${type} discoverable`
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
                    this {type} if private
                </StyledAlert>
            </Grid>
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
                    <Alert.Title>Delete {type}</Alert.Title>
                    Remove {type} from catalog
                </StyledAlert>
                <Modal open={deleteModal}>
                    <Modal.Title>Are you sure?</Modal.Title>
                    <Modal.Content>
                        This action is irreversable. This will permanentely
                        delete this {type}.
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
        </StyledGrid>
    );
};
