import { useState, useEffect } from 'react';
import { useRootStore } from '@/hooks';
import {
    Form,
    useNotification,
    styled,
    theme,
    Flex,
    Button,
    Accordion,
    Icon,
    Loading,
    Modal,
} from '@semoss/components';
import { ImportedDatabaseContext } from '@/contexts/ImportedDatabaseContext';
import { Field } from '@/components/form';
import { useForm } from 'react-hook-form';
import { mdiTrashCan } from '@mdi/js';
import { useContext } from 'react';

type AppUser = {
    email: string;
    id: string;
    name: string;
    permission: string;
};
type FormData = {
    app: {
        app_global: boolean;
        app_id: string;
        app_name: string;
        database_global: string;
        database_id: string;
        database_name: string;
        low_database_name: string;
    };
    appUsers: AppUser[];
    appOwners: AppUser[];
    appEditors: AppUser[];
    appViewers: AppUser[];
    appUserSearch: string;
    admin: boolean | undefined;
    userToDelete: string;
};

const StyledForm = styled(Form, {
    display: 'flex',
    flexDirection: 'column',
});

const MarginTopBottom = styled('div', {
    marginTop: theme.space['4'],
    marginBottom: theme.space['4'],
});

const TableHeaders = styled('div', {
    height: theme.space['6'],
    padding: `${theme.space['0']} ${theme.space['1']}`,
});

const Quarter = styled('div', {
    width: '25%',
});
export const ImportedDatabaseAccessPage = () => {
    const notification = useNotification();

    const showNotification = (
        color: 'primary' | 'success' | 'error' | 'warning',
        content: unknown | string,
    ): void => notification.add({ color, content });

    const { setValue, control, watch } = useForm<FormData>({
        defaultValues: {
            app: {},
            appUsers: [],
            appOwners: [],
            appEditors: [],
            appViewers: [],
            admin: undefined,
            appUserSearch: '',
            userToDelete: '',
        },
    });

    const [openAccordion, setOpenAccordion] = useState<undefined>();
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const app = watch('app');
    const admin = watch('admin');
    const appUsers = watch('appUsers');
    const appOwners = watch('appOwners');
    const appEditors = watch('appEditors');
    const appViewers = watch('appViewers');
    const userToDelete = watch('userToDelete');
    const { id } = useContext(ImportedDatabaseContext);
    const { monolithStore } = useRootStore();
    const roleOptions: string[] = ['Author', 'Editor', 'Viewer'];

    useEffect(() => {
        // Determine whether user is admin
        setIsAdmin();

        () => {
            setValue('admin', false);
        };
    }, []);

    useEffect(() => {
        if (admin) {
            getApps();
            getAppUsers();
        }
    }, [admin]);
    const setIsAdmin = async (): Promise<void> => {
        const response = await monolithStore.isAdminUser();

        setValue('admin', response);
    };

    const getApps = async (): Promise<void> => {
        const response = await monolithStore.getApps(id);
        if (response.length) {
            setValue('app', response[0]);
        }
    };

    const mapAppUsers = (
        data: AppUser[],
        permissionCredential: string,
        permissionDisplay: string,
    ): {
        email: string;
        name: string;
        id: string;
        permission: string;
    }[] => {
        return data.map((datum) => {
            const { email, id, name, permission } = datum;
            if (permission === permissionCredential) {
                return {
                    email,
                    name,
                    id,
                    permission: permissionDisplay,
                };
            }
        });
    };

    const getAppUsers = async (): Promise<void> => {
        const response = await monolithStore.getDBUsers(admin, id);
        if (response) {
            const { data } = response;
            setValue('appUsers', data);
            setValue('appOwners', mapAppUsers(data, 'OWNER', 'Author'));
            setValue('appEditors', mapAppUsers(data, 'EDIT', 'Editor'));
            setValue('appViewers', mapAppUsers(data, 'READ_ONLY', 'Viewer'));
        }
    };

    const setGlobal = async (
        isAdmin: boolean,
        appId: string,
        global: boolean,
    ): Promise<void> => {
        const response = await monolithStore.setDatabaseGlobal(
            isAdmin,
            appId,
            global,
        );
        if (response) {
            if (response.data.success) {
                showNotification(
                    'success',
                    `You have successfully made the database ${
                        app.app_global ? 'public' : 'private'
                    }`,
                );
            } else {
                showNotification(
                    'error',
                    'There was an error setting the database as global/private',
                );
            }
        }
    };

    const setDiscoverable = async (
        isAdmin: boolean,
        appId: string,
        discoverable: boolean,
    ): Promise<void> => {
        const response = await monolithStore.setDatabaseDiscoverable(
            isAdmin,
            appId,
            discoverable,
        );
        if (response) {
            if (response.data.success) {
                showNotification(
                    'success',
                    `You have successfully made the app ${
                        !discoverable ? 'not' : ''
                    } discoverable`,
                );
            } else {
                showNotification(
                    'error',
                    'There was an error setting the database as discoverable.',
                );
            }
        }
    };

    const removeAppUserPermissions = async (
        isAdmin: boolean,
        appId: string,
        userId: string,
    ): Promise<void> => {
        const response = await monolithStore.removeAppUserPermissions(
            isAdmin,
            appId,
            userId,
        );

        if (response) {
            if (response.data.success) {
                showNotification('success', 'Successfully Removed ');
                getAppUsers();
            }
        }
    };
    if (admin === undefined) {
        return (
            <Loading open={true} description="Retrieving If User is Admin" />
        );
    }

    if (admin && Object.keys(app).length) {
        return (
            <StyledForm>
                <MarginTopBottom>
                    <b>Privacy</b>
                    <Field
                        name={'app.app_global'}
                        control={control}
                        rules={{}}
                        label={
                            app.app_global
                                ? ' Public Database- Anyone on the platform can access'
                                : 'Private - No one outside of the specified member group can access'
                        }
                        options={{
                            component: 'switch',
                        }}
                        onChange={(value) => {
                            setGlobal(admin, app.app_id, value);
                        }}
                        description=""
                        layout="vertical"
                    />
                </MarginTopBottom>
                <MarginTopBottom>
                    <b>Discoverable</b>
                    <Field
                        name={'app.database_global'}
                        control={control}
                        rules={{}}
                        label={
                            app.database_global
                                ? 'Discoverable - Users can request access to the database even if private.'
                                : 'Non-Discoverable - Users cannot request access to this database if private.'
                        }
                        options={{
                            component: 'switch',
                        }}
                        onChange={(value) => {
                            setDiscoverable(admin, app.app_id, value);
                        }}
                        description=""
                        layout="vertical"
                    />
                </MarginTopBottom>
                <MarginTopBottom>
                    <b>Current Members</b>
                    <Flex justify="space-between">
                        <Quarter>
                            <Field
                                name={'appUserSearch'}
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'input',
                                }}
                                onChange={(value) => {
                                    console.log(value);
                                }}
                                description=""
                                layout="vertical"
                            />
                        </Quarter>

                        {/* ask about this */}
                        <Button>Add Member</Button>
                    </Flex>
                </MarginTopBottom>
                <MarginTopBottom>
                    <TableHeaders>
                        <Flex>
                            <Quarter>
                                <h3>
                                    <b>Name</b>
                                </h3>
                            </Quarter>
                            <Quarter>
                                <h3>
                                    <b>ID</b>
                                </h3>
                            </Quarter>
                            <Quarter>
                                <h3>
                                    <b>Role</b>
                                </h3>
                            </Quarter>
                        </Flex>
                    </TableHeaders>
                    {appOwners.length ? (
                        <Accordion multiple={true} value={openAccordion}>
                            <Accordion.Item value="value">
                                <Accordion.Trigger>
                                    {`Authors (${appOwners.length})`}
                                </Accordion.Trigger>
                                <Accordion.Content>
                                    {appOwners.map((owner, ownerIdx) => {
                                        const { name, id } = owner;
                                        return (
                                            <Flex
                                                key={id}
                                                justify="space-between"
                                            >
                                                <Quarter>{`${name}`}</Quarter>
                                                <Quarter>{id}</Quarter>
                                                <Quarter>
                                                    <Field
                                                        name={`appOwners.${ownerIdx}.permission`}
                                                        control={control}
                                                        rules={{}}
                                                        options={{
                                                            component: 'select',
                                                            options:
                                                                roleOptions,
                                                        }}
                                                        onChange={(value) => {
                                                            console.log(value);
                                                            // setValue('userToDelete', )
                                                        }}
                                                        description=""
                                                        layout="vertical"
                                                    />
                                                </Quarter>

                                                <Quarter>
                                                    <Flex justify={'flex-end'}>
                                                        <Modal
                                                            open={
                                                                openDeleteModal
                                                            }
                                                            onOpen={() =>
                                                                setOpenDeleteModal(
                                                                    true,
                                                                )
                                                            }
                                                            onClose={() =>
                                                                setOpenDeleteModal(
                                                                    false,
                                                                )
                                                            }
                                                        >
                                                            <Modal.Trigger>
                                                                <div
                                                                    onClick={() => {
                                                                        setValue(
                                                                            'userToDelete',
                                                                            appOwners[
                                                                                ownerIdx
                                                                            ]
                                                                                .name,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Icon
                                                                        path={
                                                                            mdiTrashCan
                                                                        }
                                                                    />
                                                                </div>
                                                            </Modal.Trigger>
                                                            <Modal.Content>
                                                                <Modal.Header>
                                                                    <b>
                                                                        Remove
                                                                        Member
                                                                    </b>
                                                                </Modal.Header>
                                                                <Modal.Body>
                                                                    Do you want
                                                                    to remove{' '}
                                                                    {
                                                                        userToDelete
                                                                    }{' '}
                                                                    ?
                                                                    <Flex justify="flex-end">
                                                                        <Modal.Close>
                                                                            <Button>
                                                                                Cancel
                                                                            </Button>
                                                                        </Modal.Close>
                                                                        <Modal.Close>
                                                                            <Button
                                                                                onClick={() => {
                                                                                    removeAppUserPermissions(
                                                                                        admin,
                                                                                        app.app_id,
                                                                                        appOwners[
                                                                                            ownerIdx
                                                                                        ]
                                                                                            .id,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        </Modal.Close>
                                                                    </Flex>
                                                                </Modal.Body>
                                                            </Modal.Content>
                                                        </Modal>
                                                    </Flex>
                                                </Quarter>
                                            </Flex>
                                        );
                                    })}
                                </Accordion.Content>
                            </Accordion.Item>
                        </Accordion>
                    ) : (
                        <div>No Members. Please try again.</div>
                    )}
                </MarginTopBottom>
            </StyledForm>
        );
    }

    // just set up admin view for now
    return <div>You are not an admin</div>;
};
