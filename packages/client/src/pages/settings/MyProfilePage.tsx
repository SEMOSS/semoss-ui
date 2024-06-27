import {
    Add,
    Delete,
    ContentCopyOutlined,
    KeyboardArrowDown,
    KeyboardArrowUp,
} from '@mui/icons-material';

import { useForm, Controller } from 'react-hook-form';
import {
    useNotification,
    styled,
    Stack,
    Table,
    IconButton,
    Button,
    Typography,
    TextField,
    Avatar,
    Paper,
    Modal,
    Grid,
    Alert,
    Collapse,
} from '@semoss/ui';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useState } from 'react';
import { getSDKSnippet } from '@/utility';
const StyledAvatar = styled(Avatar)(({ theme }) => ({
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#975FE4',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 50px',
}));

const StyledAccessTokensPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 28px',
}));

const HeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
}));

const LeftHeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '20px 0 0 0',
    textAlign: 'center',
}));

const RightHeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '0 20px 0 0',
    textAlign: 'center',
}));

const MessageDiv = styled('div')(({ theme }) => ({
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '13px',
    display: 'block',
    color: '#666',
    width: '100%',
    margin: '75px auto 85px',
}));

const AvatarForm = styled('form')(({ theme }) => ({
    paddingTop: '15px',
    width: '750px',
}));

const CurrentAvatarStack = styled(Stack)(({ theme }) => ({
    alignItems: 'center',
}));

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
    marginTop: '20px',
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
    marginBottom: '40px',
}));

const MonolithGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    marginBottom: '15px',
}));

const CopyGridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
    display: 'flex',
    justifyContent: 'right',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
}));

const CustomGridItem = styled(GridItem)(({ theme }) => ({
    padding: 0,
    zIndex: 8,
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(5),
    background: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    overflowX: 'scroll',
    margin: '0px',
}));

const StyledCodeContent = styled('code', {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{
    /** Track if the page header is stuck */
    maxWidth?: string;
}>(({ theme, maxWidth }) => ({
    flex: 1,
    maxWidth: maxWidth ? maxWidth : 'auto',
    overflowY: 'scroll',
}));

const StyledSDKBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: '0px',
}));

const StyledCreatedKeyContainer = styled(Stack)(({ theme }) => ({
    background: theme.palette.background.default,
    padding: theme.spacing(1),
}));

interface CreateAccessKeyForm {
    TOKENNAME: string;
    TOKENDESCRIPTION?: string;
    ACCESSKEY: string;
    SECRETKEY: string;
    PLACEHOLDER: string;
}

interface EditUserInfoForm {
    NAME: string;
    USERNAME: string;
    EMAIL: string;
    USERID?: string | undefined;
}

export const MyProfilePage = () => {
    const notification = useNotification();
    const { configStore, monolithStore } = useRootStore();
    const { email, id, name, admin, loggedIn } = configStore.store.user;

    // track the models
    const [addModal, setAddModal] = useState(false);
    const [profileImgModal, setProfileImgModal] = useState(false);

    // get the keys
    const getUserAccessKeys = useAPI(['getUserAccessKeys']);

    // NATIVE Login USERID must match Username
    const logins = configStore.store.config.logins;
    const nativeLogin = logins['NATIVE'];

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<CreateAccessKeyForm>({
            defaultValues: {
                TOKENNAME: '',
                TOKENDESCRIPTION: '',
                ACCESSKEY: '',
                SECRETKEY: '',
                PLACEHOLDER: '',
            },
        });

    const {
        control: userInfoControl,
        reset: userInfoReset,
        setValue: userInfoSetValue,
        handleSubmit: userInfoHandleSubmit,
        watch: userInfoWatch,
    } = useForm<EditUserInfoForm>({
        defaultValues: {
            NAME: name,
            USERNAME: id,
            USERID: nativeLogin,
            EMAIL: email,
        },
    });

    const ACCESSKEY = watch('ACCESSKEY');
    const SECRETKEY = watch('SECRETKEY');

    // track if we can create a key
    const isCreated = ACCESSKEY && SECRETKEY ? true : false;

    const [isJsSdkOpen, setIsJsSdkOpen] = useState(false);
    const [isPySdkOpen, setIsPySdkOpen] = useState(false);

    /**
     * Submit edit profile info
     */
    const profileEditSubmit = async (data: EditUserInfoForm) => {
        try {
            // need to confirm reactor for runQuery or monolithStore method for editing profile
            console.log(data);

            const userObj = {
                password: '',
                id: nativeLogin,
                email: email,
                username: id,
                name: data.NAME,
            };

            data.USERID !== nativeLogin && (userObj['newId'] = data.USERID);
            data.USERNAME !== id && (userObj['newUsername'] = data.USERNAME);
            data.EMAIL !== email && (userObj['newEmail'] = data.EMAIL);

            const response = await monolithStore.editMemberInfo(true, userObj);

            notification.add({
                color: 'success',
                message: 'Successfully edited profile information',
            });
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        }
    };

    /**
     * Delete an accesskey
     * @param accessKey - delete an access key
     */
    const createAccessKey = async (data: CreateAccessKeyForm) => {
        try {
            const output = await monolithStore.createUserAccessKey(
                data.TOKENNAME,
                data.TOKENDESCRIPTION || '',
            );

            // update the values
            setValue('ACCESSKEY', output.ACCESSKEY);
            setValue('SECRETKEY', output.SECRETKEY);

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully created key',
            });
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        }
    };

    /**
     * Delete an accesskey
     * @param accessKey - delete an access key
     */
    const deleteAccessKey = async (accessKey: string) => {
        try {
            const response = await monolithStore.deleteUserAccessKeys(
                accessKey,
            );

            if (!response) {
                throw new Error('Error deleting key');
            }

            // refresh the keys
            getUserAccessKeys.refresh();

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully deleted key',
            });
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        }
    };

    /**
     * Callback that is triggered when the add modal closes
     */
    const closeModel = () => {
        // close it
        setAddModal(false);

        // a new key was added refresh the current keys
        if (isCreated) {
            getUserAccessKeys.refresh();
        }

        // reset the form
        reset({});
    };

    const closeProfileEditModel = () => {
        setProfileImgModal(false);
    };

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
    };

    if (
        getUserAccessKeys.status === 'INITIAL' ||
        getUserAccessKeys.status === 'LOADING'
    ) {
        return <LoadingScreen.Trigger description="Getting access keys" />;
    }
    const pySnippet = getSDKSnippet('py', ACCESSKEY, SECRETKEY);
    const jsSnippet = getSDKSnippet('js', ACCESSKEY, SECRETKEY);

    return (
        <Stack gap={3} className="my-profile-page">
            <StyledPaper>
                <StyledGrid container spacing={3}>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            {nativeLogin
                                ? 'Edit profile information'
                                : 'Profile Info'}
                        </Typography>
                    </GridItem>

                    <GridItem sm={0.6}>
                        <StyledAvatar>{name[0].toUpperCase()}</StyledAvatar>
                    </GridItem>

                    <GridItem sm={3}>
                        <Button
                            variant="text"
                            onClick={() => {
                                setProfileImgModal(true);
                            }}
                            disabled
                        >
                            Upload
                        </Button>
                    </GridItem>
                </StyledGrid>
                <Grid container spacing={3}>
                    <GridItem sm={4}>{/* spacer */}</GridItem>
                    <GridItem sm={8}>
                        {nativeLogin ? (
                            <form
                                onSubmit={userInfoHandleSubmit(
                                    profileEditSubmit,
                                )}
                            >
                                <StyledStack direction="row" spacing={2}>
                                    <Controller
                                        name={'NAME'}
                                        control={userInfoControl}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Name"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    inputProps={{
                                                        maxLength: 255,
                                                    }}
                                                    fullWidth={true}
                                                    disabled={!admin}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                </StyledStack>

                                <StyledStack direction="row">
                                    <Controller
                                        name={'USERID'}
                                        control={userInfoControl}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="User Id"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    inputProps={{
                                                        maxLength: 500,
                                                    }}
                                                    fullWidth={true}
                                                    disabled={!admin}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                </StyledStack>
                                <StyledStack direction="row">
                                    <Controller
                                        name={'USERNAME'}
                                        control={userInfoControl}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Username"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    inputProps={{
                                                        maxLength: 500,
                                                    }}
                                                    fullWidth={true}
                                                    disabled={!admin}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                </StyledStack>

                                <StyledStack direction="row">
                                    <Controller
                                        name={'EMAIL'}
                                        control={userInfoControl}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Email"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                            : ''
                                                    }
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    inputProps={{
                                                        maxLength: 500,
                                                    }}
                                                    fullWidth={true}
                                                    disabled={!admin}
                                                ></TextField>
                                            );
                                        }}
                                    />
                                </StyledStack>

                                <Stack direction="row">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        disabled={!admin}
                                    >
                                        Save
                                    </Button>

                                    <Button
                                        variant="text"
                                        color="inherit"
                                        onClick={() => {
                                            userInfoReset();
                                        }}
                                        disabled={!admin}
                                    >
                                        Reset
                                    </Button>
                                </Stack>
                            </form>
                        ) : (
                            <>
                                <StyledStack direction="row">
                                    <TextField
                                        label={'Login Type'}
                                        value={
                                            Object.keys(
                                                configStore.store.config
                                                    .loginDetails,
                                            )[0]
                                        }
                                        inputProps={{
                                            maxLength: 500,
                                        }}
                                        fullWidth={true}
                                        disabled
                                    ></TextField>
                                </StyledStack>
                                {Object.entries(configStore.store.user).map(
                                    (kv) => {
                                        if (
                                            kv[0] !== 'loggedIn' &&
                                            kv[0] !== 'admin'
                                        ) {
                                            return (
                                                <StyledStack
                                                    direction="row"
                                                    key={kv[0]}
                                                >
                                                    <TextField
                                                        label={
                                                            kv[0]
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            kv[0].slice(1)
                                                        }
                                                        value={kv[1]}
                                                        inputProps={{
                                                            maxLength: 500,
                                                        }}
                                                        fullWidth={true}
                                                        disabled
                                                    ></TextField>
                                                </StyledStack>
                                            );
                                        }
                                    },
                                )}
                            </>
                        )}
                    </GridItem>
                </Grid>
            </StyledPaper>

            <StyledPaper>
                <MonolithGrid container spacing={3}>
                    <CustomGridItem sm={11}>
                        <Typography variant="h6">Javascript SDK</Typography>
                    </CustomGridItem>
                    <CopyGridItem sm={1}>
                        <IconButton
                            title="Copy"
                            onClick={() => {
                                copy(jsSnippet);
                            }}
                        >
                            <ContentCopyOutlined />
                        </IconButton>
                    </CopyGridItem>
                </MonolithGrid>
                <MonolithGrid container spacing={3}>
                    <GridItem sm={12}>
                        <StyledSDKBlock>
                            <StyledCodeContent>{jsSnippet}</StyledCodeContent>
                        </StyledSDKBlock>
                    </GridItem>
                </MonolithGrid>
            </StyledPaper>

            <StyledPaper>
                <MonolithGrid container spacing={3}>
                    <CustomGridItem sm={11}>
                        <Typography variant="h6">Python SDK</Typography>
                    </CustomGridItem>

                    <CopyGridItem sm={1}>
                        <IconButton
                            title="Copy"
                            onClick={() => {
                                copy(pySnippet);
                            }}
                        >
                            <ContentCopyOutlined />
                        </IconButton>
                    </CopyGridItem>
                </MonolithGrid>
                <MonolithGrid container spacing={3}>
                    <GridItem sm={12}>
                        <StyledSDKBlock>
                            <StyledCodeContent>{pySnippet}</StyledCodeContent>
                        </StyledSDKBlock>
                    </GridItem>
                </MonolithGrid>
            </StyledPaper>

            <StyledAccessTokensPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Personal Access Tokens</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModal(true);
                        }}
                    >
                        New Key
                    </Button>
                </Stack>

                <StyledTableContainer>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <LeftHeaderCell align={'left'}>
                                    Name
                                </LeftHeaderCell>
                                <HeaderCell align={'left'}>
                                    Description
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Date Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Last Used Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Access Key
                                </HeaderCell>
                                <RightHeaderCell>&nbsp;</RightHeaderCell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {getUserAccessKeys.status === 'SUCCESS' &&
                            getUserAccessKeys.data.length !== 0
                                ? getUserAccessKeys.data.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell align={'left'}>
                                                  {k.TOKENNAME}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.TOKENDESCRIPTION || ''}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.DATECREATED}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.LASTUSED}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.ACCESSKEY}
                                              </Table.Cell>
                                              <Table.Cell align={'right'}>
                                                  <IconButton
                                                      title="Copy"
                                                      onClick={() => {
                                                          copy(k.ACCESSKEY);
                                                      }}
                                                  >
                                                      <ContentCopyOutlined />
                                                  </IconButton>
                                                  <IconButton
                                                      title="Delete"
                                                      onClick={() => {
                                                          deleteAccessKey(
                                                              k.ACCESSKEY,
                                                          );
                                                      }}
                                                  >
                                                      <Delete />
                                                  </IconButton>
                                              </Table.Cell>
                                          </Table.Row>
                                      );
                                  })
                                : null}
                        </Table.Body>
                    </Table>
                </StyledTableContainer>
                {getUserAccessKeys.status === 'SUCCESS' &&
                    getUserAccessKeys.data.length === 0 && (
                        <MessageDiv>
                            No Personal Access Tokens to display at this time
                            <br />
                            Click New Key to create a new Personal Access Token
                        </MessageDiv>
                    )}
            </StyledAccessTokensPaper>

            <Modal open={addModal} onClose={() => closeModel()} maxWidth="lg">
                <Modal.Title>Generate Key</Modal.Title>
                <Modal.Content>
                    <Stack sx={{ width: '800px' }} spacing={4}>
                        <form
                            onSubmit={handleSubmit(createAccessKey)}
                            className="my-profile-page__generate-key-form"
                        >
                            <Stack direction="column" spacing={2}>
                                <Alert severity="info">
                                    Note: Your private key will only be
                                    generated once
                                </Alert>

                                <Controller
                                    name={'TOKENNAME'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                required
                                                label="Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 255 }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Controller
                                    name={'TOKENDESCRIPTION'}
                                    control={control}
                                    rules={{ required: false }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Description"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 500 }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Stack direction="row" justifyContent={'start'}>
                                    <Button
                                        disabled={isCreated}
                                        type="submit"
                                        variant={'outlined'}
                                        color="primary"
                                    >
                                        Generate
                                    </Button>
                                </Stack>
                                {isCreated && (
                                    <StyledCreatedKeyContainer direction="column">
                                        <Stack direction="column" spacing={1}>
                                            <Typography variant={'subtitle2'}>
                                                Access Key
                                            </Typography>
                                            <StyledSDKBlock>
                                                <StyledCodeContent>
                                                    {ACCESSKEY}
                                                </StyledCodeContent>
                                                <Button
                                                    size={'medium'}
                                                    variant="outlined"
                                                    startIcon={
                                                        <ContentCopyOutlined
                                                            color={'inherit'}
                                                        />
                                                    }
                                                    onClick={() =>
                                                        copy(ACCESSKEY)
                                                    }
                                                >
                                                    Copy
                                                </Button>
                                            </StyledSDKBlock>
                                        </Stack>
                                        <Stack direction="column" spacing={1}>
                                            <Typography variant={'subtitle2'}>
                                                Secret Key
                                            </Typography>
                                            <StyledSDKBlock>
                                                <StyledCodeContent>
                                                    {SECRETKEY}
                                                </StyledCodeContent>
                                                <Button
                                                    size={'medium'}
                                                    variant="outlined"
                                                    startIcon={
                                                        <ContentCopyOutlined
                                                            color={'inherit'}
                                                        />
                                                    }
                                                    onClick={() =>
                                                        copy(SECRETKEY)
                                                    }
                                                >
                                                    Copy
                                                </Button>
                                            </StyledSDKBlock>
                                        </Stack>
                                        <Stack
                                            direction="column"
                                            spacing={1}
                                            className="my-profile-page__js-sdk-access key"
                                        >
                                            <Stack
                                                direction="row"
                                                justifyContent={'space-between'}
                                                alignItems={'center'}
                                            >
                                                <Typography
                                                    variant={'subtitle2'}
                                                >
                                                    Javascript Example
                                                </Typography>
                                                <IconButton
                                                    onClick={() => {
                                                        setIsJsSdkOpen(
                                                            !isJsSdkOpen,
                                                        );
                                                    }}
                                                >
                                                    {isJsSdkOpen ? (
                                                        <KeyboardArrowUp />
                                                    ) : (
                                                        <KeyboardArrowDown />
                                                    )}
                                                </IconButton>
                                            </Stack>

                                            <Collapse in={isJsSdkOpen}>
                                                <StyledSDKBlock>
                                                    <StyledCodeContent maxWidth="600px">
                                                        {jsSnippet}
                                                    </StyledCodeContent>
                                                    <Button
                                                        size={'medium'}
                                                        variant="outlined"
                                                        startIcon={
                                                            <ContentCopyOutlined
                                                                color={
                                                                    'inherit'
                                                                }
                                                            />
                                                        }
                                                        onClick={() =>
                                                            copy(jsSnippet)
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </StyledSDKBlock>
                                            </Collapse>
                                        </Stack>
                                        <Stack
                                            direction="column"
                                            spacing={1}
                                            className="my-profile-page__py-sdk-access key"
                                        >
                                            <Stack
                                                direction="row"
                                                justifyContent={'space-between'}
                                                alignItems={'center'}
                                            >
                                                <Typography
                                                    variant={'subtitle2'}
                                                >
                                                    Python Example
                                                </Typography>
                                                <IconButton
                                                    onClick={() => {
                                                        setIsPySdkOpen(
                                                            !isPySdkOpen,
                                                        );
                                                    }}
                                                >
                                                    {isPySdkOpen ? (
                                                        <KeyboardArrowUp />
                                                    ) : (
                                                        <KeyboardArrowDown />
                                                    )}
                                                </IconButton>
                                            </Stack>
                                            <Collapse in={isPySdkOpen}>
                                                <StyledSDKBlock>
                                                    <StyledCodeContent maxWidth="600px">
                                                        {pySnippet}
                                                    </StyledCodeContent>
                                                    <Button
                                                        size={'medium'}
                                                        variant="outlined"
                                                        startIcon={
                                                            <ContentCopyOutlined
                                                                color={
                                                                    'inherit'
                                                                }
                                                            />
                                                        }
                                                        onClick={() =>
                                                            copy(pySnippet)
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </StyledSDKBlock>
                                            </Collapse>
                                        </Stack>
                                    </StyledCreatedKeyContainer>
                                )}
                            </Stack>
                        </form>
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>

            <Modal
                open={profileImgModal}
                onClose={() => closeModel()}
                maxWidth="md"
            >
                <Modal.Title>Upload Profile Picture</Modal.Title>
                <Modal.Content>
                    <CurrentAvatarStack direction="row" spacing={2}>
                        <StyledAvatar>{name[0].toUpperCase()}</StyledAvatar>
                        <span>Current avatar</span>
                    </CurrentAvatarStack>

                    <Stack direction="row" spacing={2}>
                        <AvatarForm>
                            <Controller
                                name={'PLACEHOLDER'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Placeholder"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            inputProps={{ maxLength: 255 }}
                                            fullWidth={true}
                                        ></TextField>
                                    );
                                }}
                            />
                            <Modal.Actions>
                                <Button
                                    variant="contained"
                                    disabled
                                    type="submit"
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={() => closeProfileEditModel()}
                                >
                                    Close
                                </Button>
                            </Modal.Actions>
                        </AvatarForm>
                    </Stack>
                </Modal.Content>
            </Modal>
        </Stack>
    );
};
