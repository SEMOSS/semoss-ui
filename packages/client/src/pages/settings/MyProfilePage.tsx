import {
    Add,
    Delete,
    ContentCopyOutlined,
    EditRounded,
    ContentCopy,
    AccountCircle,
} from '@mui/icons-material';

import { useForm, Controller } from 'react-hook-form';
import {
    styled,
    Button,
    Typography,
    Stack,
    Table,
    IconButton,
    useNotification,
    Modal,
    Alert,
    TextField,
    Icon,
    Box,
    Grid,
    Paper,
    Avatar,
} from '@semoss/ui';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useState } from 'react';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 50px',
}));

const HeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
}));

const MessageDiv = styled('div')(({ theme }) => ({
    margin: '50px auto 75px',
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '13px',
    display: 'block',
    color: '#666',
    width: '100%',
}));

const ShadowedStack = styled(Stack)(({ theme }) => ({
    boxShadow: '0 0 10px #00000020',
    padding: '17.5px 20px',
    borderRadius: '15px',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    alignItems: 'center',
    display: 'flex',
    padding: 0,
}));

const ProfileImagePlaceholder = styled(Avatar)(({ theme }) => ({
    fontSize: '50px !important',
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

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
}));

interface CreateAccessKeyForm {
    TOKENNAME: string;
    TOKENDESCRIPTION?: string;
    ACCESSKEY: string;
    SECRETKEY: string;
}

interface EditUserInfoForm {
    NAME: string;
    USERNAME: string;
    EMAIL: string;
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

    // ### ---> old working control for new access key only
    // const { control, reset, setValue, handleSubmit, watch } =
    //     useForm<CreateAccessKeyForm>({
    //         defaultValues: {
    //             TOKENNAME: '',
    //             TOKENDESCRIPTION: '',
    //             ACCESSKEY: '',
    //             SECRETKEY: '',
    //         },
    //     });

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<CreateAccessKeyForm>({
            defaultValues: {
                TOKENNAME: '',
                TOKENDESCRIPTION: '',
                ACCESSKEY: '',
                SECRETKEY: '',
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
            EMAIL: email,
        },
    });

    const ACCESSKEY = watch('ACCESSKEY');
    const SECRETKEY = watch('SECRETKEY');

    // track if we can create a key
    const isCreated = ACCESSKEY && SECRETKEY ? true : false;

    /**
     * Submit edit profile info
     */
    const profileEditSubmit = async (data: EditUserInfoForm) => {
        try {
            // ### ---> need to confirm query string or monolithStore method

            console.log({
                'data.NAME': data.NAME,
                'data.USERNAME': data.USERNAME,
                'data.EMAIL': data.EMAIL,
            });

            // const response = await monolithStore.createUserAccessKey(
            //     data.NAME,
            //     data.USERNAME,
            //     data.EMAIL,
            // );

            // const response = await monolithStore.createUserAccessKey(
            //     data.TOKENNAME,
            //     data.TOKENDESCRIPTION || '',
            // );

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully edited user profile information',
            });

            // ### ---> reload page or just leave inputs not reset
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }

            // ### ---> reset user information in form?
        }
    };

    /**
     * Delete an accesskey
     * @param accessKey - delete an access key
     */
    const createAccessKey = async (data: CreateAccessKeyForm) => {
        try {
            // debugger;
            const output = await monolithStore.createUserAccessKey(
                data.TOKENNAME,
                data.TOKENDESCRIPTION || '',
            );

            // update the values
            setValue('ACCESSKEY', output.ACCESSKEY);
            setValue('SECRETKEY', output.SECRETKEY);

            console.log({ output });

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

    return (
        <>
            <StyledPaper>
                <Grid container spacing={3} sx={{ marginBottom: '35px' }}>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Edit profile information
                        </Typography>
                    </GridItem>

                    <GridItem sm={3}>
                        <Avatar sx={{ bgcolor: '#975FE4' }}>
                            {name[0].toUpperCase()}
                        </Avatar>

                        <Button
                            variant="text"
                            sx={{
                                textAlign: 'right',
                                fontWeight: '800',
                                marginLeft: '15px',
                            }}
                            onClick={() => {
                                setProfileImgModal(true);
                            }}
                            disabled
                        >
                            Upload
                        </Button>
                    </GridItem>
                </Grid>

                <Grid
                    container
                    spacing={3}
                    style={{ alignItems: 'flex-start' }}
                >
                    <GridItem sm={4}></GridItem>
                    <GridItem sm={8}>
                        <form
                            onSubmit={userInfoHandleSubmit(profileEditSubmit)}
                            style={{ width: '100%' }}
                        >
                            <Stack
                                direction="row"
                                spacing={2}
                                style={{ marginBottom: '15px' }}
                            >
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
                                                inputProps={{ maxLength: 255 }}
                                                fullWidth={true}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack
                                direction="row"
                                style={{ marginBottom: '15px' }}
                            >
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
                                                inputProps={{ maxLength: 500 }}
                                                fullWidth={true}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack
                                direction="row"
                                style={{ marginBottom: '15px' }}
                            >
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
                                                inputProps={{ maxLength: 500 }}
                                                fullWidth={true}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack direction="row">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    style={{
                                        fontWeight: '800',
                                        marginRight: '10px',
                                    }}
                                >
                                    Save
                                </Button>

                                <Button
                                    variant="text"
                                    color="primary"
                                    sx={{ fontWeight: '800', color: 'black' }}
                                    onClick={userInfoReset}
                                >
                                    Reset
                                </Button>
                            </Stack>
                        </form>
                    </GridItem>
                </Grid>
            </StyledPaper>

            <StyledPaper>
                <Grid container spacing={3}>
                    <GridItem sm={4}>
                        <Typography variant="h6">Monolith Endpoint</Typography>
                    </GridItem>

                    <GridItem sm={7}>
                        <p style={{ fontSize: '15px' }}>{process.env.MODULE}</p>
                    </GridItem>

                    <GridItem sm={1} style={{ justifyContent: 'right' }}>
                        <IconButton
                            title="Copy"
                            onClick={() => {
                                copy(process.env.MODULE);
                            }}
                        >
                            <ContentCopyOutlined />
                        </IconButton>
                    </GridItem>
                </Grid>
            </StyledPaper>

            <StyledPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Personal Access Tokens</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ textAlign: 'right' }}
                        onClick={() => {
                            setAddModal(true);
                        }}
                    >
                        New Key
                    </Button>
                </Stack>

                <Table.Container style={{ marginTop: '20px' }}>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <HeaderCell
                                    style={{ borderRadius: '20px 0 0 0' }}
                                >
                                    Name
                                </HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>Description</HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>Date Created</HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>Last Used Created</HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell
                                    style={{ borderRadius: '0 20px 0 0' }}
                                >
                                    Access Key
                                </HeaderCell>
                                {/* <HeaderCell>&nbsp;</HeaderCell> */}
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {getUserAccessKeys.status === 'SUCCESS' &&
                            getUserAccessKeys.data.length !== 0
                                ? getUserAccessKeys.data.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell>
                                                  {k.TOKENNAME}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.TOKENDESCRIPTION || ''}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.DATECREATED}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.LASTUSED}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.ACCESSKEY}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  <Stack
                                                      direction="row"
                                                      spacing={1}
                                                  >
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
                                                  </Stack>
                                              </Table.Cell>
                                          </Table.Row>
                                      );
                                  })
                                : null}
                        </Table.Body>
                    </Table>
                </Table.Container>
                {getUserAccessKeys.status === 'SUCCESS' &&
                    getUserAccessKeys.data.length === 0 && (
                        <MessageDiv style={{ margin: '75px auto 85px' }}>
                            No Personal Access Tokens to display at this time
                            <br />
                            Click New Key to create a new Personal Access Token
                        </MessageDiv>
                    )}
            </StyledPaper>

            <Modal open={addModal} onClose={() => closeModel()}>
                <Modal.Title>Generate Key</Modal.Title>
                <Modal.Content>
                    <form onSubmit={handleSubmit(createAccessKey)}>
                        <Stack direction="column" spacing={2}>
                            <Alert severity="info" variant="outlined">
                                Note: Your private key will only be generated
                                once
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
                                                field.value ? field.value : ''
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
                                                field.value ? field.value : ''
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
                                <>
                                    <Stack direction="column" spacing={1}>
                                        <Typography variant={'subtitle2'}>
                                            Access Key
                                        </Typography>
                                        <StyledCodeBlock>
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
                                                onClick={() => copy(ACCESSKEY)}
                                            >
                                                Copy
                                            </Button>
                                        </StyledCodeBlock>
                                    </Stack>
                                    <Stack direction="column" spacing={1}>
                                        <Typography variant={'subtitle2'}>
                                            Secret Key
                                        </Typography>
                                        <StyledCodeBlock>
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
                                                onClick={() => copy(SECRETKEY)}
                                            >
                                                Copy
                                            </Button>
                                        </StyledCodeBlock>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </form>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>

            {/* ### ---> test modal */}
            <Modal open={profileImgModal} onClose={() => closeModel()}>
                <Modal.Title>Upload Profile Picture</Modal.Title>
                <Modal.Content>
                    <Stack
                        direction="row"
                        spacing={2}
                        style={{ marginBottom: '15px', alignItems: 'center' }}
                    >
                        <ProfileImagePlaceholder />
                        <span>Current avatar</span>
                        <Avatar sx={{ bgcolor: '#975FE4' }}>
                            {name[0].toUpperCase()}
                        </Avatar>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={2}
                        style={{ marginBottom: '15px' }}
                    >
                        <form
                            onSubmit={() =>
                                console.log(
                                    'submit upload profile image placeholder callback',
                                )
                            }
                            style={{ width: '750px' }}
                        >
                            {/* <Controller
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
                            /> */}
                        </form>
                    </Stack>
                    {/* <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button> */}
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="contained" onClick={() => {}}>
                        Save
                    </Button>
                    <Button
                        variant="text"
                        onClick={() => closeProfileEditModel()}
                    >
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};
