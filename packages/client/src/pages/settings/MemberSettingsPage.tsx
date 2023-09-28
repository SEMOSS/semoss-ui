import { useEffect, useState } from 'react';
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
    styled,
    useNotification,
    List,
    Modal,
    Button,
    Checkbox,
    Typography,
    AvatarGroup,
    Avatar,
    Table,
    IconButton,
    Stack,
    TextField,
    Select,
    Switch,
} from '@semoss/ui';
import { useForm, useFormState, Controller } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRootStore, useAPI, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
}));

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
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    if (!adminMode) {
        navigate('/settings');
        // return;
    }

    const [members, setMembers] = useState([]);
    const [addMemberModal, setAddMemberModal] = useState(false);
    const [memberInfoModal, setMemberInfoModal] = useState(false);
    const [activeMember, setActiveMember] = useState<Member>(null);
    const [page, setPage] = useState<number>(0);

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
                    message: message,
                });
                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    };

    const updateActiveMember = handleSubmit((data) => {
        setMemberInfoModal(false);
        monolithStore['editMemberInfo'](adminMode, data)
            .then(() => {
                const message = `You have successfully updated user information`;
                notification.add({
                    color: 'success',
                    message: message,
                });
                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
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
                    message: message,
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
                    <IconButton
                        onClick={() => {
                            setActiveMember(null);
                            setMemberInfoModal(false);
                        }}
                    >
                        <Close />
                    </IconButton>
                </StyledEnd>
                {activeMember && (
                    <div style={{ padding: '0px' }}>
                        <Modal.Title>
                            <Typography variant="subtitle1">
                                <strong>Details</strong>
                            </Typography>
                        </Modal.Title>
                        <Modal.Content>
                            <form>
                                <Stack gap={2}>
                                    <Controller
                                        name={'name'}
                                        control={control}
                                        rules={{
                                            required: getValues('type'),
                                        }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Name"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                ></TextField>
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'email'}
                                        control={control}
                                        rules={{
                                            required: true,
                                        }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Email"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    type="email"
                                                ></TextField>
                                            );
                                        }}
                                    />

                                    <Stack direction={'row'} gap={1}>
                                        <Controller
                                            name={'countrycode'}
                                            control={control}
                                            rules={{
                                                pattern: /^[+0-9]{0,6}$/,
                                            }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Country Code"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        sx={{
                                                            width: '32px',
                                                        }}
                                                    ></TextField>
                                                );
                                            }}
                                        />
                                        <Controller
                                            name="phone"
                                            control={control}
                                            rules={{
                                                pattern: /^[()-.\s0-9]{8,}$/,
                                            }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Phone Number"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        sx={{
                                                            flex: 1,
                                                        }}
                                                    ></TextField>
                                                );
                                            }}
                                        />
                                        <Controller
                                            name="phoneextension"
                                            control={control}
                                            rules={{
                                                pattern: /^[+0-9]{0,6}$/,
                                            }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Ext"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                        sx={{
                                                            width: '48px',
                                                        }}
                                                    ></TextField>
                                                );
                                            }}
                                        />
                                    </Stack>

                                    <Typography
                                        sx={{ padding: '25px 0' }}
                                        variant="subtitle1"
                                    >
                                        <strong>Credentials</strong>
                                    </Typography>

                                    <Controller
                                        name="type"
                                        control={control}
                                        rules={{}}
                                        render={({ field }) => {
                                            return (
                                                <Select
                                                    label="Type"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    {providers.map(
                                                        (option, i) => {
                                                            return (
                                                                <Select.Item
                                                                    value={
                                                                        option
                                                                    }
                                                                    key={i}
                                                                >
                                                                    {option}
                                                                </Select.Item>
                                                            );
                                                        },
                                                    )}
                                                </Select>
                                            );
                                        }}
                                    />

                                    <Controller
                                        name="id"
                                        control={control}
                                        rules={{}}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="User Id"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        field.onChange(
                                                            e.target.value,
                                                        );

                                                        activeMember['newId'] =
                                                            e.target.value;
                                                    }}
                                                ></TextField>
                                            );
                                        }}
                                    />

                                    <Controller
                                        name="username"
                                        control={control}
                                        rules={{}}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Username"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        field.onChange(
                                                            e.target.value,
                                                        );
                                                    }}
                                                ></TextField>
                                            );
                                        }}
                                    />

                                    {type === 'Native' && (
                                        <>
                                            <Controller
                                                name="password"
                                                control={control}
                                                rules={{
                                                    required:
                                                        dirtyFields.password,
                                                    minLength: 8,
                                                    validate: (value) =>
                                                        passwordValidate(value),
                                                }}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            label="Password"
                                                            type="password"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(e) => {
                                                                field.onChange(
                                                                    e.target
                                                                        .value,
                                                                );
                                                            }}
                                                        ></TextField>
                                                    );
                                                }}
                                            />

                                            {dirtyFields.password && (
                                                <Typography variant={'caption'}>
                                                    Note: Password must have one
                                                    letter, one capital, one
                                                    number, one special
                                                    character, and be a minimum
                                                    of 8 characters.
                                                </Typography>
                                            )}
                                        </>
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
                                                <Controller
                                                    name={'admin'}
                                                    control={control}
                                                    render={({ field }) => {
                                                        return (
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onChange={() =>
                                                                    field.onChange(
                                                                        !field.value,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }}
                                                />
                                            }
                                        >
                                            <List.Icon>
                                                <LocalPoliceRounded />
                                            </List.Icon>
                                            <List.ItemText
                                                primary={<strong>Admin</strong>}
                                                secondary="All-Access pass to app information"
                                            />
                                        </List.Item>

                                        <List.Item
                                            secondaryAction={
                                                <Controller
                                                    name={'publisher'}
                                                    control={control}
                                                    render={({ field }) => {
                                                        return (
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onChange={() =>
                                                                    field.onChange(
                                                                        !field.value,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }}
                                                />
                                            }
                                        >
                                            <List.Icon>
                                                <CloudUploadRounded />
                                            </List.Icon>
                                            <List.ItemText
                                                primary={
                                                    <strong>Publisher</strong>
                                                }
                                                secondary="Anyone on the platform can access"
                                            />
                                        </List.Item>

                                        <List.Item
                                            secondaryAction={
                                                <Controller
                                                    name={'exporter'}
                                                    control={control}
                                                    render={({ field }) => {
                                                        return (
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onChange={() =>
                                                                    field.onChange(
                                                                        !field.value,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }}
                                                />
                                            }
                                        >
                                            <List.Icon>
                                                <DownloadForOfflineRounded />
                                            </List.Icon>
                                            <List.ItemText
                                                primary={
                                                    <strong>Exporter</strong>
                                                }
                                                secondary="Anyone on the platform can access"
                                            />
                                        </List.Item>
                                    </List>
                                </Stack>
                            </form>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setActiveMember(null);
                                    setMemberInfoModal(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    console.log('saving info');
                                    updateActiveMember();
                                }}
                            >
                                Save
                            </Button>
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
                    <IconButton
                        onClick={() => {
                            reset();
                            setAddMemberModal(false);
                        }}
                    >
                        <Close />
                    </IconButton>
                </StyledEnd>
                <div style={{ padding: '0px' }}>
                    <Modal.Title>
                        <Typography variant="subtitle1">
                            <strong>Details</strong>
                        </Typography>
                    </Modal.Title>
                    <Modal.Content>
                        <form>
                            <Stack gap={2}>
                                <Controller
                                    name={'name'}
                                    control={control}
                                    rules={{
                                        required: getValues('type'),
                                    }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                            ></TextField>
                                        );
                                    }}
                                />
                                <Controller
                                    name={'email'}
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Email"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                                type="email"
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Stack direction={'row'} gap={1}>
                                    <Controller
                                        name={'countrycode'}
                                        control={control}
                                        rules={{
                                            pattern: /^[+0-9]{0,6}$/,
                                        }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Country Code"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    sx={{
                                                        width: '32px',
                                                    }}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                    <Controller
                                        name="phone"
                                        control={control}
                                        rules={{
                                            pattern: /^[()-.\s0-9]{8,}$/,
                                        }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Phone Number"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    sx={{
                                                        flex: 1,
                                                    }}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                    <Controller
                                        name="phoneextension"
                                        control={control}
                                        rules={{
                                            pattern: /^[+0-9]{0,6}$/,
                                        }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Ext"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    sx={{
                                                        width: '48px',
                                                    }}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                </Stack>

                                <Typography
                                    sx={{ padding: '25px 0' }}
                                    variant="subtitle1"
                                >
                                    <strong>Credentials</strong>
                                </Typography>
                                <Controller
                                    name="type"
                                    control={control}
                                    rules={{}}
                                    render={({ field }) => {
                                        return (
                                            <Select
                                                label="Type"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {providers.map((option, i) => {
                                                    return (
                                                        <Select.Item
                                                            value={option}
                                                            key={i}
                                                        >
                                                            {option}
                                                        </Select.Item>
                                                    );
                                                })}
                                            </Select>
                                        );
                                    }}
                                />

                                <Controller
                                    name="id"
                                    control={control}
                                    rules={{}}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="User Id"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    field.onChange(
                                                        e.target.value,
                                                    );

                                                    activeMember['newId'] =
                                                        e.target.value;
                                                }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Controller
                                    name="username"
                                    control={control}
                                    rules={{}}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Username"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    field.onChange(
                                                        e.target.value,
                                                    );
                                                }}
                                            ></TextField>
                                        );
                                    }}
                                />
                                {type === 'Native' && (
                                    <>
                                        <Controller
                                            name="password"
                                            control={control}
                                            rules={{
                                                required: dirtyFields.password,
                                                minLength: 8,
                                                validate: (value) =>
                                                    passwordValidate(value),
                                            }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Password"
                                                        type="password"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) => {
                                                            field.onChange(
                                                                e.target.value,
                                                            );
                                                        }}
                                                    ></TextField>
                                                );
                                            }}
                                        />

                                        {dirtyFields.password && (
                                            <Typography variant={'caption'}>
                                                Note: Password must have one
                                                letter, one capital, one number,
                                                one special character, and be a
                                                minimum of 8 characters.
                                            </Typography>
                                        )}
                                    </>
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
                                            <Controller
                                                name={'admin'}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Switch
                                                            color="primary"
                                                            value={field.value}
                                                            onChange={() =>
                                                                field.onChange(
                                                                    !field.value,
                                                                )
                                                            }
                                                        />
                                                    );
                                                }}
                                            />
                                        }
                                    >
                                        <List.Icon>
                                            <LocalPoliceRounded />
                                        </List.Icon>
                                        <List.ItemText
                                            primary={<strong>Admin</strong>}
                                            secondary="All-Access pass to app information"
                                        />
                                    </List.Item>

                                    <List.Item
                                        secondaryAction={
                                            <Controller
                                                name={'publisher'}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Switch
                                                            color="primary"
                                                            value={field.value}
                                                            onChange={() =>
                                                                field.onChange(
                                                                    !field.value,
                                                                )
                                                            }
                                                        />
                                                    );
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
                                            <Controller
                                                name={'exporter'}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <Switch
                                                            color="primary"
                                                            value={field.value}
                                                            onChange={() =>
                                                                field.onChange(
                                                                    !field.value,
                                                                )
                                                            }
                                                        />
                                                    );
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
                            </Stack>
                        </form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                reset();
                                setAddMemberModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                createUser();
                            }}
                            color="primary"
                        >
                            Save
                        </Button>
                    </Modal.Actions>
                </div>
            </StyledModal>
        );
    };

    return (
        <>
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
                                    {members.map((mem, i) => {
                                        return (
                                            <Avatar
                                                key={i}
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

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ textAlign: 'right' }}
                        onClick={() => {
                            setAddMemberModal(true);
                        }}
                    >
                        Add New
                    </Button>
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
                                                        admin: !mem.admin,
                                                    });
                                                }}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <IconButton
                                                onClick={() => {
                                                    setActiveMember(mem);
                                                    reset(mem);
                                                    setMemberInfoModal(true);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => {
                                                    deleteActiveMember(mem);
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
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
        </>
    );
};
