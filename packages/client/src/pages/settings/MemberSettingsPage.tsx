import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import {
    Form,
    Icon,
    Popover,
    useNotification,
    IconButton,
} from '@semoss/components';
import {
    Delete,
    Add,
    Edit,
    Close,
    LocalPoliceRounded,
    CloudUploadRounded,
    DownloadForOfflineRounded,
} from '@mui/icons-material';
import {
    List,
    Modal,
    Button,
    Checkbox,
    styled,
    Typography,
    AvatarGroup,
    Avatar,
    Table,
    IconButton as MuiIconButton,
} from '@semoss/ui';
import { Card } from '@/components/ui';
import { LoadingScreen } from '@/components/ui';
import { useForm, useFormState } from 'react-hook-form';
import {
    mdiTextBoxMultipleOutline,
    mdiDelete,
    mdiAccountPlus,
    mdiPlusThick,
    mdiInformation,
} from '@mdi/js';
import { Field } from '@/components/form';
import { NumericKeys } from 'react-hook-form/dist/types/path/common';

const StyledContainer = styled('div')(({ theme }) => ({
    margin: '0 auto',
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(5),
    paddingBottom: theme.spacing(5),
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
}));
const StyledButton = styled(Button)({
    textTransform: 'none',
});
const StyledIcon = styled(Icon)({
    fontSize: '4rem',
});

const StyledEnd = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing(1),
}));

const StyledMemberTypography = styled(Typography)(({ theme }) => ({
    paddingTop: theme.spacing(1),
    color: theme.palette.grey['500'],
}));

const StyledTitle = styled('div')({
    display: 'flex',
});

const StyledModal = styled('div')({
    width: '606px',
    height: '854px',
    padding: '16px',
});

interface Member {
    admin: boolean;
    email: string;
    id: string;
    name: string;
    type: string;
    username: string;
    password: string;
    phone: string;
    publisher: boolean;
    exporter: boolean;
    phoneextension: string;
    countrycode: string;
}

interface PendingMember {
    admin: boolean;
    username: string;
    email: string;
    countrycode: string;
    phone: string;
    extension: string;
    id: string;
    name: string;
    type: string;
    publisher: boolean;
    exporter: boolean;
}

const capitalize = (input: string) => {
    return input.charAt(0).toUpperCase() + input.slice(1);
};

const passwordValidate = (password: string) => {
    if (!password) {
        return false;
    }
    if (!password.match(/[a-z]/g)) {
        return false;
    }

    if (!password.match(/[A-Z]/g)) {
        return false;
    }

    if (!password.match(/[0-9]/g)) {
        return false;
    }

    if (!password.match(/[!@#$%^&*]/g)) {
        return false;
    }

    return true;
};

export const MemberSettingsPage = () => {
    const { adminMode } = useSettings();
    const notification = useNotification();
    const [members, setMembers] = useState([]);
    const [addMemberModal, setAddMemberModal] = useState(false);
    const [memberInfoModal, setMemberInfoModal] = useState(false);
    const [activeMember, setActiveMember] = useState<Member>(null);
    const [page, setPage] = useState<number>(0);

    const { configStore, monolithStore } = useRootStore();

    const { control, reset, handleSubmit, getValues, watch } = useForm<{
        // edit existing member fields
        id: string;
        username: string;
        name: string;
        password: string;
        email: string;
        phone: string;
        phoneextension: string;
        countrycode: string;
        admin: boolean;
        exporter: boolean;
        publisher: boolean;
        type: string;
        // add pending member fields
    }>({
        defaultValues: {
            id: activeMember?.id,
            username: activeMember?.username,
            name: activeMember?.name,
            email: activeMember?.email,
            phone: activeMember?.phone,
            phoneextension: activeMember?.phoneextension,
            countrycode: activeMember?.countrycode,
            admin: activeMember?.admin,
            exporter: activeMember?.exporter,
            publisher: activeMember?.exporter,
            type: activeMember?.type,
        },
    });

    const countrycode = watch('countrycode');
    const phone = watch('phone');
    const type = watch('type', '');
    const withPhone = `Phone Number: 
    \n ${countrycode}-${phone} \n`;

    const { dirtyFields } = useFormState({
        control,
    });

    const providers = configStore.store.config.providers.map((val) =>
        capitalize(val),
    );

    const updateMemberInfo = (member: Member) => {
        monolithStore['editMemberInfo'](adminMode, member)
            .then(() => {
                const message =
                    'You have successfully updated user information';
                notification.add({
                    color: 'success',
                    content: message,
                });
                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    const updateActiveMember = handleSubmit((data) => {
        monolithStore['editMemberInfo'](adminMode, data)
            .then(() => {
                const message = `You have successfully updated user information`;
                notification.add({
                    color: 'success',
                    content: message,
                });
                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    });

    const deleteActiveMember = (member: Member) => {
        monolithStore['deleteMember'](adminMode, member.id, member.type).then(
            () => {
                setActiveMember(null);
                getMembers.refresh();
            },
        );
    };

    const createUser = handleSubmit((data: PendingMember) => {
        monolithStore['createUser'](adminMode, data).then((resp) => {
            if (resp.data) {
                const message = `You have successfully added new user(s)`;
                notification.add({
                    color: 'success',
                    content: message,
                });
                getMembers.refresh();
                const newMember = members.find((m) => {
                    m.id == data.id;
                });
                setActiveMember(newMember);
                setAddMemberModal(false);
            }
        });
    });

    /**
     * @name getDisplay
     * @desc gets display options for the Insight dropdown
     * @param option - the object that is specified for the option
     */

    const getMembers = useAPI(['getAllUsers', adminMode]);

    useEffect(() => {
        // REST call to get all apps
        if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
            return;
        }

        setMembers(getMembers.data);

        () => {
            console.warn('Cleaning up getMembers');
            setMembers([]);
        };
    }, [getMembers.status, getMembers.data]);
    // show a loading screen when getProjects is pending
    if (getMembers.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Retrieving member information" />
        );
    }

    const buildMemberModal = () => {
        return (
            <StyledModal>
                <StyledEnd>
                    <Typography variant="h6">
                        <strong>Edit Member</strong>
                    </Typography>
                    <MuiIconButton
                        onClick={() => {
                            setActiveMember(null);
                            setMemberInfoModal(false);
                        }}
                    >
                        <Close />
                    </MuiIconButton>
                </StyledEnd>
                {activeMember && (
                    <div style={{ padding: '0px' }}>
                        <Modal.Title>
                            <Typography variant="subtitle1">
                                <strong>Details</strong>
                            </Typography>
                        </Modal.Title>
                        <Modal.Content>
                            <Form>
                                <Field
                                    name="name"
                                    control={control}
                                    rules={{
                                        required: getValues('type'),
                                    }}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Name',
                                    }}
                                    label="Name"
                                    error="Name is required"
                                />

                                <Field
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Email',
                                    }}
                                    label="Email"
                                    error="Email is required"
                                />
                                <div style={{ display: 'flex' }}>
                                    <div
                                        style={{
                                            width: '40%',
                                            marginRight: '2px',
                                        }}
                                    >
                                        <Field
                                            name="countrycode"
                                            control={control}
                                            rules={{
                                                pattern: /^[+0-9]{0,6}$/,
                                            }}
                                            options={{
                                                component: 'input',
                                                placeholder: 'Country Code',
                                            }}
                                            error="Please enter a valid country code"
                                            description={
                                                phone
                                                    ? withPhone
                                                    : 'Phone Number: '
                                            }
                                        />
                                    </div>
                                    <div style={{ marginRight: '2px' }}>
                                        <Field
                                            name="phone"
                                            control={control}
                                            rules={{
                                                pattern: /^[()-.\s0-9]{8,}$/,
                                            }}
                                            options={{
                                                component: 'input',
                                                placeholder: 'Phone Number',
                                            }}
                                            error="Please enter a valid phone number"
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: '40%',
                                            marginRight: '2px',
                                        }}
                                    >
                                        <Field
                                            name="phoneextension"
                                            control={control}
                                            rules={{
                                                pattern: /^[+0-9]{0,6}$/,
                                            }}
                                            options={{
                                                component: 'input',
                                                placeholder: 'Extension',
                                            }}
                                            error="Please enter a valid phone extension"
                                        />
                                    </div>
                                </div>

                                <Typography
                                    sx={{ padding: '25px 0' }}
                                    variant="subtitle1"
                                >
                                    <strong>Credentials</strong>
                                </Typography>

                                <Field
                                    name="type"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'select',
                                        options: providers,
                                        placeholder: 'Type',
                                    }}
                                    label="Type"
                                />

                                <Field
                                    name="id"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'User ID',
                                    }}
                                    label="User ID"
                                    onChange={(val) => {
                                        activeMember['newId'] = val;
                                    }}
                                />

                                <Field
                                    name="username"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Username',
                                    }}
                                    label="Username"
                                />
                                <Field
                                    name="password"
                                    control={control}
                                    rules={{
                                        required: dirtyFields.password,
                                        minLength: 8,
                                        validate: (value) =>
                                            passwordValidate(value),
                                    }}
                                    options={{
                                        component: 'input',
                                        type: 'password',
                                        placeholder: '********',
                                    }}
                                    error="Please enter a valid password"
                                    label="Password"
                                />
                                {dirtyFields.password && (
                                    <Popover>
                                        <Popover.Trigger>
                                            <IconButton size="sm">
                                                <StyledIcon
                                                    path={mdiInformation}
                                                ></StyledIcon>
                                            </IconButton>
                                        </Popover.Trigger>
                                        <Popover.Content
                                            side="right"
                                            align="end"
                                        >
                                            <div>
                                                <span>Password must:</span>
                                            </div>
                                            <ul>
                                                <li id="letter">
                                                    have <b>one letter</b>
                                                </li>
                                                <li id="capital">
                                                    have <b>one capital</b>
                                                </li>
                                                <li id="number">
                                                    have <b>one number</b>
                                                </li>
                                                <li id="special">
                                                    have
                                                    <b>
                                                        {' '}
                                                        one special character
                                                    </b>
                                                </li>
                                                <li id="length">
                                                    be a minimum of
                                                    <b> 8 characters</b>
                                                </li>
                                            </ul>
                                        </Popover.Content>
                                    </Popover>
                                )}

                                <Typography
                                    sx={{ padding: '25px 0' }}
                                    variant="subtitle1"
                                >
                                    <strong>Permissions</strong>
                                </Typography>

                                <List>
                                    <List.Item
                                        secondaryAction={
                                            <Field
                                                name="admin"
                                                control={control}
                                                rules={{}}
                                                options={{
                                                    component: 'switch',
                                                }}
                                            />
                                        }
                                    >
                                        <List.Icon>
                                            <LocalPoliceRounded />
                                        </List.Icon>
                                        <List.ItemText
                                            primary={<strong>Admin</strong>}
                                            secondary="All-Access pass to project information"
                                        />
                                    </List.Item>

                                    <List.Item
                                        secondaryAction={
                                            <Field
                                                name="publisher"
                                                control={control}
                                                rules={{}}
                                                options={{
                                                    component: 'switch',
                                                }}
                                            />
                                        }
                                    >
                                        <List.Icon>
                                            <CloudUploadRounded />
                                        </List.Icon>
                                        <List.ItemText
                                            primary={<strong>Publisher</strong>}
                                            secondary="Anyone on the platform can access"
                                        />
                                    </List.Item>

                                    <List.Item
                                        secondaryAction={
                                            <Field
                                                name="exporter"
                                                control={control}
                                                rules={{}}
                                                options={{
                                                    component: 'switch',
                                                }}
                                            />
                                        }
                                    >
                                        <List.Icon>
                                            <DownloadForOfflineRounded />
                                        </List.Icon>
                                        <List.ItemText
                                            primary={<strong>Exporter</strong>}
                                            secondary="Anyone on the platform can access"
                                        />
                                    </List.Item>
                                </List>
                            </Form>
                        </Modal.Content>
                        <Modal.Actions>
                            <StyledButton
                                variant="outlined"
                                onClick={() => {
                                    setActiveMember(null);
                                    setMemberInfoModal(false);
                                }}
                            >
                                Cancel
                            </StyledButton>
                            <StyledButton
                                variant="contained"
                                onClick={() => {
                                    updateActiveMember();
                                    setMemberInfoModal(false);
                                }}
                            >
                                Save
                            </StyledButton>
                        </Modal.Actions>
                    </div>
                )}
            </StyledModal>
        );
    };

    const buildNewMemberModal = () => {
        return (
            <StyledModal>
                <StyledEnd>
                    <Typography variant="h6">
                        <strong>Add Member</strong>
                    </Typography>
                    <MuiIconButton
                        onClick={() => {
                            reset();
                            setAddMemberModal(false);
                        }}
                    >
                        <Close />
                    </MuiIconButton>
                </StyledEnd>
                <div style={{ padding: '0px' }}>
                    <Modal.Title>
                        <Typography variant="subtitle1">
                            <strong>Details</strong>
                        </Typography>
                    </Modal.Title>
                    <Modal.Content>
                        <Form>
                            <Field
                                name="name"
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'input',
                                    placeholder: 'Name',
                                }}
                                label="Name"
                            />
                            <Field
                                name="email"
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'input',
                                    placeholder: 'Email',
                                }}
                                label="Email"
                            />
                            <div style={{ display: 'flex' }}>
                                <div
                                    style={{ width: '40%', marginRight: '2px' }}
                                >
                                    <Field
                                        name="countrycode"
                                        control={control}
                                        rules={{
                                            pattern: /^[+0-9]{0,6}$/,
                                        }}
                                        options={{
                                            component: 'input',
                                            placeholder: 'Country Code',
                                        }}
                                        error="Please enter a valid country code"
                                        description={
                                            phone ? withPhone : 'Phone Number: '
                                        }
                                    />
                                </div>
                                <div style={{ marginRight: '2px' }}>
                                    <Field
                                        name="phone"
                                        control={control}
                                        rules={{
                                            pattern: /^[()-.\s0-9]{8,}$/,
                                        }}
                                        options={{
                                            component: 'input',
                                            placeholder: 'Phone Number',
                                        }}
                                        error="Please enter a valid phone number"
                                    />
                                </div>
                                <div
                                    style={{ width: '40%', marginRight: '2px' }}
                                >
                                    <Field
                                        name="phoneextension"
                                        control={control}
                                        rules={{
                                            pattern: /^[+0-9]{0,6}$/,
                                        }}
                                        options={{
                                            component: 'input',
                                            placeholder: 'Extension',
                                        }}
                                        error="Please enter a valid phone extension"
                                    />
                                </div>
                            </div>
                            <Typography
                                sx={{ padding: '25px 0' }}
                                variant="subtitle1"
                            >
                                <strong>Credentials</strong>
                            </Typography>

                            <Field
                                name="type"
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'select',
                                    options: providers,
                                    placeholder: 'Type',
                                }}
                                label="Type"
                            />
                            <Field
                                name="id"
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'input',
                                    placeholder: 'User ID',
                                }}
                                label="User ID"
                            />
                            <Field
                                name="username"
                                control={control}
                                rules={{}}
                                options={{
                                    component: 'input',
                                    placeholder: 'Username',
                                }}
                                label="Username"
                            />

                            {type === 'Native' && (
                                <div>
                                    <Field
                                        name="password"
                                        control={control}
                                        rules={{
                                            required: dirtyFields.password,
                                            minLength: 8,
                                            validate: (value) =>
                                                passwordValidate(value),
                                        }}
                                        options={{
                                            component: 'input',
                                            type: 'password',
                                            placeholder: '********',
                                        }}
                                        error="Please enter a valid password"
                                        label="Password"
                                    />
                                    {dirtyFields.password && (
                                        <Popover>
                                            <Popover.Trigger>
                                                <IconButton size="sm">
                                                    <StyledIcon
                                                        path={mdiInformation}
                                                    ></StyledIcon>
                                                </IconButton>
                                            </Popover.Trigger>
                                            <Popover.Content
                                                side="right"
                                                align="end"
                                            >
                                                <div>
                                                    <span>Password must:</span>
                                                </div>
                                                <ul>
                                                    <li id="letter">
                                                        have <b>one letter</b>
                                                    </li>
                                                    <li id="capital">
                                                        have <b>one capital</b>
                                                    </li>
                                                    <li id="number">
                                                        have <b>one number</b>
                                                    </li>
                                                    <li id="special">
                                                        have
                                                        <b>
                                                            {' '}
                                                            one special
                                                            character
                                                        </b>
                                                    </li>
                                                    <li id="length">
                                                        be a minimum of
                                                        <b> 8 characters</b>
                                                    </li>
                                                </ul>
                                            </Popover.Content>
                                        </Popover>
                                    )}
                                </div>
                            )}

                            <Typography
                                sx={{ padding: '25px 0' }}
                                variant="subtitle1"
                            >
                                <strong>Permissions</strong>
                            </Typography>

                            <List>
                                <List.Item
                                    secondaryAction={
                                        <Field
                                            name="admin"
                                            control={control}
                                            rules={{}}
                                            options={{
                                                component: 'switch',
                                            }}
                                        />
                                    }
                                >
                                    <List.Icon>
                                        <LocalPoliceRounded />
                                    </List.Icon>
                                    <List.ItemText
                                        primary={<strong>Admin</strong>}
                                        secondary="All-Access pass to project information"
                                    />
                                </List.Item>

                                <List.Item
                                    secondaryAction={
                                        <Field
                                            name="publisher"
                                            control={control}
                                            rules={{}}
                                            options={{
                                                component: 'switch',
                                            }}
                                        />
                                    }
                                >
                                    <List.Icon>
                                        <CloudUploadRounded />
                                    </List.Icon>
                                    <List.ItemText
                                        primary={<strong>Publisher</strong>}
                                        secondary="Anyone on the platform can access"
                                    />
                                </List.Item>

                                <List.Item
                                    secondaryAction={
                                        <Field
                                            name="exporter"
                                            control={control}
                                            rules={{}}
                                            options={{
                                                component: 'switch',
                                            }}
                                        />
                                    }
                                >
                                    <List.Icon>
                                        <DownloadForOfflineRounded />
                                    </List.Icon>
                                    <List.ItemText
                                        primary={<strong>Exporter</strong>}
                                        secondary="Anyone on the platform can access"
                                    />
                                </List.Item>
                            </List>
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <StyledButton
                            variant="outlined"
                            onClick={() => {
                                reset();
                                setAddMemberModal(false);
                            }}
                        >
                            Cancel
                        </StyledButton>
                        <StyledButton
                            variant="contained"
                            onClick={() => {
                                createUser();
                            }}
                            color="primary"
                        >
                            Save
                        </StyledButton>
                    </Modal.Actions>
                </div>
            </StyledModal>
        );
    };

    return (
        <div>
            <StyledContainer>
                <StyledEnd>
                    <StyledTitle>
                        <Typography variant="h6" sx={{ marginRight: '16px' }}>
                            <strong>Members</strong>
                        </Typography>
                        {members && (
                            <>
                                <AvatarGroup
                                    variant="circular"
                                    max={3}
                                    sx={{ marginRight: '8px' }}
                                >
                                    {members.map((mem) => {
                                        return (
                                            <Avatar
                                                sx={{ height: 32, width: 32 }}
                                            >
                                                {mem.name[0]}
                                            </Avatar>
                                        );
                                    })}
                                </AvatarGroup>
                                {members.length > 1 ? (
                                    <StyledMemberTypography variant="body1">
                                        {members.length} members
                                    </StyledMemberTypography>
                                ) : (
                                    <StyledMemberTypography
                                        variant="body1"
                                        sx={{ paddingTop: '6px' }}
                                    >
                                        {members.length} member
                                    </StyledMemberTypography>
                                )}
                            </>
                        )}
                    </StyledTitle>

                    <StyledButton
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ textAlign: 'right' }}
                        onClick={() => {
                            setAddMemberModal(true);
                        }}
                    >
                        Add New
                    </StyledButton>
                </StyledEnd>

                {members && (
                    <Table.Container>
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell>
                                        <strong>Name</strong>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <strong>Email</strong>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <strong>Type</strong>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <strong>Role</strong>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <strong>Action</strong>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {members.map((mem) => (
                                    <Table.Row key={mem.name}>
                                        <Table.Cell>{mem.name}</Table.Cell>
                                        <Table.Cell>{mem.email}</Table.Cell>
                                        <Table.Cell>{mem.type}</Table.Cell>
                                        <Table.Cell>
                                            <Checkbox
                                                label="Publisher"
                                                checked={mem.publisher}
                                                onChange={() => {
                                                    updateMemberInfo({
                                                        ...mem,
                                                        publisher:
                                                            !mem.publisher,
                                                    });
                                                }}
                                            />
                                            <Checkbox
                                                label="Exporter"
                                                checked={mem.exporter}
                                                onChange={() => {
                                                    updateMemberInfo({
                                                        ...mem,
                                                        exporter: !mem.exporter,
                                                    });
                                                }}
                                            />
                                            <Checkbox
                                                label="Admin"
                                                checked={mem.admin}
                                                onChange={() => {
                                                    updateMemberInfo({
                                                        ...mem,
                                                        exporter: !mem.admin,
                                                    });
                                                }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <MuiIconButton
                                                onClick={() => {
                                                    setActiveMember(mem);
                                                    reset(mem);
                                                    setMemberInfoModal(true);
                                                }}
                                            >
                                                <Edit />
                                            </MuiIconButton>
                                            <MuiIconButton
                                                onClick={() => {
                                                    deleteActiveMember(mem);
                                                }}
                                            >
                                                <Delete />
                                            </MuiIconButton>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                            <Table.Footer>
                                <Table.Row>
                                    <Table.Pagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        rowsPerPage={5}
                                        onPageChange={(e, v) => {
                                            setPage(v);
                                        }}
                                        page={page}
                                        count={Math.ceil(members.length / 5)}
                                    />
                                </Table.Row>
                            </Table.Footer>
                        </Table>
                    </Table.Container>
                )}
            </StyledContainer>

            {/* MemberInfoModal */}
            <Modal open={memberInfoModal}>{buildMemberModal()}</Modal>
            {/* Add New User Modal */}
            <Modal open={addMemberModal}>{buildNewMemberModal()}</Modal>
        </div>
    );
};
