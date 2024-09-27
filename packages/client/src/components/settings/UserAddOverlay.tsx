import { useEffect } from 'react';
import {
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
    Typography,
    Stack,
    TextField,
    Select,
    Switch,
} from '@semoss/ui';
import { useForm, useFormState, Controller } from 'react-hook-form';
import { useRootStore, useSettings } from '@/hooks';
import { AxiosResponse } from 'axios';

const StyledTypography = styled(Typography)({
    color: 'red',
});

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    maxWidth: '50rem',
}));

const StyledForm = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledListItem = styled(List.Item)({
    padding: '4px 0',
});

const StyledList = styled(List)({
    padding: 0,
});

const StyledCountryCodeExt = styled(TextField)({
    width: '168px',
});

const StyledPhoneNumber = styled(TextField)({
    width: '550px',
});

const StyledPermissions = styled(Typography)({
    padding: '25px 0',
});

interface User {
    id: string;
    type: string;
    name?: string;
    admin?: boolean;
    publisher?: boolean;
    exporter?: boolean;
    email?: string;
    phone?: string;
    phoneextension?: string;
    countrycode?: string;
    username?: string;
}

interface EditUserForm {
    id: string;
    username: string;
    name: string;
    password: string;
    newEmail: string;
    phone: string;
    phoneextension: string;
    countrycode: string;
    admin: boolean;
    exporter: boolean;
    publisher: boolean;
    type: string;
}

const capitalize = (input: string) => {
    return input.charAt(0).toUpperCase() + input.slice(1);
};

const passwordValidate = (password: string) => {
    if (!password) {
        return true;
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

const numberValidate = (number: string) => {
    if (!number) {
        return false;
    }

    const formatOne = /^\(\d{3}\) \d{3}-\d{4}$/;
    const formatTwo = /^\d{3}-\d{3}-\d{4}$/;

    return formatOne.test(number) || formatTwo.test(number);
};

interface UserAddOverlayProps {
    /**
     * Track if the model is open or close
     */
    open: boolean;

    /**
     * User that is being edited
     */
    user: User | null;

    /**
     * Called on close
     *
     * @returns - method that is called onClose
     */
    onClose: (success: boolean) => void;
}

export const UserAddOverlay = (props: UserAddOverlayProps) => {
    const { open = false, user: user = null, onClose = () => null } = props;

    const { configStore, monolithStore } = useRootStore();
    const { adminMode } = useSettings();
    const notification = useNotification();

    const isNewUser = user === null;

    const {
        control,
        reset,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<EditUserForm>({
        defaultValues: {
            id: user?.id,
            username: user?.username,
            name: user?.name,
            newEmail: user?.email,
            phone: user?.phone,
            phoneextension: user?.phoneextension,
            countrycode: user?.countrycode,
            admin: user?.admin,
            exporter: user?.exporter,
            publisher: user?.exporter,
            type: user?.type,
        },
    });

    useEffect(() => {
        // reset on open or close
        reset({
            ...(user || {}),
        });
    }, [user, open]);

    const type = watch('type', '');

    // TODO: Standardize
    const providers = configStore.store.config.providers.map((val) => ({
        name: capitalize(val),
        provider: capitalize(val),
    }));

    /**
     * Create / edit the user
     */
    const editUser = handleSubmit(
        async (data: EditUserForm) => {
            let success = false;

            try {
                let response: AxiosResponse<boolean> | null = null;
                if (isNewUser) {
                    response = await monolithStore.createUser(adminMode, data);
                } else {
                    response = await monolithStore.editMemberInfo(
                        adminMode,
                        data,
                    );
                }

                console.log(response);

                if (!response) {
                    return;
                }

                // ignore if there is no response
                if (response.data) {
                    notification.add({
                        color: 'success',
                        message: isNewUser
                            ? 'Successfully added user'
                            : 'Successfully editted user',
                    });

                    success = true;
                } else {
                    notification.add({
                        color: 'error',
                        message: isNewUser
                            ? 'Error adding user'
                            : 'Error editting user',
                    });
                }
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: String(e),
                });
            } finally {
                // close the overlay
                onClose(success);
            }
        },
        (e) => {
            console.warn(e);

            notification.add({
                color: 'error',
                message: 'Form is Invalid',
            });
        },
    );

    return (
        <Modal open={open} maxWidth="lg">
            <Modal.Title>Add Users</Modal.Title>
            <form onSubmit={editUser}>
                <StyledModalContent>
                    <StyledForm>
                        <Typography variant="subtitle1">Details</Typography>
                        <Controller
                            name={'name'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        label="Name"
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'newEmail'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        label="Email"
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value)
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
                                        <StyledCountryCodeExt
                                            label="Country Code"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        ></StyledCountryCodeExt>
                                    );
                                }}
                            />
                            <Controller
                                name="phone"
                                control={control}
                                rules={{
                                    validate: (value) => {
                                        if (value == '') {
                                            return true;
                                        }
                                        numberValidate(value);
                                    },
                                    pattern: {
                                        value: /^\(\d{3}\) \d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$/,
                                        message:
                                            'Phone number must be in the format (XXX) XXX-XXXX or XXX-XXX-XXXX',
                                    },
                                }}
                                render={({ field }) => {
                                    return (
                                        <Stack>
                                            <StyledPhoneNumber
                                                label="Phone Number"
                                                fullWidth
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
                                            ></StyledPhoneNumber>
                                            {errors.phone && (
                                                <StyledTypography
                                                    variant={'caption'}
                                                >
                                                    Note: Phone number must be
                                                    in the format (XXX) XXX-XXXX
                                                    or XXX-XXX-XXXX
                                                </StyledTypography>
                                            )}
                                        </Stack>
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
                                        <StyledCountryCodeExt
                                            label="Ext"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        ></StyledCountryCodeExt>
                                    );
                                }}
                            />
                        </Stack>

                        <Typography variant="subtitle1">Credentials</Typography>
                        <Controller
                            name="type"
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <Select
                                        label="Type"
                                        value={field.value ? field.value : ''}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                        }}
                                    >
                                        {providers.map((option, i) => {
                                            return (
                                                <Select.Item
                                                    value={option.provider}
                                                    key={i}
                                                >
                                                    {option.name}
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
                                        value={field.value ? field.value : ''}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
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
                                        value={field.value ? field.value : ''}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
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
                                        required: false,
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

                                {errors.password && (
                                    <StyledTypography variant={'caption'}>
                                        Note: Password must have one letter, one
                                        capital, one number, one special
                                        character, and be a minimum of 8
                                        characters.
                                    </StyledTypography>
                                )}
                            </>
                        )}
                        <StyledPermissions variant="subtitle1">
                            <strong>Permissions</strong>
                        </StyledPermissions>

                        <StyledList>
                            <StyledListItem
                                secondaryAction={
                                    <Controller
                                        name={'admin'}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <Switch
                                                    color="primary"
                                                    checked={field.value}
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
                            </StyledListItem>

                            <StyledListItem
                                secondaryAction={
                                    <Controller
                                        name={'publisher'}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <Switch
                                                    color="primary"
                                                    checked={field.value}
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
                            </StyledListItem>

                            <StyledListItem
                                secondaryAction={
                                    <Controller
                                        name={'exporter'}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <Switch
                                                    color="primary"
                                                    checked={field.value}
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
                            </StyledListItem>
                        </StyledList>
                    </StyledForm>
                </StyledModalContent>
                <Modal.Actions>
                    <Button variant="outlined" onClick={() => onClose(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => editUser()}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </form>
        </Modal>
    );
};
