import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';
import {
    styled,
    theme,
    Modal as oldModal,
    Form,
    Icon,
    Popover,
    Select,
    useNotification,
    // Switch,
    Grid,
    IconButton,
} from '@semoss/components';
import { Delete } from '@mui/icons-material';
import {
    List,
    Modal,
    Button,
    TextField,
    PhoneNumberPicker,
    Checkbox,
    Switch,
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

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
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
});

const StyledLoadWorkflowContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors['grey-2'],
    backgroundColor: theme.colors.base,
    marginTop: theme.space[4],
    border: `${theme.borderWidths.default} solid ${theme.colors['grey-4']}`,
    '@sm': {
        minHeight: '5rem',
    },
    '@md': {
        minHeight: '8rem',
    },
    '@lg': {
        minHeight: '10rem',
    },
    '@xl': {
        minHeight: '15rem',
    },
    '@xxl': {
        minHeight: '30rem',
    },
});

const StyledIcon = styled(Icon, {
    fontSize: '4rem',
});

const StyledHeaderIcon = styled(Icon, {
    height: '2rem',
    width: '2rem',
    marginRight: '.5rem',
    display: 'flex',
    alignItems: 'center',
});

const StyledButtonIcon = styled(Icon, {
    fontSize: '1rem',
});

const StyledSelectedApp = styled('div', {
    marginTop: theme.space[4],
});

const StyledSettings = styled('div', {
    marginBottom: theme.space[4],
});

const StyledCardHeader = styled(Card.Header, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.space['2'],
    paddingBottom: theme.space['0'],
});

const StyledLeft = styled('div', {
    display: 'flex',
    alignItems: 'center',
});

const StyledRight = styled('div', {
    display: 'flex',
    alignItems: 'center',
});

const StyledEnd = styled('div', {
    float: 'right',
    paddingBottom: theme.space['1'],
});

const StyledCardContent = styled(Card.Content, {
    fontSize: theme.fontSizes.sm,
    minHeight: '5rem',
});

const StyledCheckbox = styled('div', {
    paddingTop: theme.space['4'],
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
    const [pendingMember, setPendingMember] = useState<PendingMember>(null);

    const { configStore, monolithStore } = useRootStore();

    const { control, reset, handleSubmit, getValues } = useForm<{
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
        pendingId: string;
        pendingUsername: string;
        pendingName: string;
        pendingEmail: string;
        pendingType: string;
        pendingAdmin: boolean;
        pendingPublisher: boolean;
        pendingExporter: boolean;
        pendingPassword: string;
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

    const { dirtyFields } = useFormState({
        control,
    });

    // const { toggle, pendingMember.type } = watch();

    const providers = configStore.store.config.providers.map((val) =>
        capitalize(val),
    );

    const updateAdmin = () => {
        monolithStore['editMemberInfo'](adminMode, activeMember).then(() => {
            const message = `You have successfully updated user information`;
            notification.add({
                color: 'success',
                content: message,
            });
            getMembers.refresh();
        });
    };

    const updateActiveMember = handleSubmit(() => {
        monolithStore['editMemberInfo'](adminMode, activeMember)
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

    const createUser = (member: PendingMember) => {
        monolithStore['createUser'](adminMode, member).then((resp) => {
            console.log(resp);
            if (resp.data) {
                const message = `You have successfully added new user(s)`;
                notification.add({
                    color: 'success',
                    content: message,
                });
                getMembers.refresh();
                const newMember = members.find((m) => {
                    m.id == member.id;
                });
                setActiveMember(newMember);
                setPendingMember({
                    id: '',
                    username: '',
                    name: '',
                    email: '',
                    type: null,
                    admin: false,
                    publisher: false,
                    exporter: false,
                });
                setAddMemberModal(false);
            }
        });
    };

    /**
     * @name getDisplay
     * @desc gets display options for the Insight dropdown
     * @param option - the object that is specified for the option
     */
    const getDisplay = (option) => {
        return `${option.id} - ${option.name} - ${option.email}`;
    };

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
        console.log(memberInfoModal);
        console.log(activeMember);
        return (
            <>
                {activeMember && (
                    <>
                        <Modal.Title>{activeMember.username}</Modal.Title>
                        <Modal.Content>
                            <TextField
                                value={activeMember.id}
                                label="User Id"
                                onChange={(e) => {
                                    activeMember['newId'] = e.target.value;
                                }}
                                placeholder="User ID"
                            />
                            <TextField
                                label="Username"
                                value={activeMember.username}
                                placeholder="Username"
                            />
                            <TextField
                                label="Name"
                                value={activeMember.name}
                                helperText="Name is Required"
                                required
                            />
                            <TextField
                                label="Password"
                                type="password"
                                value={activeMember.password}
                                placeholder="********"
                            />
                            <TextField
                                label="Email"
                                helperText="Email is required"
                                value={activeMember.email}
                            />
                            <PhoneNumberPicker
                                defaultCountry={'us'}
                                onChange={() => console.log('hi')}
                                value={activeMember.phone || '+1 '}
                            />
                            {console.log(activeMember.publisher)}
                            <Checkbox
                                label="Publisher?"
                                labelPlacement="start"
                                checked={activeMember?.publisher}
                            />
                            <Checkbox
                                label="Exporter"
                                labelPlacement="start"
                                checked={activeMember?.exporter}
                            />
                            Make Admin?{' '}
                            <Switch edge="start" checked={activeMember.admin} />
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => setMemberInfoModal(false)}>
                                Close
                            </Button>
                        </Modal.Actions>
                    </>
                )}
            </>
        );
    };
    const buildListItems = () => {
        return members.map((mem) => {
            return (
                <List.Item
                    divider
                    secondaryAction={
                        <List.ItemButton
                            onClick={() => {
                                deleteActiveMember(mem);
                            }}
                        >
                            <Delete />
                        </List.ItemButton>
                    }
                >
                    <List.ItemButton
                        onClick={() => {
                            setActiveMember(mem);
                            // reset(mem)
                            setMemberInfoModal(true);
                            buildMemberModal();
                        }}
                    >
                        <List.ItemText
                            primary={mem.username}
                            secondary={mem.name}
                        />
                    </List.ItemButton>
                </List.Item>
            );
        });
    };
    return (
        <div>
            <StyledContainer>
                <StyledEnd>
                    <Button
                        variant="outlined"
                        prepend={<StyledButtonIcon path={mdiPlusThick} />}
                        style={{ textAlign: 'right', marginRight: 0 }}
                        onClick={() => {
                            setAddMemberModal(true);
                            setPendingMember({
                                id: '',
                                username: '',
                                name: '',
                                email: '',
                                type: null,
                                admin: false,
                                publisher: false,
                                exporter: false,
                            });
                        }}
                    >
                        Add New Member
                    </Button>
                </StyledEnd>
                <div>
                    <Select
                        value={activeMember}
                        options={members}
                        getDisplay={getDisplay}
                        onChange={(opt: Member) => {
                            // Set selected Member
                            setActiveMember(opt);
                            reset(opt);
                        }}
                        placeholder="Select an option to view member specific settings"
                    ></Select>
                    {members && <List>{buildListItems()}</List>}
                    {activeMember ? (
                        <div>
                            <StyledSelectedApp>
                                <StyledSettings>
                                    <Grid>
                                        <Grid.Item
                                            responsive={{
                                                sm: 12,
                                                md: 6,
                                                lg: 5,
                                                xl: 4,
                                            }}
                                        >
                                            <Card>
                                                <StyledCardHeader>
                                                    <StyledLeft>
                                                        <StyledHeaderIcon
                                                            path={
                                                                mdiAccountPlus
                                                            }
                                                        ></StyledHeaderIcon>
                                                        <div>Admin</div>
                                                    </StyledLeft>
                                                    <StyledRight>
                                                        <Switch
                                                            title={`Make Admin`}
                                                            value={
                                                                activeMember.admin
                                                            }
                                                            onClick={() => {
                                                                activeMember.admin =
                                                                    activeMember.admin !=
                                                                    null
                                                                        ? !activeMember.admin
                                                                        : true;
                                                                updateAdmin();
                                                            }}
                                                        ></Switch>
                                                    </StyledRight>
                                                </StyledCardHeader>
                                                <StyledCardContent>
                                                    Toggle whether{' '}
                                                    {activeMember.name} is
                                                    admin.
                                                </StyledCardContent>
                                            </Card>
                                        </Grid.Item>
                                        <Grid.Item
                                            responsive={{
                                                sm: 12,
                                                md: 6,
                                                lg: 5,
                                                xl: 4,
                                            }}
                                        >
                                            <Card>
                                                <StyledCardHeader>
                                                    <StyledLeft>
                                                        <StyledHeaderIcon
                                                            path={mdiDelete}
                                                        ></StyledHeaderIcon>
                                                        <div>Delete User</div>
                                                    </StyledLeft>
                                                    <StyledRight>
                                                        <Button
                                                            color={'error'}
                                                            title={`Delete User`}
                                                            onClick={() => {
                                                                deleteActiveMember(
                                                                    activeMember,
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </StyledRight>
                                                </StyledCardHeader>
                                                <StyledCardContent>
                                                    Delete user
                                                    {activeMember.name
                                                        ? ` ${activeMember.name}.`
                                                        : `.`}
                                                </StyledCardContent>
                                            </Card>
                                        </Grid.Item>
                                        <Grid.Item span={12}>
                                            <Card>
                                                <StyledCardContent>
                                                    <Form>
                                                        <Field
                                                            name="id"
                                                            control={control}
                                                            rules={{}}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'User ID',
                                                            }}
                                                            label="User ID"
                                                            onChange={(val) => {
                                                                activeMember[
                                                                    'newId'
                                                                ] = val;
                                                            }}
                                                        />
                                                        <Field
                                                            name="username"
                                                            control={control}
                                                            rules={{}}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Username',
                                                            }}
                                                            label="Username"
                                                        />
                                                        <Field
                                                            name="name"
                                                            control={control}
                                                            rules={{
                                                                required:
                                                                    getValues(
                                                                        'type',
                                                                    ),
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Name',
                                                            }}
                                                            error="Name is required"
                                                            label="Name"
                                                        />
                                                        <Field
                                                            name="password"
                                                            control={control}
                                                            rules={{
                                                                required:
                                                                    dirtyFields.password,
                                                                minLength: 8,
                                                                validate: (
                                                                    value,
                                                                ) =>
                                                                    passwordValidate(
                                                                        value,
                                                                    ),
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                type: 'password',
                                                                placeholder:
                                                                    '********',
                                                            }}
                                                            error="Please enter a valid password"
                                                            label="Password"
                                                        />
                                                        {dirtyFields.password && (
                                                            <Popover>
                                                                <Popover.Trigger>
                                                                    <IconButton size="sm">
                                                                        <StyledIcon
                                                                            path={
                                                                                mdiInformation
                                                                            }
                                                                        ></StyledIcon>
                                                                    </IconButton>
                                                                </Popover.Trigger>
                                                                <Popover.Content
                                                                    side="right"
                                                                    align="end"
                                                                >
                                                                    <div>
                                                                        <span>
                                                                            Password
                                                                            must:
                                                                        </span>
                                                                    </div>
                                                                    <ul>
                                                                        <li id="letter">
                                                                            have{' '}
                                                                            <b>
                                                                                one
                                                                                letter
                                                                            </b>
                                                                        </li>
                                                                        <li id="capital">
                                                                            have{' '}
                                                                            <b>
                                                                                one
                                                                                capital
                                                                            </b>
                                                                        </li>
                                                                        <li id="number">
                                                                            have{' '}
                                                                            <b>
                                                                                one
                                                                                number
                                                                            </b>
                                                                        </li>
                                                                        <li id="special">
                                                                            have
                                                                            <b>
                                                                                {' '}
                                                                                one
                                                                                special
                                                                                character
                                                                            </b>
                                                                        </li>
                                                                        <li id="length">
                                                                            be a
                                                                            minimum
                                                                            of
                                                                            <b>
                                                                                {' '}
                                                                                8
                                                                                characters
                                                                            </b>
                                                                        </li>
                                                                    </ul>
                                                                </Popover.Content>
                                                            </Popover>
                                                        )}

                                                        <Field
                                                            name="email"
                                                            control={control}
                                                            rules={{
                                                                required: true,
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Email',
                                                            }}
                                                            error="Email is required"
                                                            label="Email"
                                                        />
                                                        <Field
                                                            name="phone"
                                                            control={control}
                                                            rules={{
                                                                pattern:
                                                                    /^[()-.\s0-9]{8,}$/,
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Phone Number',
                                                            }}
                                                            error="Please enter a valid phone number"
                                                            label="Phone Number"
                                                        />
                                                        <Field
                                                            name="phoneextension"
                                                            control={control}
                                                            rules={{
                                                                pattern:
                                                                    /^[+0-9]{0,6}$/,
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Phone Extension',
                                                            }}
                                                            error="Please enter a valid phone extension"
                                                            label="Phone Extension"
                                                        />
                                                        <Field
                                                            name="countrycode"
                                                            control={control}
                                                            rules={{
                                                                pattern:
                                                                    /^[+0-9]{0,6}$/,
                                                            }}
                                                            options={{
                                                                component:
                                                                    'input',
                                                                placeholder:
                                                                    'Country Code',
                                                            }}
                                                            error="Please enter a valid country code"
                                                            label="Country Code"
                                                        />
                                                        <Field
                                                            name="type"
                                                            control={control}
                                                            rules={{}}
                                                            options={{
                                                                component:
                                                                    'select',
                                                                options:
                                                                    providers,
                                                                placeholder:
                                                                    'Type',
                                                            }}
                                                            label="Type"
                                                        />
                                                        <StyledCheckbox>
                                                            <Field
                                                                name="publisher"
                                                                control={
                                                                    control
                                                                }
                                                                rules={{}}
                                                                options={{
                                                                    component:
                                                                        'checkbox',
                                                                    children:
                                                                        'Publisher',
                                                                }}
                                                            />
                                                        </StyledCheckbox>
                                                        <StyledCheckbox>
                                                            <Field
                                                                name="exporter"
                                                                control={
                                                                    control
                                                                }
                                                                rules={{}}
                                                                options={{
                                                                    component:
                                                                        'checkbox',
                                                                    children:
                                                                        'Exporter',
                                                                }}
                                                            />
                                                        </StyledCheckbox>
                                                        <StyledSelectedApp>
                                                            <Button
                                                                onClick={() =>
                                                                    updateActiveMember()
                                                                }
                                                            >
                                                                Update
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setActiveMember(
                                                                        null,
                                                                    );
                                                                }}
                                                                variant="text"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </StyledSelectedApp>
                                                    </Form>
                                                </StyledCardContent>
                                            </Card>
                                        </Grid.Item>
                                    </Grid>
                                </StyledSettings>
                            </StyledSelectedApp>
                        </div>
                    ) : (
                        <StyledLoadWorkflowContainer>
                            <StyledIcon
                                size="xl"
                                path={mdiTextBoxMultipleOutline}
                            ></StyledIcon>
                            <p>SEMOSS is waiting on your selection</p>
                        </StyledLoadWorkflowContainer>
                    )}{' '}
                </div>
            </StyledContainer>

            {/* MemberInfoModal */}
            <Modal open={memberInfoModal}>{buildMemberModal()}</Modal>
            {/* Add New User Modal */}
            {/* <oldModal
                open={addMemberModal}
                onOpen={(open) => {
                    setAddMemberModal(open);
                }}
                onClose={() => {
                    setAddMemberModal(false);
                }}
            >
                <oldModal.Content size={'lg'}>
                    <oldModal.Header description="Enter the data of the members you would like to add:">
                        Add Member
                    </oldModal.Header>
                    <oldModal.Body>
                        <Form>
                            <div>
                                <Field
                                    name="pendingId"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'User ID',
                                    }}
                                    label="User ID"
                                    onChange={(val) => {
                                        pendingMember.id = val;
                                    }}
                                />
                                <Field
                                    name="pendingUsername"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Username',
                                    }}
                                    label="Username"
                                    onChange={(val) => {
                                        pendingMember.username = val;
                                    }}
                                />
                                <Field
                                    name="pendingName"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Name',
                                    }}
                                    label="Name"
                                    onChange={(val) => {
                                        pendingMember.name = val;
                                    }}
                                />
                                <Field
                                    name="pendingEmail"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'input',
                                        placeholder: 'Email',
                                    }}
                                    label="Email"
                                    onChange={(val) => {
                                        pendingMember.email = val;
                                    }}
                                />
                                {pendingMember?.type == 'Native' && (
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
                                                            path={
                                                                mdiInformation
                                                            }
                                                        ></StyledIcon>
                                                    </IconButton>
                                                </Popover.Trigger>
                                                <Popover.Content
                                                    side="right"
                                                    align="end"
                                                >
                                                    <div>
                                                        <span>
                                                            Password must:
                                                        </span>
                                                    </div>
                                                    <ul>
                                                        <li id="letter">
                                                            have{' '}
                                                            <b>one letter</b>
                                                        </li>
                                                        <li id="capital">
                                                            have{' '}
                                                            <b>one capital</b>
                                                        </li>
                                                        <li id="number">
                                                            have{' '}
                                                            <b>one number</b>
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
                                <Field
                                    name="pendingType"
                                    control={control}
                                    rules={{}}
                                    options={{
                                        component: 'select',
                                        options: providers,
                                        placeholder: 'Type',
                                    }}
                                    label="Type"
                                    onChange={(val) => {
                                        pendingMember.type = val;
                                    }}
                                />
                                <StyledCheckbox>
                                    <Field
                                        name="pendingAdmin"
                                        control={control}
                                        rules={{}}
                                        options={{
                                            component: 'checkbox',
                                            children: 'Admin',
                                        }}
                                        onChange={(val) => {
                                            pendingMember.admin = val;
                                        }}
                                    />
                                </StyledCheckbox>
                                <StyledCheckbox>
                                    <Field
                                        name="pendingPublisher"
                                        control={control}
                                        rules={{}}
                                        options={{
                                            component: 'checkbox',
                                            children: 'Publisher',
                                        }}
                                        onChange={(val) => {
                                            pendingMember.publisher = val;
                                        }}
                                    />
                                </StyledCheckbox>
                                <StyledCheckbox>
                                    <Field
                                        name="pendingExporter"
                                        control={control}
                                        rules={{}}
                                        options={{
                                            component: 'checkbox',
                                            children: 'Exporter',
                                        }}
                                        onChange={(val) => {
                                            pendingMember.exporter = val;
                                        }}
                                    />
                                </StyledCheckbox>
                                <StyledSelectedApp>
                                    <Button
                                        onClick={() => {
                                            createUser(pendingMember);
                                        }}
                                        color="primary"
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setPendingMember(null);
                                            reset();
                                            setAddMemberModal(false);
                                        }}
                                        variant="text"
                                    >
                                        Cancel
                                    </Button>
                                </StyledSelectedApp>
                            </div>
                        </Form>
                    </oldModal.Body>
                </oldModal.Content>
            </oldModal> */}
        </div>
    );
};
